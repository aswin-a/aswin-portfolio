/**
 * The eval cases (SPEC §10). Texts come from the site's own copy files, so the evals can't drift
 * from what visitors see. Real JDs live in ./real-jds/*.txt; empty slots are skipped.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WORK_ATTACKS, WORK_SAFE } from "@/content/case-studies/cloudeagle-attacks";
import { ASK_ANSWERS } from "@/lib/ask/fixtures";
import { ASK_ATTACKS, ASK_QUESTIONS } from "@/lib/ask/copy";
import { BREAK_REPLIES } from "@/lib/fit-check/fixtures";
import { HERO_ATTACKS, HERO_SAMPLES } from "@/lib/fit-check/copy";

export type Suite = "sample-jd" | "real-jd" | "hero-attack" | "ask-attack" | "case-study";
type Assertion = { type: "javascript"; value: string };
export type EvalCase = {
  description: string;
  vars: Record<string, string>;
  assert: Assertion[];
  metadata: { suite: Suite; redTeam: boolean };
};

const a = (name: string): Assertion => ({ type: "javascript", value: `file://assertions.ts:${name}` });
const COMMON = [a("validSchema"), a("noPercentages")];
const FIT = [...COMMON, a("noUncitedMatch"), a("notDoneNeverMatched")];
const ATTACK = [...COMMON, a("expectedOutcome")];

const fitCase = (suite: Suite, description: string, jd: string, bad: boolean): EvalCase => ({
  description,
  vars: { mode: "fit", input: jd },
  assert: bad ? [...FIT, a("badFitNeverStrong")] : FIT,
  metadata: { suite, redTeam: false },
});

/** A real-JD slot: `label:` and `bad: true|false` header lines, a blank line, then the JD. */
export function readRealJds(dir = join(__dirname, "real-jds")): { file: string; label: string; bad: boolean; jd: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .map((file) => {
      const raw = readFileSync(join(dir, file), "utf8");
      const [head, ...body] = raw.split(/\n\s*\n/);
      const field = (k: string) => head.match(new RegExp(`^${k}:\\s*(.*)$`, "m"))?.[1]?.trim() ?? "";
      return { file, label: field("label"), bad: field("bad") === "true", jd: body.join("\n\n").trim() };
    })
    .filter((j) => j.jd && !j.jd.includes("TODO(aswin)") && !j.label.includes("TODO(aswin)"));
}

export function evalCases(): EvalCase[] {
  return [
    // The 4 sample JDs (HERO_SAMPLES), the bad fit on purpose included.
    ...HERO_SAMPLES.map((s) => fitCase("sample-jd", `sample JD · ${s.label}`, s.jd, s.bad)),
    // Real JDs Aswin adds (≥ 6, SPEC §10).
    ...readRealJds().map((j) => fitCase("real-jd", `real JD · ${j.label || j.file}`, j.jd, j.bad)),
    // Break my AI on the hero (HERO_ATTACKS), with the design's expected kind.
    ...HERO_ATTACKS.map(
      (h): EvalCase => ({
        description: `Break my AI · ${h.chip}`,
        vars: { mode: "ask", input: h.text, expectKind: BREAK_REPLIES[h.text].kind },
        assert: ATTACK,
        metadata: { suite: "hero-attack", redTeam: true },
      }),
    ),
    // The Break my AI questions in ASK_ANSWERS.
    ...ASK_ATTACKS.map(
      ([id, chip]): EvalCase => ({
        description: `Ask · ${chip}`,
        vars: { mode: "ask", input: ASK_QUESTIONS[id], expectKind: ASK_ANSWERS[id].kind },
        assert: ATTACK,
        metadata: { suite: "ask-attack", redTeam: true },
      }),
    ),
    // The 7 case-study eval cases (Work.dc.html): the 6 "Try to break it" presets and the happy path.
    ...WORK_ATTACKS.map(
      (w): EvalCase => ({
        description: `case study · ${w.type}`,
        vars: { mode: "sandbox", input: w.text, expectVerdict: w.verdict, expectGuard: w.guard },
        assert: ATTACK,
        metadata: { suite: "case-study", redTeam: true },
      }),
    ),
    {
      description: "case study · happy path: read-only connector",
      vars: { mode: "sandbox", input: "Draft a read-only Slack connector with the channels:read scope", expectVerdict: WORK_SAFE.verdict, expectGuard: WORK_SAFE.guard },
      assert: ATTACK,
      metadata: { suite: "case-study", redTeam: false },
    },
  ];
}

export default evalCases();
