import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { RunRequestSchema } from "@/lib/ai/schemas";
import type { AskEvent } from "@/lib/ask/types";
import type { FitEvent } from "@/lib/fit-check/types";
import { addSpend } from "@/lib/server/budget";
import { serverEnv, type ServerEnv } from "@/lib/server/env";
import { logRun, type RunLogger } from "@/lib/server/log-run";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { clientIp, visitorId } from "@/lib/server/visitor";
import { runAsk } from "./ask";
import { newRecord, runCost, type RunContext, type RunRecord } from "./context";
import { runFit, type FitDeps } from "./fit";

/**
 * `/api/run` (SPEC §6–8, §10): one endpoint, one knowledge base, three modes. Order of checks:
 * Zod validation → Turnstile → (inside each mode) rate limit → budget → model. Afterwards the
 * run's real cost goes on the monthly counter and its metrics (never the visitor's text) are logged.
 */

/** SPEC §10: a run ends at 60 s. */
export const RUN_TIMEOUT_MS = 60_000;

export type HandleDeps = {
  logger?: RunLogger;
  verify?: typeof verifyTurnstile;
  fit?: FitDeps;
  env?: ServerEnv;
  now?: () => number;
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

async function finish(rec: RunRecord, env: ServerEnv, logger: RunLogger, now: () => number) {
  if (rec.finished) return;
  rec.finished = true;
  const cost = runCost(rec);
  try {
    await addSpend(cost, env);
  } catch (e) {
    console.error("budget update failed:", e instanceof Error ? e.message : e);
  }
  if (!rec.log) return;
  try {
    await logger(
      {
        id: rec.runId,
        mode: rec.mode,
        drill: rec.drill,
        branch: rec.branch,
        steps: rec.steps,
        guard_fired: rec.guardFired.length ? [...new Set(rec.guardFired)].join(", ") : null,
        retries: rec.retries,
        requirement_count: rec.requirements,
        sources_retrieved: rec.sourcesRetrieved,
        sources_cited: rec.sourcesCited,
        fallback: rec.fallback,
        model: rec.model || "none",
        input_tokens: rec.tokens.input + rec.tokens.cacheWrite,
        output_tokens: rec.tokens.output,
        cached_tokens: rec.tokens.cacheRead,
        cost_usd: Math.round(cost * 1e5) / 1e5,
        latency_ms: Math.round(now() - rec.startedAt),
        prompt_version: PROMPT_VERSION,
      },
      env,
    );
  } catch (e) {
    console.error("run log failed:", e instanceof Error ? e.message : e);
  }
}

export async function handleRun(request: Request, deps: HandleDeps = {}): Promise<Response> {
  let env: ServerEnv;
  try {
    env = deps.env ?? serverEnv();
  } catch (e) {
    console.error("bad server env:", e instanceof Error ? e.message : e);
    return json({ status: "error" }, 500);
  }
  const now = deps.now ?? (() => performance.now());
  const logger = deps.logger ?? logRun;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ status: "error" }, 400);
  }
  const parsed = RunRequestSchema.safeParse(raw);
  if (!parsed.success) return json({ status: "error" }, 400);
  const req = parsed.data;

  const ip = clientIp(request.headers);
  const human = await (deps.verify ?? verifyTurnstile)(req.turnstileToken, ip, env);
  if (!human.ok) return json({ status: "error" }, 403);

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(RUN_TIMEOUT_MS)]);
  const ctx: RunContext = { env, visitor: visitorId(ip, env), signal, now };
  const rec = newRecord(req.mode, now);

  // Fit and Ask: NDJSON, one event per line, flushed as each step happens.
  const events: AsyncGenerator<FitEvent | AskEvent> = req.mode === "ask" ? runAsk(req, ctx, rec) : runFit(req, ctx, rec, deps.fit);
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          await finish(rec, env, logger, now);
          controller.close();
          return;
        }
        controller.enqueue(enc.encode(JSON.stringify(value) + "\n"));
      } catch (e) {
        await finish(rec, env, logger, now);
        controller.error(e);
      }
    },
    async cancel() {
      await events.return(undefined);
      await finish(rec, env, logger, now);
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
