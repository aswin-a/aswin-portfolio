// zod/mini, because the case-study sandbox parses this reply in the browser (see lib/fit-check/types.ts).
import * as z from "zod/mini";

/** WORK_ATTACKS guards from Work.dc.html, plus WORK_SAFE's line for a drafted config. */
export const SANDBOX_VERDICTS = ["BLOCKED", "FLAGGED", "CLARIFIED", "DRAFTED"] as const;
export const SANDBOX_GUARDS = [
  "guard.injection",
  "guard.scope",
  "guard.secrets",
  "guard.allowlist",
  "guard.conflict",
  "guard.clarify",
  "none · review_required=true",
] as const;

export const RunTraceLiteSchema = z.object({
  runId: z.string(),
  costUsd: z.number().check(z.nonnegative()),
  ms: z.number().check(z.nonnegative()),
});

/** `/api/run` sandbox reply: SandboxOutputSchema's fields (lib/ai/schemas.ts; a unit test keeps them equal) plus the trace. */
export const SandboxReplySchema = z.object({
  verdict: z.enum(SANDBOX_VERDICTS),
  reason: z.string().check(z.minLength(1), z.maxLength(300)),
  guard: z.enum(SANDBOX_GUARDS),
  trace: z.optional(RunTraceLiteSchema),
});
export type SandboxReply = z.infer<typeof SandboxReplySchema>;
