/**
 * Promptfoo provider: runs one eval case through the real `/api/run` handler, in-process
 * (lib/run/handle.ts). Same validation, prompts, model calls, guards and verdict template as the
 * site; only Turnstile and run logging are switched off, and each case gets its own visitor so
 * the rate limits never cut a run short. Nothing is stored (SPEC §10).
 *
 * The real model runs when ANTHROPIC_API_KEY is set. Without it the run uses AI_FAKE, which
 * replays the design's sample outputs: a check that the harness works, never an eval result.
 * scripts/eval-results.mjs refuses to publish a fake run.
 */
import type { ApiProvider, CallApiContextParams, ProviderResponse } from "promptfoo";
import { handleRun } from "@/lib/run/handle";
import { FitEventSchema } from "@/lib/fit-check/types";
import { AskEventSchema } from "@/lib/ask/types";
import { SandboxReplySchema } from "@/lib/ai/schemas";
import { serverEnv, type ServerEnv } from "@/lib/server/env";

export type EvalMode = "fit" | "ask" | "sandbox";

/** What the assertions see: the run's last event (or the sandbox reply) plus any schema errors. */
export type EvalOutput = {
  mode: EvalMode;
  fake: boolean;
  /** Fit: the `result` or `fallback` event. Ask: the `result` event. Sandbox: the JSON response. */
  result: unknown;
  /** Every streamed line, validated against the site's own event schemas. */
  events: number;
  schemaErrors: string[];
};

export function evalEnv(): ServerEnv & { fake: boolean } {
  const base = serverEnv();
  const fake = !base.ANTHROPIC_API_KEY;
  return {
    ...base,
    AI_FAKE: fake ? "1" : undefined,
    VERCEL_ENV: undefined,
    // Evals never touch the site's shared counters or run log.
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    SUPABASE_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    fake,
  };
}

let seq = 0;

export default class SiteRunProvider implements ApiProvider {
  id() {
    return "site:/api/run";
  }

  async callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse> {
    const mode = context?.vars?.mode as EvalMode | undefined;
    if (mode !== "fit" && mode !== "ask" && mode !== "sandbox") return { error: `unknown mode: ${String(mode)}` };
    const { fake, ...env } = evalEnv();
    const field = mode === "fit" ? "jd" : mode === "ask" ? "question" : "attempt";
    const ip = `198.51.100.${(seq++ % 250) + 1}`;
    const request = new Request("http://localhost/api/run", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ mode, [field]: prompt, turnstileToken: "" }),
    });
    const res = await handleRun(request, { env, verify: async () => ({ ok: true }), logger: async () => {} });
    const out: EvalOutput = { mode, fake, result: null, events: 0, schemaErrors: [] };
    if (mode === "sandbox") {
      const body: unknown = await res.json();
      out.result = body;
      out.events = 1;
      const reply = (body as { reply?: unknown }).reply;
      if (reply !== undefined) {
        const p = SandboxReplySchema.safeParse(reply);
        if (!p.success) out.schemaErrors.push(p.error.message);
      }
    } else {
      const schema = mode === "fit" ? FitEventSchema : AskEventSchema;
      const lines = (await res.text()).trim().split("\n").filter(Boolean);
      out.events = lines.length;
      for (const line of lines) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch {
          out.schemaErrors.push(`not JSON: ${line.slice(0, 80)}`);
          continue;
        }
        const p = schema.safeParse(parsed);
        if (!p.success) out.schemaErrors.push(p.error.message);
        out.result = parsed;
      }
    }
    const trace = (out.result as { trace?: { costUsd?: number } } | null)?.trace ?? (out.result as { answer?: { trace?: { costUsd?: number } }; reply?: { trace?: { costUsd?: number } } } | null)?.answer?.trace ?? (out.result as { reply?: { trace?: { costUsd?: number } } } | null)?.reply?.trace;
    return { output: JSON.stringify(out), cost: trace?.costUsd ?? 0, metadata: { fake } };
  }
}
