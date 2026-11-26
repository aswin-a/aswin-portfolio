import { siteMeta } from "@/content/site-meta";

export type HoodStatus = "live here" | "case study" | "GitHub" | "shipped" | "prototype" | "planned";

/**
 * "How I build agentic products, with proof" (Main.dc.html `hood`, design update 4). `live` cards
 * turn X-ray on and jump to `href` (`#top` or `#break-my-ai`). No `href` means no link (planned).
 */
export type HoodGroupName = "Agent building blocks" | "Running it reliably" | "Trust and checking" | "Data and context";

export type HoodItem = { name: string; group: HoodGroupName; status: HoodStatus; proof: string; cta: string; href?: string; live?: boolean };

/** The 4 groups of the phone accordion, in order (Mobile.dc.html `MOB_GROUPS`, design update 8). */
export const hoodGroups: { name: HoodGroupName; summary: string }[] = [
  { name: "Agent building blocks", summary: "A 4-step agent, a Claude Skill, and tool calls you can watch live." },
  { name: "Running it reliably", summary: "A fixed pipeline with a retry, session-only memory, and limits with a fallback." },
  { name: "Trust and checking", summary: "Every claim cited, a public eval set, and a person reviewing low-confidence output." },
  { name: "Data and context", summary: "Patient data kept away from LLMs, a docs assistant, and an MCP server next." },
];

export const hood: HoodItem[] = [
  { name: "agents", group: "Agent building blocks", status: "case study", proof: "My job-search agent runs 4 steps and stops for my approval before it applies.", cta: "Read the job-search study →", href: "/work/job-search-agent" },
  { name: "skills", group: "Agent building blocks", status: "GitHub", proof: "I wrote a Claude Skill that scores JD fit against my master resume.", cta: "View the skill →", href: "https://github.com/aswin-a/linkedin-job-search-agent/blob/main/skills/tailored-resume/SKILL.md" },
  { name: "tools", group: "Agent building blocks", status: "live here", proof: "The fit check calls three tools: fetch_url, jd.parse and kb.search.", cta: "See the calls in X-ray →", href: "#top", live: true },
  { name: "orchestration", group: "Running it reliably", status: "live here", proof: "A fixed pipeline with one branch and one retry. The job-search agent picks its own tools.", cta: "Open X-ray →", href: "#top", live: true },
  { name: "memory", group: "Running it reliably", status: "live here", proof: "Your fit result carries into Ask my work for this session, and nothing is stored after.", cta: "Open X-ray →", href: "#top", live: true },
  { name: "production", group: "Running it reliably", status: "live here", proof: "Rate limit, budget cap, and a clear error instead of a guess when either trips.", cta: "Try Break my AI →", href: "#break-my-ai", live: true },
  { name: "guardrails", group: "Trust and checking", status: "live here", proof: "Every claim is cited, gaps are stated, and injected instructions are refused.", cta: "Try Break my AI →", href: "#break-my-ai", live: true },
  { name: "evals", group: "Trust and checking", status: "GitHub", proof: `${siteMeta.evalCaseCount} test JDs and red-team cases, run before every change.`, cta: "View the eval set →", href: siteMeta.evalSetLink },
  { name: "human in loop", group: "Trust and checking", status: "shipped", proof: "I shipped ML OCR for a pharma client: 95% accuracy, with low-confidence results sent to a person.", cta: "Read the OCR story →", href: "/log/ml-ocr-with-a-person-in-the-loop" }, // a build-log post (Aswin, 2026-11-24); COMING SOON while the post has `comingSoon: true`
  { name: "data privacy", group: "Data and context", status: "shipped", proof: "Advised against sending patient data to LLMs at a healthcare SaaS platform.", cta: "Read more →", href: "/log/patient-data-and-llms" }, // a build-log post (Aswin, 2026-11-24); COMING SOON while the post has `comingSoon: true`
  { name: "rag", group: "Data and context", status: "prototype", proof: "A docs Q&A assistant over a platform’s documentation. This site skips a vector DB in v1, on purpose.", cta: "Why no vector DB yet →", href: "/work/fit-check#s-decisions" }, // Decision 01 there is retrieval vs. a vector DB (Aswin, 2026-11-24); hidden until that study is published
  { name: "mcp server", group: "Data and context", status: "planned", proof: "My agent uses MCP connectors today. Next: kb.search as an MCP server you can add to Claude.", cta: "Coming soon" },
];
