import { getModel, type ResolvedModel } from "@/lib/ai/model";
import { ASK_SYSTEM, askKbBlock, askPrompt } from "@/lib/ai/prompts";
import { AskOutputSchema, type AskRun, type FailStatus } from "@/lib/ai/schemas";
import type { AskEvent, AskTool, SessionMemory } from "@/lib/ask/types";
import { kbSearch } from "@/lib/kb/search";
import { KB, KB_SCOPES, formatEntries, type KbEntry } from "@/lib/kb/snapshot";
import { budgetLeft } from "@/lib/server/budget";
import { checkLimit } from "@/lib/server/ratelimit";
import { addUsage, displayCost, runCost, type RunContext, type RunRecord } from "./context";
import { guardAsk } from "./guards";
import { hook, untilAborted } from "./hooks";
import { LlmError, callLlm } from "./llm";

/**
 * Ask my work and Break my AI (mode "ask"), SPEC §8.
 * One prompt each over the same knowledge base; no tools. A failed or limited attempt isn't
 * logged or counted (rec.log = false).
 */


const LIMITS = {
  ask: { maxOutputTokens: 1500, effort: "low" as const },
};

/** The whole KB, identical on every request so the cached prefix is reused. */
const KB_BLOCK = askKbBlock(formatEntries(KB));

function memoryBlock(m: SessionMemory): string {
  return [
    `role: ${m.role}`,
    `matches: ${m.matchCount}`,
    ...m.gaps.map((g) => `gap: ${g.req} | closest: ${g.closest}${g.close ? ` | close: ${g.close}` : ""}`),
  ].join("\n");
}

type ModelFor = (ctx: RunContext) => Promise<ResolvedModel>;
const chatModel: ModelFor = (ctx) => getModel("chat", ctx.env);

/** Shared gate: the Ask bucket (30/hour, also Break my AI), then the budget. */
async function gate(text: string, ctx: RunContext): Promise<FailStatus | null> {
  if (hook(ctx.env, text, "limited") || !(await checkLimit("ask", ctx.visitor, ctx.env))) return "limited";
  if (hook(ctx.env, text, "budget") || !(await budgetLeft(ctx.env))) return "budget";
  return null;
}

/** One model call with the run's single retry. */
async function withRetry<T>(rec: RunRecord, signal: AbortSignal, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof LlmError) addUsage(rec, e.tokens);
    if (signal.aborted) throw e;
    rec.retries = 1;
    try {
      return await fn();
    } catch (e2) {
      if (e2 instanceof LlmError) addUsage(rec, e2.tokens);
      throw e2;
    }
  }
}

/** The step `kb.search` runs for a question: the same deterministic search as the fit check, over every scope. */
export function askSearch(question: string): KbEntry[] {
  return kbSearch([question], KB_SCOPES);
}

/**
 * Ask streams its real steps (SPEC §8): `kb.search` (deterministic), `compose` (the model call),
 * `guardrails` (the citation and honesty check on the written answer), then one `result`.
 * The limit and budget gates run first, so a blocked question gets only the `result`.
 */
export async function* runAsk(req: AskRun, ctx: RunContext, rec: RunRecord, modelFor: ModelFor = chatModel): AsyncGenerator<AskEvent> {
  rec.log = false;
  const blocked = await gate(req.question, ctx);
  if (blocked) {
    yield { type: "result", status: blocked };
    return;
  }
  const step = (tool: AskTool, status: "running" | "done", ms?: number): AskEvent => {
    if (status === "done") rec.steps.push({ tool, status, ms: ms ?? 0 });
    return { type: "step", tool, status, ...(ms !== undefined ? { ms } : {}) };
  };
  const since = (t0: number) => Math.round(ctx.now() - t0);
  try {
    const model = await modelFor(ctx);
    rec.model = model.id;
    const memory = req.memory ?? null;

    yield step("kb.search", "running");
    let t0 = ctx.now();
    const likely = askSearch(req.question).map((e) => e.id);
    yield step("kb.search", "done", since(t0));

    yield step("compose", "running");
    t0 = ctx.now();
    if (hook(ctx.env, req.question, "hold")) await untilAborted(ctx.signal);
    const out = await withRetry(rec, ctx.signal, async () => {
      const r = await callLlm({
        model,
        system: ASK_SYSTEM,
        cachedContext: KB_BLOCK,
        prompt: askPrompt(req.question, memory ? memoryBlock(memory) : null, likely),
        schema: AskOutputSchema,
        signal: ctx.signal,
        ...LIMITS.ask,
      });
      addUsage(rec, r.tokens);
      return r.output;
    });
    yield step("compose", "done", since(t0));

    yield step("guardrails", "running");
    t0 = ctx.now();
    const { fired, ...answer } = guardAsk(out, memory !== null, req.question);
    if (fired) rec.guardFired.push(fired);
    yield step("guardrails", "done", since(t0));

    rec.log = true;
    yield {
      type: "result",
      status: "ok",
      answer: { ...answer, trace: { runId: rec.runId, costUsd: displayCost(runCost(rec)), ms: Math.round(ctx.now() - rec.startedAt) } },
    };
  } catch (e) {
    if (!ctx.signal.aborted) console.error("ask failed:", e instanceof Error ? e.message : e);
    rec.log = false;
    yield { type: "result", status: "error" };
  }
}
