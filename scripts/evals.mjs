// pnpm evals: runs the Promptfoo eval set in /evals against the real /api/run handler.
//
//   ANTHROPIC_API_KEY set   → the real models (FIT_CHECK_MODEL, CHAT_MODEL); costs real money
//   no key, or --fake       → AI_FAKE, the deterministic fake model: checks the harness only
//
// Results go to evals/output/results.json (gitignored). Only `pnpm evals:results`, after a real
// run, turns them into content/eval-results.json for the site.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const fake = process.argv.includes("--fake") || !process.env.ANTHROPIC_API_KEY;
const env = {
  ...process.env,
  PROMPTFOO_DISABLE_TELEMETRY: "1",
  PROMPTFOO_DISABLE_UPDATE: "1",
  FORCE_COLOR: "0",
  ...(fake ? { ANTHROPIC_API_KEY: "" } : {}),
};
console.log(fake ? "evals: AI_FAKE (no ANTHROPIC_API_KEY): a harness check, not eval results." : "evals: real models; this run is billed.");
mkdirSync("evals/output", { recursive: true });
const r = spawnSync(
  "promptfoo",
  ["eval", "-c", "evals/promptfooconfig.yaml", "-o", "evals/output/results.json", "--no-cache", "--no-write", "--no-share", "--no-table", "--no-progress-bar"],
  { stdio: "inherit", env, shell: process.platform === "win32" },
);
// Promptfoo exits 100 when a case fails; the results file is still written.
process.exit(r.status ?? 1);
