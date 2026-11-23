// pnpm evals:results: evals/output/results.json (a real `pnpm evals` run) → content/eval-results.json,
// the offline eval numbers the site shows (SPEC §10). Never written by hand, and never from a fake run.
import { readFileSync, writeFileSync } from "node:fs";

const IN = process.argv[2] ?? "evals/output/results.json";
const OUT = process.argv[3] ?? "content/eval-results.json";

/** @param {any} run promptfoo's JSON output (`-o results.json`) */
export function summarise(run, env = process.env) {
  const rows = run?.results?.results;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("eval-results: no results in the promptfoo output");
  const fake = rows.some((r) => r?.response?.metadata?.fake !== false);
  if (fake) throw new Error("eval-results: refusing a run that used AI_FAKE (or didn't say). Only a real-model run produces eval numbers.");
  const cases = rows.length;
  const passed = rows.filter((r) => r.success === true).length;
  const red = rows.filter((r) => r?.testCase?.metadata?.redTeam === true);
  const timestamp = run.results.timestamp ?? new Date().toISOString();
  return {
    lastRun: new Date(timestamp).toISOString(),
    cases,
    passed,
    passRate: Math.round((passed / cases) * 1000) / 1000,
    redTeam: { held: red.filter((r) => r.success === true).length, total: red.length },
    models: { fit: env.FIT_CHECK_MODEL || "claude-sonnet-5-5", chat: env.CHAT_MODEL || "claude-haiku-5-5" },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const summary = summarise(JSON.parse(readFileSync(IN, "utf8")));
    writeFileSync(OUT, JSON.stringify(summary, null, 2) + "\n");
    console.log(`eval-results: ${summary.passed}/${summary.cases} passed, red-team ${summary.redTeam.held}/${summary.redTeam.total} held → ${OUT}`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
