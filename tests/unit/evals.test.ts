import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AssertionValueFunctionContext } from "promptfoo";
import { describe, expect, it } from "vitest";
import { WORK_ATTACKS } from "@/content/case-studies/cloudeagle-attacks";
import { ASK_ATTACKS } from "@/lib/ask/copy";
import { HERO_ATTACKS, HERO_SAMPLES } from "@/lib/fit-check/copy";
import { KB } from "@/lib/kb/snapshot";
import { badFitNeverStrong, expectedOutcome, noPercentages, notDoneNeverMatched, noUncitedMatch, validSchema } from "@/evals/assertions";
import { evalCases, readRealJds } from "@/evals/cases";
import { summarise } from "@/scripts/eval-results.mjs";

const project = KB.find((e) => e.scope === "projects")!;
const out = (mode: string, result: unknown, schemaErrors: string[] = []) => JSON.stringify({ mode, fake: false, result, events: 1, schemaErrors });
const fit = (matches: object[], gaps: object[] = [], verdict = "Strong on 1 of 1 requirements.") =>
  out("fit", { type: "result", verdict, note: "n", matches, gaps, retries: 0 });
const match = (req: string, source = project.label, href = project.href) => ({ req, evidence: "Did it.", source, href });
const ctx = (vars: Record<string, string>) => ({ vars }) as unknown as AssertionValueFunctionContext;

describe("eval cases (SPEC §10)", () => {
  const cases = evalCases();
  it("cover the 4 sample JDs, every Break my AI attack and the 7 case-study cases", () => {
    const by = (s: string) => cases.filter((c) => c.metadata.suite === s);
    expect(by("sample-jd").map((c) => c.vars.input)).toEqual(HERO_SAMPLES.map((s) => s.jd));
    expect(by("hero-attack").map((c) => c.vars.input)).toEqual(HERO_ATTACKS.map((h) => h.text));
    expect(by("ask-attack")).toHaveLength(ASK_ATTACKS.length);
    expect(by("case-study")).toHaveLength(7);
    expect(by("case-study").slice(0, 6).map((c) => c.vars.input)).toEqual(WORK_ATTACKS.map((w) => w.text));
  });
  it("only the bad fit gets the never-Strong check; red-team cases are the attacks", () => {
    const bad = cases.filter((c) => c.assert.some((a) => a.value.endsWith(":badFitNeverStrong")));
    expect(bad.map((c) => c.vars.input)).toEqual(HERO_SAMPLES.filter((s) => s.bad).map((s) => s.jd));
    expect(cases.filter((c) => c.metadata.redTeam)).toHaveLength(HERO_ATTACKS.length + ASK_ATTACKS.length + WORK_ATTACKS.length);
    for (const c of cases) expect(c.assert.map((a) => a.value)).toContain("file://assertions.ts:validSchema");
  });
  it("real-JD slots: TODO(aswin) placeholders are skipped; filled ones are read with label and bad flag", () => {
    expect(readRealJds()).toEqual([]);
    const dir = mkdtempSync(join(tmpdir(), "jds-"));
    writeFileSync(join(dir, "a.txt"), "label: Staff PM · Acme\nbad: true\n\nLine one.\n\nLine two.\n");
    writeFileSync(join(dir, "b.txt"), "label: TODO(aswin): role\nbad: false\n\nTODO(aswin): paste\n");
    expect(readRealJds(dir)).toEqual([{ file: "a.txt", label: "Staff PM · Acme", bad: true, jd: "Line one.\n\nLine two." }]);
  });
});

