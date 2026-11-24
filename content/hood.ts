import { siteMeta } from "@/content/site-meta";
import { todo } from "@/lib/content";

export type HoodStatus = "live here" | "case study" | "GitHub" | "shipped" | "prototype" | "planned";

/**
 * "How I build agentic products, with proof" (Main.dc.html `hood`, design update 4). `live` cards
 * turn X-ray on and jump to `href` (`#top` or `#break-my-ai`). No `href` means no link (planned).
 */
export type HoodItem = { name: string; status: HoodStatus; proof: string; cta: string; href?: string; live?: boolean };

export const hood: HoodItem[] = [
  { name: "agents", status: "case study", proof: "My job-search agent runs 4 steps and stops for my approval before it applies.", cta: "Read the job-search study →", href: "/work/job-search-agent" },
  { name: "skills", status: "GitHub", proof: "I wrote a Claude Skill that scores JD fit against my master resume.", cta: "View the skill →", href: todo("[link]") }, // the skill on GitHub
  { name: "tools", status: "live here", proof: "The fit check calls three tools: fetch_url, jd.parse and kb.search.", cta: "See the calls in X-ray →", href: "#top", live: true },
  { name: "orchestration", status: "live here", proof: "A fixed pipeline with one branch and one retry. The job-search agent picks its own tools.", cta: "Open X-ray →", href: "#top", live: true },
  { name: "memory", status: "live here", proof: "Your fit result carries into Ask my work for this session, and nothing is stored after.", cta: "Open X-ray →", href: "#top", live: true },
  { name: "production", status: "live here", proof: "Rate limit, budget cap, and a precomputed fallback when either trips.", cta: "Try Break my AI →", href: "#break-my-ai", live: true },
  { name: "guardrails", status: "live here", proof: "Every claim is cited, gaps are stated, and injected instructions are refused.", cta: "Try Break my AI →", href: "#break-my-ai", live: true },
  { name: "evals", status: "GitHub", proof: `${siteMeta.evalCaseCount} test JDs and red-team cases, run before every change.`, cta: "View the eval set →", href: siteMeta.evalSetLink },
  { name: "human in loop", status: "shipped", proof: "I shipped ML OCR for a pharma client: 95% accuracy, with low-confidence results sent to a person.", cta: "Read the OCR story →", href: todo("[link]") }, // the OCR story
  { name: "data privacy", status: "shipped", proof: "Advised against sending patient data to LLMs at a healthcare SaaS platform.", cta: "Read more →", href: todo("[link]") },
  { name: "rag", status: "prototype", proof: "A docs Q&A assistant over a platform’s documentation. This site skips a vector DB in v1, on purpose.", cta: "Why no vector DB yet →", href: "/work/fit-check#s-decisions" }, // Decision 01 there is retrieval vs. a vector DB (Aswin, 2026-11-24); hidden until that study is published
  { name: "mcp server", status: "planned", proof: "My agent uses MCP connectors today. Next: kb.search as an MCP server you can add to Claude.", cta: "Coming soon" },
];
