import { fallback as precomputed } from "@/content/kb/fallback";
import { getModel, type ResolvedModel } from "@/lib/ai/model";
import { EVIDENCE_MAP_SYSTEM, JD_PARSE_SYSTEM, evidenceMapPrompt, jdParsePrompt } from "@/lib/ai/prompts";
import { EvidenceMapSchema, JdParseSchema, type EvidenceCard, type FitRun } from "@/lib/ai/schemas";
import { isLink } from "@/lib/fit-check/copy";
import type { FallbackEvent, FitEvent, FitTool, TraceLine } from "@/lib/fit-check/types";
import { KB, formatEntries, type KbEntry } from "@/lib/kb/snapshot";
import { kbSearch } from "@/lib/kb/search";
import { budgetLeft } from "@/lib/server/budget";
import { checkLimit } from "@/lib/server/ratelimit";
import { addUsage, displayCost, runCost, type RunContext, type RunRecord } from "./context";
import { fetchUrl } from "./fetch-url";
import { guardCitations, guardHonesty, NO_SOURCE_CLOSEST } from "./guards";
import { hook, untilAborted } from "./hooks";
import { LlmError, callLlm } from "./llm";
import { composeVerdict } from "./verdict";

/**
 * The fit check (SPEC §7): a fixed pipeline with one branch (link or text) and one retry. The
 * model doesn't choose its tools. Every step event is emitted as it happens, with its measured
 * duration; nothing here is scripted or timed for show.
 */

/** kb.search is in-process and fast; this ceiling only matters when it hangs (the kb drill). */
export const KB_SEARCH_TIMEOUT_MS = 1500;

const LIMITS = {
  jdParse: { maxOutputTokens: 2000, effort: "low" as const },
  evidenceMap: { maxOutputTokens: 4000, effort: "medium" as const },
};

/**
 * What a guard step reports: "pass" when it changed nothing, otherwise what it changed, so the
 * X-ray never says "pass" while the result shows fewer matches than evidence.map did.
 */
export function guardStepDetail(matchesBefore: number, matchesAfter: number, fired: number): string {
  if (fired === 0) return "pass";
  const lost = matchesBefore - matchesAfter;
  const other = fired - lost;
  const parts: string[] = [];
  if (lost > 0) parts.push(`${lost} ${lost === 1 ? "match → gap" : "matches → gaps"}`);
  if (other > 0) parts.push(`${other} ${other === 1 ? "gap" : "gaps"} reworded`);
  return parts.join(" · ");
}

const matchCount = (cs: readonly EvidenceCard[]) => cs.filter((c) => c.type === "match").length;

export type FitDeps = {
  search: (requirements: readonly string[]) => Promise<KbEntry[]>;
  fetchPage: (url: string, signal: AbortSignal) => Promise<string>;
  model: (rec: RunRecord) => Promise<ResolvedModel>;
};

export const defaultFitDeps = (ctx: RunContext): FitDeps => ({
  search: async (reqs) => kbSearch(reqs),
  fetchPage: (url, signal) => fetchUrl(url, signal),
  model: async () => getModel("fit", ctx.env),
});

class KbTimeout extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new KbTimeout("kb.search timeout")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

/** The "knowledge base offline" drill: a search that never answers, so the real timeout fires. */
const offlineSearch = (): Promise<KbEntry[]> => new Promise(() => {});