describe("eval assertions fail on bad output", () => {
  it("valid schema", () => {
    expect(validSchema(fit([match("APIs")])).pass).toBe(true);
    expect(validSchema(fit([match("APIs")]).replace('"schemaErrors":[]', '"schemaErrors":["bad"]')).pass).toBe(false);
    expect(validSchema(out("fit", { type: "fallback", reason: "error" })).pass).toBe(false);
    expect(validSchema(out("ask", { type: "result", status: "limited" })).pass).toBe(false);
  });
  it("no uncited match", () => {
    expect(noUncitedMatch(fit([match("APIs")])).pass).toBe(true);
    expect(noUncitedMatch(fit([match("APIs", "Made up", "/nowhere")])).pass).toBe(false);
    const nd = KB.find((e) => e.scope === "not_done")!;
    expect(noUncitedMatch(fit([match("APIs", nd.label, nd.href)])).pass).toBe(false);
  });
  it("not-done topics never matched", () => {
    expect(notDoneNeverMatched(fit([match("Own a public API")])).pass).toBe(true);
    expect(notDoneNeverMatched(fit([match("Hardware roadmaps from prototype to mass production")])).pass).toBe(false);
  });
  it("bad fits never Strong", () => {
    expect(badFitNeverStrong(fit([match("a")], [{ req: "b", closest: "", close: "" }, { req: "c", closest: "", close: "" }], "Not a strong fit: 1 of 3 requirements.")).pass).toBe(true);
    expect(badFitNeverStrong(fit([match("a")], [], "Strong on 1 of 1 requirements.")).pass).toBe(false);
    expect(badFitNeverStrong(fit([match("a"), match("b")], [], "Not a strong fit: 2 of 2 requirements.")).pass).toBe(false);
  });
  it("no percentages", () => {
    expect(noPercentages(fit([match("APIs")])).pass).toBe(true);
    expect(noPercentages(fit([{ ...match("APIs"), evidence: "A 90% fit." }])).pass).toBe(false);
    expect(noPercentages(out("ask", { type: "result", status: "ok", answer: { kind: "fit", text: "Rated 9/10.", sources: [], guard: "none" } })).pass).toBe(false);
  });
  it("injections refused: the design's kind, verdict and guard", () => {
    const ask = (kind: string) => out("ask", { type: "result", status: "ok", answer: { kind, text: "t", sources: [], guard: "g" } });
    expect(expectedOutcome(ask("refuse"), ctx({ expectKind: "refuse" })).pass).toBe(true);
    expect(expectedOutcome(ask("fit"), ctx({ expectKind: "refuse" })).pass).toBe(false);
    const sb = (verdict: string, guard: string) => out("sandbox", { status: "ok", reply: { verdict, reason: "r", guard } });
    expect(expectedOutcome(sb("BLOCKED", "guard.injection"), ctx({ expectVerdict: "BLOCKED", expectGuard: "guard.injection" })).pass).toBe(true);
    expect(expectedOutcome(sb("DRAFTED", "none · review_required=true"), ctx({ expectVerdict: "BLOCKED", expectGuard: "guard.injection" })).pass).toBe(false);
    expect(expectedOutcome(sb("BLOCKED", "guard.scope"), ctx({ expectVerdict: "BLOCKED", expectGuard: "guard.injection" })).pass).toBe(false);
  });
});

describe("eval-results.json writer", () => {
  const row = (success: boolean, redTeam: boolean, fake = false) => ({ success, testCase: { metadata: { redTeam } }, response: { metadata: { fake } } });
  const run = (rows: object[]) => ({ results: { timestamp: "2026-11-23T10:00:00.000Z", results: rows } });
  it("counts cases, passes and red-team held from a real run", () => {
    expect(summarise(run([row(true, false), row(false, false), row(true, true), row(false, true)]), {} as NodeJS.ProcessEnv)).toEqual({
      lastRun: "2026-11-23T10:00:00.000Z",
      cases: 4,
      passed: 2,
      passRate: 0.5,
      redTeam: { held: 1, total: 2 },
      models: { fit: "claude-sonnet-5-5", chat: "claude-haiku-5-5" },
    });
  });
  it("refuses a fake run, a run that doesn't say, and an empty one", () => {
    expect(() => summarise(run([row(true, false), row(true, true, true)]))).toThrow(/AI_FAKE/);
    expect(() => summarise(run([{ success: true, testCase: { metadata: {} }, response: {} }]))).toThrow(/AI_FAKE/);
    expect(() => summarise(run([]))).toThrow(/no results/);
  });
});
