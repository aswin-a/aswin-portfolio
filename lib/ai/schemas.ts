import { z } from "zod";
import { ASK_KINDS, ASK_MAX_CHARS, SessionMemorySchema } from "@/lib/ask/types";
import { DRILLS, JD_MAX_CHARS } from "@/lib/fit-check/types";

/**
 * Zod schemas for `/api/run` (SPEC §7–8, §10): the request body and every structured output the
 * model is asked for. Everything the model returns is validated here, then checked again by the
 * deterministic guards in lib/run/guards.ts.
 */

/** Turnstile tokens are at most 2,048 characters (Cloudflare docs). Empty only under AI_FAKE. */
const TurnstileToken = z.string().max(2048);

export const FitRunSchema = z.object({
  mode: z.literal("fit"),
  jd: z.string().trim().min(1).max(JD_MAX_CHARS),
  drill: z.enum(DRILLS).optional(),
  turnstileToken: TurnstileToken,
});

export const AskRunSchema = z.object({
  mode: z.literal("ask"),
  question: z.string().trim().min(1).max(ASK_MAX_CHARS),
  memory: z.nullable(SessionMemorySchema).optional(),
  turnstileToken: TurnstileToken,
});

export const RunRequestSchema = z.discriminatedUnion("mode", [FitRunSchema, AskRunSchema]);
export type RunRequest = z.infer<typeof RunRequestSchema>;
export type FitRun = z.infer<typeof FitRunSchema>;
export type AskRun = z.infer<typeof AskRunSchema>;

// ---------- Model outputs ----------

/** SPEC §7 `jd.parse`: up to 10 requirements, plus a short role title for the hero and Contact. */
export const MAX_REQUIREMENTS = 10;
export const JdParseSchema = z.object({
  role: z.string().min(1).max(120),
  requirements: z.array(z.string().min(1).max(300)).min(1).max(MAX_REQUIREMENTS),
});
export type JdParse = z.infer<typeof JdParseSchema>;

/** The most CV lines one citation may name (Zelthy's largest area has 12). */
export const MAX_LINES = 12;

/** SPEC §7 `evidence.map`: one card per requirement, a match citing a KB id (and its lines) or a gap. */
export const EvidenceCardSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("match"),
    req: z.string(),
    evidence: z.string(),
    sourceId: z.string(),
    /** The source's `L` numbers the evidence comes from (SPEC §6.1, §7); [] when it rests on the summary. */
    lines: z.array(z.int()).max(MAX_LINES),
  }),
  z.object({
    type: z.literal("gap"),
    req: z.string(),
    closest: z.string(),
    close: z.string(),
    /** The not-done entry this gap is about, if any. */
    notDoneId: z.string().nullable(),
  }),
]);
export type EvidenceCard = z.infer<typeof EvidenceCardSchema>;
export const EvidenceMapSchema = z.object({ cards: z.array(EvidenceCardSchema).max(MAX_REQUIREMENTS) });

/** SPEC §8 guard names shown in X-ray. */
export const ASK_GUARDS = [
  "guard.prompt_injection",
  "guard.not_done",
  "guard.conflicting_info",
  "guard.ambiguous_ask",
  "guard.gap_stated",
  "none",
] as const;
export type AskGuard = (typeof ASK_GUARDS)[number];

/** SPEC §8 Ask output. `sourceIds` are KB ids, or "memory" for the visitor's own fit check. */
export const AskOutputSchema = z.object({
  kind: z.enum(ASK_KINDS),
  text: z.string().min(1).max(1200),
  sourceIds: z.array(z.string()).max(4),
  /** Per cited entry, the `L` numbers the answer relies on (SPEC §6.1, §8). */
  sourceLines: z.array(z.object({ id: z.string(), lines: z.array(z.int()).max(MAX_LINES) })).max(4),
  guard: z.enum(ASK_GUARDS),
});
export type AskOutput = z.infer<typeof AskOutputSchema>;

// ---------- Responses for ask ----------


/** `budget`: the monthly AI budget is spent (SPEC §10, approved M5 addition). */
export const FAIL_STATUSES = ["error", "limited", "budget"] as const;
export type FailStatus = (typeof FAIL_STATUSES)[number];
