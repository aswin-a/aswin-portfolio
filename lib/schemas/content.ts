import { z } from "zod";

const Labelled = z.object({ label: z.string(), value: z.string() });
const Step = z.object({ text: z.string(), time: z.string() });

/** One case study, PRD template (Work.dc.html). Sections without data are not rendered. */
export const CaseStudySchema = z.object({
  slug: z.string(),
  num: z.string(),
  status: z.string(),
  /** Title on the "Next" card of the previous study. Home cards come from content/products.ts (design update 4). */
  cardTitle: z.string(),
  built: z.string(),
  // Page
  breadcrumb: z.string(),
  disclaimer: z.string().optional(),
  title: z.string(),
  lede: z.string(),
  facts: z.array(Labelled),
  demo: z.string().optional(),
  problem: z.object({ who: z.string(), problem: z.string(), whyAi: z.string() }).optional(),
  decisions: z.array(z.object({ topic: z.string(), chose: z.string(), over: z.string(), because: z.string() })).optional(),
  arch: z
    .object({
      note: z.string().optional(),
      steps: z.array(z.object({ label: z.string(), fn: z.string(), guard: z.boolean(), ms: z.string() })),
      runId: z.string(),
    })
    .optional(),
  builtMyself: z.string().optional(),
  usedOrReused: z.string().optional(),
  safeguards: z.array(z.object({ title: z.string(), stops: z.string(), userSees: z.string() })).optional(),
  sandbox: z
    .object({
      attacks: z.array(
        z.object({ type: z.string(), text: z.string(), verdict: z.string(), reason: z.string(), guard: z.string() }),
      ),
    })
    .optional(),
  metrics: z.array(z.object({ kind: z.string(), hint: z.string() })).optional(),
  perf: z
    .object({
      items: z.array(z.object({ source: z.enum(["LIVE USAGE", "OFFLINE EVAL"]), name: z.string(), value: z.string() })),
      evalCount: z.string(),
      evals: z.array(z.object({ case: z.string(), expected: z.string(), result: z.string() })),
      failedFirst: z.string(),
    })
    .optional(),
  beforeAfter: z
    .object({
      agentTitle: z.string(),
      manual: z.array(Step),
      agent: z.array(Step),
      manualTotal: z.string(),
      agentTotal: z.string(),
    })
    .optional(),
  v2: z.string().optional(),
  learned: z.string().optional(),
  questions: z.array(z.string()).optional(),
  repo: z.string(),
  relatedPost: z.string().optional(),
});
export type CaseStudy = z.infer<typeof CaseStudySchema>;

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.enum(["build", "teardown", "essay", "til"]),
  tag: z.string(),
  date: z.string(),
  readTime: z.string(),
  summary: z.string(),
  /** The related case study. Optional since Platform & API work was removed (Aswin, 2026-11-20). */
  study: z.object({ label: z.string(), slug: z.string() }).optional(),
});
export type Post = z.infer<typeof PostSchema>;

/**
 * content/eval-results.json (SPEC §10): written only by `pnpm evals:results` after a real-model
 * eval run (CI opens a PR with it). `{ "lastRun": null }` until the first run: the site then shows
 * the design's placeholders. These are offline eval numbers, never live usage.
 */
export const EvalResultsSchema = z.union([
  z.object({ lastRun: z.null() }).strict(),
  z
    .object({
      lastRun: z.iso.datetime(),
      cases: z.number().int().positive(),
      passed: z.number().int().nonnegative(),
      passRate: z.number().min(0).max(1),
      redTeam: z.object({ held: z.number().int().nonnegative(), total: z.number().int().nonnegative() }),
      models: z.object({ fit: z.string(), chat: z.string() }),
    })
    .refine((r) => r.passed <= r.cases && r.redTeam.held <= r.redTeam.total && r.redTeam.total <= r.cases, "counts don't add up"),
]);
export type EvalResults = z.infer<typeof EvalResultsSchema>;