export async function* runFit(req: FitRun, ctx: RunContext, rec: RunRecord, deps: FitDeps = defaultFitDeps(ctx)): AsyncGenerator<FitEvent> {
  const { env, signal, now } = ctx;
  rec.drill = req.drill ?? null;

  const fallback = (reason: FallbackEvent["reason"], trace?: TraceLine[]): FallbackEvent => {
    rec.fallback = reason;
    return {
    type: "fallback",
    reason,
    ...(rec.drill ? { drill: rec.drill } : {}),
    ...(rec.steps.length || rec.drill ? { runId: rec.runId } : {}),
    ...(trace ? { trace } : {}),
    };
  };

  const timed = <T>(fn: () => Promise<T>) => {
    const t0 = now();
    return fn().then(
      (value) => ({ value, ms: Math.round(now() - t0) }),
      (error: unknown) => Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), { ms: Math.round(now() - t0) })),
    );
  };
  const msOf = (e: unknown) => (e as { ms?: number }).ms ?? 0;

  // ---- Drill: rate limit. A forced 429: no Redis, no model, nothing billed (SPEC §7). ----
  if (rec.drill === "rate") {
    rec.log = true;
    yield { type: "start", runId: rec.runId };
    const pre = await timed(async () => precomputed.length);
    rec.steps.push({ tool: "fallback.precomputed", status: "done", ms: pre.ms });
    rec.guardFired.push("ratelimit.check");
    yield fallback("limited", [
      { mark: "×", text: "ratelimit.check(visitor) → 429 · daily cap reached", bad: true, timed: false },
      { mark: "›", text: "llm.call skipped · nothing billed", bad: false, timed: false },
      { mark: "✓", text: `fallback.precomputed(role_types=${pre.value})`, bad: false, timed: true, ms: pre.ms },
    ]);
    return;
  }

  // ---- Rate limit and budget, before any model call (SPEC §10). ----
  const bucket = rec.drill ? "drill" : "fit";
  if (hook(env, req.jd, "limited") || !(await checkLimit(bucket, ctx.visitor, env))) {
    rec.log = false;
    // Plain states, not the drill's: the visitor's real limit or budget stopped the run.
    yield { type: "fallback", reason: "limited" };
    return;
  }
  if (hook(env, req.jd, "budget") || !(await budgetLeft(env))) {
    rec.log = false;
    yield { type: "fallback", reason: "budget" };
    return;
  }

  let model: ResolvedModel;
  try {
    model = await deps.model(rec);
    rec.model = model.id;
  } catch (e) {
    console.error("fit check: model unavailable:", e instanceof Error ? e.message : e);
    rec.log = false;
    yield { type: "fallback", reason: "error" };
    return;
  }

  yield { type: "start", runId: rec.runId };

  const step = (tool: FitTool, status: "running" | "done" | "skipped", detail?: string, ms?: number): FitEvent => {
    if (status !== "running") rec.steps.push({ tool, status, ms: ms ?? 0 });
    return { type: "step", tool, status, ...(detail ? { detail } : {}), ...(ms !== undefined ? { ms } : {}) };
  };

  /** One retry per run, shared by every model and kb.search call (SPEC §7). */
  async function retryOnce<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number; failedMs?: number }> {
    try {
      return await timed(fn);
    } catch (e) {
      if (e instanceof LlmError) addUsage(rec, e.tokens);
      if (rec.retries >= 1 || signal.aborted) throw e;
      rec.retries++;
      const r = await timed(fn).catch((e2: unknown) => {
        if (e2 instanceof LlmError) addUsage(rec, e2.tokens);
        throw Object.assign(e2 as Error, { failedMs: msOf(e) });
      });
      return { ...r, failedMs: msOf(e) };
    }
  }

  try {
    // 1. fetch_url — the only branch.
    let jd = req.jd;
    const link = isLink(jd);
    rec.branch = link ? "link" : "text";
    yield step("fetch_url", "running");
    if (link) {
      const page = await timed(() => deps.fetchPage(jd, signal));
      jd = page.value;
      yield step("fetch_url", "done", "fetched", page.ms);
    } else {
      yield step("fetch_url", "skipped", "skipped");
    }

    // 2. jd.parse
    yield step("jd.parse", "running");
    const parsed = await retryOnce(async () => {
      const r = await callLlm({ model, system: JD_PARSE_SYSTEM, prompt: jdParsePrompt(jd), schema: JdParseSchema, signal, ...LIMITS.jdParse });
      addUsage(rec, r.tokens);
      return r.output;
    });
    const { role, requirements } = parsed.value;
    rec.requirements = requirements.length;
    yield step("jd.parse", "done", `${requirements.length} requirements`, parsed.ms);

    // 3. kb.search (deterministic). The kb drill takes the knowledge base offline.
    yield step("kb.search", "running");
    const search = () => withTimeout(rec.drill === "kb" ? offlineSearch() : deps.search(requirements), KB_SEARCH_TIMEOUT_MS);
    let sources: KbEntry[];
    try {
      const found = await retryOnce(search);
      sources = found.value;
      rec.sourcesRetrieved = sources.length;
      yield step("kb.search", "done", sources.length ? "sources found" : "no sources found", found.ms);
    } catch (e) {
      // guard.no_sources: stop rather than answer without sources (SPEC §7).
      rec.guardFired.push("guard.no_sources");
      const pre = await timed(async () => precomputed.length);
      const firstMs = (e as { failedMs?: number }).failedMs;
      rec.steps.push({ tool: "kb.search", status: "failed", ms: msOf(e) });
      const trace: TraceLine[] = [
        { mark: "✓", text: `jd.parse(text) → ${requirements.length} requirements`, bad: false, timed: true, ms: parsed.ms },
        ...(rec.retries
          ? [
              { mark: "×" as const, text: "kb.search(...) → timeout", bad: true, timed: true, ms: firstMs ?? KB_SEARCH_TIMEOUT_MS },
              { mark: "×" as const, text: "retry 1 of 1: kb.search(...) → timeout", bad: true, timed: true, ms: msOf(e) },
            ]
          : [{ mark: "×" as const, text: "kb.search(...) → timeout", bad: true, timed: true, ms: msOf(e) }]),
        { mark: "›", text: "guard.no_sources → stop instead of answering", bad: false, timed: false },
        { mark: "✓", text: `fallback.precomputed(role_types=${pre.value})`, bad: false, timed: true, ms: pre.ms },
      ];
      yield fallback("error", rec.drill ? trace : undefined);
      return;
    }

    // 4. evidence.map
    yield step("evidence.map", "running");
    if (hook(env, req.jd, "hold")) await untilAborted(signal);
    let cards: EvidenceCard[];
    let mapMs = 0;
    if (sources.length === 0) {
      // Nothing to cite: every requirement is a gap, and the model isn't asked to guess.
      cards = requirements.map((r) => ({ type: "gap", req: r, closest: NO_SOURCE_CLOSEST, close: "", notDoneId: null }));
    } else {
      const mapped = await retryOnce(async () => {
        const r = await callLlm({
          model,
          system: EVIDENCE_MAP_SYSTEM,
          prompt: evidenceMapPrompt(requirements, formatEntries(sources)),
          schema: EvidenceMapSchema,
          signal,
          ...LIMITS.evidenceMap,
        });
        addUsage(rec, r.tokens);
        return r.output.cards;
      });
      cards = mapped.value;
      mapMs = mapped.ms;
    }
    const countOf = (cs: EvidenceCard[]) => {
      const m = matchCount(cs);
      return `${m} ${m === 1 ? "match" : "matches"} · ${cs.length - m} ${cs.length - m === 1 ? "gap" : "gaps"}`;
    };
    yield step("evidence.map", "done", countOf(cards), mapMs);

    // 5. guard.citations
    yield step("guard.citations", "running");
    const g1 = await timed(async () => guardCitations(requirements, cards, sources));
    rec.guardFired.push(...g1.value.fired);
    yield step("guard.citations", "done", guardStepDetail(matchCount(cards), matchCount(g1.value), g1.value.fired.length), g1.ms);

    // 6. guard.honesty
    yield step("guard.honesty", "running");
    const notDone = KB.filter((e) => e.scope === "not_done");
    const g2 = await timed(async () => guardHonesty(g1.value, notDone));
    rec.guardFired.push(...g2.value.fired);
    yield step("guard.honesty", "done", guardStepDetail(matchCount(g1.value), g2.value.matches.length, g2.value.fired.length), g2.ms);

    // 7. verdict.compose
    yield step("verdict.compose", "running");
    const { matches, gaps } = g2.value;
    rec.sourcesCited = new Set(matches.map((m) => m.href + "\u0000" + m.source)).size;
    const v = await timed(async () => composeVerdict(matches.length, gaps.length));
    yield step("verdict.compose", "done", "done", v.ms);

    yield {
      type: "result",
      role,
      verdict: v.value.verdict,
      note: v.value.note,
      matches,
      gaps,
      retries: rec.retries,
      trace: {
        runId: rec.runId,
        costUsd: displayCost(runCost(rec)),
        ms: Math.round(now() - rec.startedAt),
        model: model.label,
        startedAt: rec.startedAtIso,
        branch: link ? "link" : "text",
        requirements: requirements.length,
        sourcesRetrieved: sources.length,
        sourcesCited: rec.sourcesCited,
        tokensIn: rec.tokens.input + rec.tokens.cacheWrite + rec.tokens.cacheRead,
        tokensOut: rec.tokens.output,
        guards: { citations: true, honesty: true },
      },
    };
  } catch (e) {
    if (signal.aborted) return;
    console.error("fit check failed:", e instanceof Error ? e.message : e);
    // The plain error state: only kb.search failing is the drill's "knowledge base offline" story.
    rec.fallback = "error";
    yield { type: "fallback", reason: "error", runId: rec.runId };
  }
}
