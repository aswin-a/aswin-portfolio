import { todo } from "@/lib/content";

/** Facts used across the site. Every todo() is Aswin's to fill in (SPEC §12). */
export const siteMeta = {
  evalSetLink: todo("[link]"), // TODO(aswin): public eval set on GitHub
  github: todo("[link]"), // TODO(aswin): GitHub profile
  linkedin: "https://www.linkedin.com/in/aswin-a-pm", // From the public CV
  domain: "aswin-a.com", // Production domain (Aswin, 2026-11-20)
  responseTime: todo("[response time]"), // TODO(aswin): "usually within …" on the contact success state
  postingCadence: todo("[2–3]"), // TODO(aswin): build log cadence, in weeks
  whatBreaksFirstAtScale: todo("[what breaks first at scale]"), // TODO(aswin)
  next: todo("[what you'll improve]"), // TODO(aswin)
  costPerRun: todo("[cost per run]"), // TODO(aswin): measured, never invented
  ninetyDayPlan: todo("[Your 90-day ramp-up plan.]"), // TODO(aswin)
  evalToolingPlan: todo("[How you would adopt the team’s eval tooling.]"), // TODO(aswin): fit-check gap "Running evals at team scale"
  resumeUpdated: "13 Nov 2026", // Date of the CV in public/resume.pdf
  liveResponseTime: todo("[response time]"), // TODO(aswin): measured median, live usage
  // Offline eval numbers. Milestone 7 replaces these with content/eval-results.json written by CI.
  evalCaseCount: todo("[N]"),
  evalPassRate: todo("[measured]"),
  evalFailedFirst: todo("[what broke]"),
  evalLastRun: todo("[date]"),
  // X-ray "Build details" (design update 3): "[passed]/[total] cases" and "[held]/[total] held".
  evalPassed: todo("[passed]"),
  evalTotal: todo("[total]"),
  evalRedTeamPassed: todo("[held]"),
  evalRedTeamTotal: todo("[total]"),
} as const;
