// zod/mini: the same validation as classic Zod in a fraction of the bundle. These schemas run in the
// browser too (stream and response parsing), so they stay out of the classic API (Lighthouse, SPEC §14.8).
import * as z from "zod/mini";

/**
 * The fit check's event stream (SPEC §7): `step` events in pipeline order, then one terminal
 * event, `result` or `fallback`. The dev mock (stub.ts) and `/api/run` (Milestone 5) emit the
 * same events, so the hero never knows which one it is talking to.
 */

/** The 7 tools, in pipeline order, with the exact names from SPEC §7. */
export const FIT_TOOLS = [
  "fetch_url",
  "jd.parse",
  "kb.search",
  "evidence.map",
  "guard.citations",
  "guard.honesty",
  "verdict.compose",
] as const;
export type FitTool = (typeof FIT_TOOLS)[number];

/** SPEC §10: a JD is at most 12,000 characters. */
export const JD_MAX_CHARS = 12000;

export const DRILLS = ["kb", "rate"] as const;
export type Drill = (typeof DRILLS)[number];

export const FitRequestSchema = z.object({
  jd: z.string().check(z.trim(), z.minLength(1), z.maxLength(JD_MAX_CHARS)),
  /** Failure drill: forces that failure on the server (SPEC §7). */
  drill: z.optional(z.enum(DRILLS)),
});
export type FitRequest = z.infer<typeof FitRequestSchema>;

/** Optional first event: the run id shown in X-ray while steps stream. Only the real endpoint sends it. */
export const StartEventSchema = z.object({ type: z.literal("start"), runId: z.string() });

export const StepEventSchema = z.object({
  type: z.literal("step"),
  tool: z.enum(FIT_TOOLS),
  /** `running` when a step starts; `done` or `skipped` when it ends. */
  status: z.enum(["running", "done", "skipped"]),
  /** Short outcome shown on the right: "6 requirements", "pass", "skipped". */
  detail: z.optional(z.string()),
  /** Measured duration. Only the real endpoint sets it; the UI shows "[ms]" until then. */
  ms: z.optional(z.number().check(z.nonnegative())),
});
export type StepEvent = z.infer<typeof StepEventSchema>;

export const FitMatchSchema = z.object({ req: z.string(), evidence: z.string(), source: z.string(), href: z.string() });
export type FitMatch = z.infer<typeof FitMatchSchema>;
export const FitGapSchema = z.object({ req: z.string(), closest: z.string(), close: z.string() });
export type FitGap = z.infer<typeof FitGapSchema>;

/** Live usage for this run. Only the real endpoint sets it; it is never faked. */
export const RunTraceSchema = z.object({
  runId: z.string(),
  costUsd: z.number().check(z.nonnegative()),
  ms: z.number().check(z.nonnegative()),
  /** "provider · model", e.g. "Anthropic · claude-sonnet-5-5". */
  model: z.string(),
  /** The rest feeds X-ray's "This run" (design update 3); every value is the logged row's (SPEC §10). */
  /** When the run started, ISO 8601. */
  startedAt: z.string(),
  branch: z.enum(["link", "text"]),
  /** Requirements jd.parse found. */
  requirements: z.int().check(z.nonnegative()),
  sourcesRetrieved: z.int().check(z.nonnegative()),
  sourcesCited: z.int().check(z.nonnegative()),
  /** All input tokens, cached included. */
  tokensIn: z.int().check(z.nonnegative()),
  tokensOut: z.int().check(z.nonnegative()),
  /** Each guard ran and the cards it returned pass it. */
  guards: z.object({ citations: z.boolean(), honesty: z.boolean() }),
});
export type RunTrace = z.infer<typeof RunTraceSchema>;

/** HERO_FIT / HERO_BAD in Hero.dc.html, plus the role title from jd.parse. */
export const ResultEventSchema = z.object({
  type: z.literal("result"),
  /** Short role title from jd.parse. Not in SPEC §7 yet (approved addition, M4). */
  role: z.optional(z.string()),
  verdict: z.string(),
  note: z.string(),
  matches: z.array(FitMatchSchema),
  gaps: z.array(FitGapSchema),
  /** Retries used, of the one allowed (SPEC §7). */
  retries: z.int().check(z.gte(0), z.lte(1)),
  trace: z.optional(RunTraceSchema),
});
export type ResultEvent = z.infer<typeof ResultEventSchema>;

/** One line of the X-ray fallback trace (HERO_DRILL_TRACE). */
export const TraceLineSchema = z.object({
  mark: z.enum(["✓", "×", "›"]),
  text: z.string(),
  /** Failed call: shown in amber. */
  bad: z.boolean(),
  /** True for lines that end in a duration ("· [ms]" until measured). */
  timed: z.boolean(),
  ms: z.optional(z.number().check(z.nonnegative())),
});
export type TraceLine = z.infer<typeof TraceLineSchema>;

/** Terminal event when the run can't produce a result (SPEC §7). */
export const FallbackEventSchema = z.object({
  type: z.literal("fallback"),
  /** `error` → the error state; `limited` → the rate-limited state; `budget` → the monthly AI budget is spent. */
  reason: z.enum(["error", "limited", "budget"]),
  drill: z.optional(z.enum(DRILLS)),
  runId: z.optional(z.string()),
  trace: z.optional(z.array(TraceLineSchema)),
});
export type FallbackEvent = z.infer<typeof FallbackEventSchema>;

export const FitEventSchema = z.discriminatedUnion("type", [
  StartEventSchema,
  StepEventSchema,
  ResultEventSchema,
  FallbackEventSchema,
]);
export type FitEvent = z.infer<typeof FitEventSchema>;

/** Break my AI on the hero: `/api/run` with `mode: "ask"` (SPEC §8), reduced to what the hero shows. */
export type BreakReply = {
  kind: "fit" | "gap" | "none" | "refuse" | "conflict" | "clarify" | "unknown";
  text: string;
  guard: string;
  trace?: { runId: string; ms: number };
};
export type BreakResult = { status: "ok"; reply: BreakReply } | { status: "error" } | { status: "limited" } | { status: "budget" };
