import { todo } from "@/lib/content";
import { evalMeta } from "@/lib/eval-results";

/** Facts used across the site. Every todo() is Aswin's to fill in (SPEC §12). */
export const siteMeta = {
  evalSetLink: "https://github.com/aswin-a/aswin-portfolio/tree/main/evals", // Public eval set (Aswin, 2026-11-23)
  github: "https://github.com/aswin-a", // GitHub profile (Aswin, 2026-11-23)
  linkedin: "https://www.linkedin.com/in/aswin-a-pm", // From the public CV
  domain: "aswin-a.com", // Production domain (Aswin, 2026-11-20)
  postingCadence: todo("[2–3]"), // build log cadence, in weeks
  whatBreaksFirstAtScale: todo("[what breaks first at scale]"),
  ninetyDayPlan: "First 30 days: learn the product and the platform by talking to customers, support and the engineers who own it, and read every open integration and escalation. By day 60, own one roadmap area with written success metrics. By day 90, have shipped one improvement in that area and set up a review rhythm with engineering and design.", // Aswin, 2026-11-24
  evalToolingPlan: "I'd run the team's existing eval suite and harness as they are before proposing anything, then add cases from the failures I find: real inputs, red-team inputs and the edge cases customers hit. That's how I worked on this site, where every prompt change has to pass the eval run in CI.", // Fit-check gap "Running evals at team scale" (Aswin, 2026-11-24)
  resumeUpdated: "13 Nov 2026", // Date of the CV in public/resume.pdf
  // Offline eval numbers: content/eval-results.json, written by a real eval run in CI (SPEC §10).
  // Placeholders until the first run. Never typed in by hand; live usage numbers are separate.
  ...evalMeta(),
  evalFailedFirst: todo("[what broke, and the fix]"),
  noVectorDbReason: "everything the AI can quote (my CV, case studies and posts) fits in a single prompt, so retrieval would add a moving part without making answers any better. I'll add one when the content outgrows the context window.", // "No vector DB in v1, on purpose: …" (Hero.dc.html update 5; Aswin, 2026-11-24)
} as const;
