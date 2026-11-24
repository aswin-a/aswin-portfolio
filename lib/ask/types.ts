// zod/mini: the same validation as classic Zod in a fraction of the bundle. These schemas run in the
// browser too (stream and response parsing), so they stay out of the classic API (Lighthouse, SPEC §14.8).
import * as z from "zod/mini";

/** `kind` values from SPEC §8. */
export const ASK_KINDS = ["fit", "gap", "none", "refuse", "conflict", "clarify", "unknown"] as const;
export type AskKind = (typeof ASK_KINDS)[number];

export const AskSourceSchema = z.object({ label: z.string(), href: z.string() });
export type AskSource = z.infer<typeof AskSourceSchema>;

/**
 * One answer from Ask my work. The structured output of `/api/run` with `mode: "ask"` (SPEC §8);
 * the dev stub returns the same shape.
 */
export const AskAnswerSchema = z.object({
  kind: z.enum(ASK_KINDS),
  text: z.string(),
  sources: z.array(AskSourceSchema),
  /** Guard name shown in X-ray, or "none · answered from the knowledge base". */
  guard: z.string(),
  /** Content Aswin still has to supply, shown in the dotted box (Ask.dc.html `todo`). Empty when none. */
  todo: z.optional(z.string()),
  /** Live run metadata for the X-ray line. Only the real endpoint sets it; it is never faked. */
  trace: z.optional(z.object({ runId: z.string(), costUsd: z.number(), ms: z.number() })),
});
export type AskAnswer = z.infer<typeof AskAnswerSchema>;

/** A fit check's context, carried into Ask for this session only (SPEC §5). */
export const SessionMemorySchema = z.object({
  role: z.string(),
  matchCount: z.int().check(z.nonnegative()),
  gaps: z.array(z.object({ req: z.string(), closest: z.string(), close: z.string() })),
});
export type SessionMemory = z.infer<typeof SessionMemorySchema>;

export type AskRequest = {
  /** The question as shown on the "›" line. ≤ 1,000 chars (SPEC §10). */
  question: string;
  memory: SessionMemory | null;
};

export type AskResult =
  | { status: "ok"; answer: AskAnswer }
  | { status: "error" }
  | { status: "limited" }
  /** The monthly AI budget is spent (SPEC §10). */
  | { status: "budget" };

export const ASK_MAX_CHARS = 1000;

/**
 * The Ask pipeline's steps, in the order they really run (approved 2026-11-18: the design lists
 * guardrails before compose, but the citation check needs the written answer).
 */
export const ASK_TOOLS = ["kb.search", "compose", "guardrails"] as const;
export type AskTool = (typeof ASK_TOOLS)[number];

/** `/api/run` with `mode: "ask"` streams NDJSON: `step` events as they happen, then one `result`. */
export const AskStepEventSchema = z.object({
  type: z.literal("step"),
  tool: z.enum(ASK_TOOLS),
  status: z.enum(["running", "done"]),
  ms: z.optional(z.number()),
});
export type AskStepEvent = z.infer<typeof AskStepEventSchema>;

export const AskResultEventSchema = z.discriminatedUnion("status", [
  z.object({ type: z.literal("result"), status: z.literal("ok"), answer: AskAnswerSchema }),
  z.object({ type: z.literal("result"), status: z.enum(["error", "limited", "budget"]) }),
]);
export type AskResultEvent = z.infer<typeof AskResultEventSchema>;

export const AskEventSchema = z.union([AskStepEventSchema, AskResultEventSchema]);
export type AskEvent = z.infer<typeof AskEventSchema>;
