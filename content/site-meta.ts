import { todo } from "@/lib/content";
import { evalMeta } from "@/lib/eval-results";

/** Facts used across the site. Every todo() is Aswin's to fill in (SPEC §12). */
export const siteMeta = {
  evalSetLink: "https://github.com/aswin-a/aswin-portfolio/tree/main/evals", // Public eval set (Aswin, 2026-11-23)
  github: "https://github.com/aswin-a", // GitHub profile (Aswin, 2026-11-23)
  linkedin: "https://www.linkedin.com/in/aswin-a-pm", // From the public CV
  domain: "aswin-a.com", // Production domain (Aswin, 2026-11-20)
  postingCadence: todo("[2–3]"), // TODO(aswin): build log cadence, in weeks
  whatBreaksFirstAtScale: todo("[what breaks first at scale]"), // TODO(aswin)
  ninetyDayPlan: todo("[Your 90-day ramp-up plan.]"), // TODO(aswin)
  evalToolingPlan: todo("[How you would adopt the team’s eval tooling.]"), // TODO(aswin): fit-check gap "Running evals at team scale"
  resumeUpdated: "13 Nov 2026", // Date of the CV in public/resume.pdf
  // Offline eval numbers: content/eval-results.json, written by a real eval run in CI (SPEC §10).
  // Placeholders until the first run. Never typed in by hand; live usage numbers are separate.
  ...evalMeta(),
  evalFailedFirst: todo("[what broke, and the fix]"), // TODO(aswin)
  noVectorDbReason: todo("[your reason]"), // TODO(aswin): "No vector DB in v1, on purpose: …" (Hero.dc.html update 5)
} as const;
