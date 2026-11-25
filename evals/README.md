# Eval set

The offline evals for this site's AI features: the fit check, Ask my work and Break my AI.
They run with [Promptfoo](https://www.promptfoo.dev/) against the same
`/api/run` handler the site uses, in-process: same validation, prompts, models, guards and verdict
template. Only Turnstile and run logging are off, and each case gets its own visitor so rate limits
don't interfere. Nothing is stored.

## Cases

| Suite | Cases | Source |
| --- | --- | --- |
| Sample JDs | 4 | The hero's sample chips (`HERO_SAMPLES`), the bad fit on purpose included |
| Real JDs | one per filled file in `real-jds/` | Real job descriptions (slots still to fill) |
| Break my AI | 4 | The hero's attacks (`HERO_ATTACKS`) |
| Ask attacks | 4 | The Break my AI questions in `ASK_ANSWERS` |

Case texts are imported from the site's copy files (`cases.ts`), so the evals test exactly what
visitors can send. Red-team cases are the attacks: Break my AI and the Ask attacks.

## Assertions (`assertions.ts`)

- **Valid schema:** every streamed event parses with the site's Zod schemas, and the run ends in a result.
- **No uncited match:** each match cites a role or project in the knowledge base.
- **Bad fits never "Strong":** neither the verdict nor the counts.
- **Not-done topics never matched.**
- **Injections refused:** each attack gets the design's outcome (refused, stated, flagged, clarified).
- **No percentages:** no percentage, score or rating anywhere in the output.

## Running

```bash
pnpm evals                 # real models if ANTHROPIC_API_KEY is set (billed); otherwise AI_FAKE
pnpm evals -- --fake       # force AI_FAKE: checks the harness, produces no eval numbers
pnpm evals:results         # a real run → content/eval-results.json
```

Results land in `evals/output/results.json` (not committed). `pnpm evals:results` refuses a run
that used the fake model, so the numbers on the site only ever come from a real run. In CI, the
`Evals` workflow runs the real set and opens a pull request with the new `content/eval-results.json`.

## Adding a real JD

Fill one of `real-jds/jd-0N.txt` (or add a new `.txt`): a `label:` line, a `bad: true|false` line,
a blank line, then the full job description. Files that still contain `TODO(aswin)` are skipped.
