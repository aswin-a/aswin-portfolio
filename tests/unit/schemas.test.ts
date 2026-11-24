import { describe, expect, it } from "vitest";
import { SandboxOutputSchema } from "@/lib/ai/schemas";
import { SandboxReplySchema } from "@/lib/ai/sandbox-reply";

// The sandbox reply (zod/mini, parsed in the browser) repeats the model output's fields (classic Zod).
describe("sandbox schemas stay in sync", () => {
  it("have the same fields apart from the trace", () => {
    const reply = Object.keys(SandboxReplySchema.def.shape).filter((k) => k !== "trace");
    expect(reply.sort()).toEqual(Object.keys(SandboxOutputSchema.shape).sort());
  });

  const cases: unknown[] = [
    { verdict: "BLOCKED", reason: "Injection refused.", guard: "guard.injection" },
    { verdict: "DRAFTED", reason: "x", guard: "none · review_required=true" },
    { verdict: "BLOCKED", reason: "", guard: "guard.injection" },
    { verdict: "BLOCKED", reason: "y".repeat(301), guard: "guard.injection" },
    { verdict: "OK", reason: "z", guard: "guard.scope" },
    { verdict: "FLAGGED", reason: "z", guard: "guard.other" },
    { verdict: "FLAGGED", guard: "guard.scope" },
  ];
  it.each(cases)("accept and reject the same output: %j", (c) => {
    expect(SandboxReplySchema.safeParse(c).success).toBe(SandboxOutputSchema.safeParse(c).success);
  });
});
