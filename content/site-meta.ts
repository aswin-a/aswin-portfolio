import { todo } from "@/lib/content";

/** Facts used across the site. Every todo() is Aswin's to fill in (SPEC §12). */
export const siteMeta = {
  evalSetLink: todo("[link]"), // TODO(aswin): public eval set on GitHub
  github: "https://github.com/aswin-a", // GitHub profile (Aswin, 2026-11-23)
  linkedin: "https://www.linkedin.com/in/aswin-a-pm", // From the public CV
  domain: "aswin-a.com", // Production domain (Aswin, 2026-11-20)
  postingCadence: todo("[2–3]"), // TODO(aswin): build log cadence, in weeks
  whatBreaksFirstAtScale: todo("[what breaks first at scale]"), // TODO(aswin)
  ninetyDayPlan: todo("[Your 90-day ramp-up plan.]"), // TODO(aswin)
  evalToolingPlan: todo("[How you would adopt the team’s eval tooling.]"), // TODO(aswin): fit-check gap "Running evals at team scale"
  resumeUpdated: "13 Nov 2026", // Date of the CV in public/resume.pdf
  // Offline eval numbers. Milestone 7 replaces these with content/eval-results.json written by CI.
  evalCaseCount: todo("[25]"), // TODO(aswin): eval case count ("[25]" in Hero.dc.html update 5 and the hood card)
  evalFailedFirst: todo("[what broke, and the fix]"), // TODO(aswin)
  noVectorDbReason: todo("[your reason]"), // TODO(aswin): "No vector DB in v1, on purpose: …" (Hero.dc.html update 5)
  evalLastRun: todo("[date]"),
  // X-ray "Build details" (design update 3): "[passed]/[total] cases" and "[held]/[total] held".
  evalPassed: todo("[passed]"),
  evalTotal: todo("[total]"),
  evalRedTeamPassed: todo("[held]"),
  evalRedTeamTotal: todo("[total]"),
} as const;
