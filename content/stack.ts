import { todo } from "@/lib/content";

/**
 * /stack, "My AI-powered operating stack" (design update 11). Copy is word for word from
 * Stack.dc.html, StackMobile.dc.html and StackDiagram.dc.html; layer data follows STACK-HANDOFF.md §3.
 * The R1–R4 cards live in content/stack-rules.ts.
 *
 * Placeholder links are never shown on /stack (Aswin, 2026-11-26): a proof card whose href is still a
 * todo() renders as a plain box with no CTA line, and the closing LinkedIn button is hidden until
 * STACK_POST_URL is set (design update 12 §8).
 */

export type StackProof = {
  kind: string;
  title: string;
  body: string;
  cta: string;
  href: string;
};

export type StackLayer = {
  num: string;
  name: string;
  summary: string;
  tools: string[];
  how: string;
  call: string;
  proof: StackProof;
};

export const stackHero = {
  eyebrow: "HOW I WORK WITH AI", // "/STACK · " dropped (Aswin, 2026-11-26)
  title: "My AI-powered operating stack",
  subline: "Products have a tech stack. Professionals now need an operating stack. Tools change, principles don’t.",
  meta: "1 rule on top · 4 layers · each with proof. Open a layer to see the tools, how I use them and the work it produced.",
  metaPhone: "1 rule on top · 4 layers · each with proof. Tap a layer to open it.",
} as const;

export const stackJudgment = {
  eyebrow: "THE TOP LAYER · NEVER OUTSOURCED",
  title: "Judgment — the layer I never outsource.",
  body: "AI researches, synthesizes, challenges and executes. I stay accountable for what matters, what’s true and what ships.",
  pillsLabel: "What I stay accountable for",
  pills: ["what matters", "what’s true", "what ships"],
  rail: "governs every layer below",
} as const;

export const stackLabels = {
  layers: "Operating stack layers",
  open: "Open",
  close: "Close",
  tools: "TOOLS",
  how: "HOW I USE IT",
  call: "MY CALL · ",
  proof: "PROOF · ",
} as const;

export const stackLayers: StackLayer[] = [
  {
    num: "01",
    name: "Thinking & challenging",
    summary: "Claude with my PM Skills library; ChatGPT and Gemini to challenge big decisions.",
    tools: ["Claude", "PM Skills library", "ChatGPT", "Gemini"],
    how: "I frame the problem myself, then use Claude with my PM Skills to research and draft options. For big decisions I ask a second model to argue against my plan.",
    call: "Which problem is worth solving, and which option I back.",
    proof: {
      kind: "BEFORE / AFTER",
      title: "A decision, before and after the challenge round",
      body: "My first draft, the objections a second model raised, and what I changed.",
      cta: "See the example →",
      href: todo("[link: before/after page]"), // TODO(aswin): the before/after page
    },
  },
  {
    num: "02",
    name: "Context",
    summary: "A product context repo (strategy, personas, metrics, decisions) and OpenSpec for specs.",
    tools: ["Context repo", "OpenSpec", "Markdown", "Git"],
    how: "Strategy, personas, metrics and past decisions live in one repo every AI session starts from. Specs are written in OpenSpec, so a build starts from an agreed spec, not a chat.",
    call: "What goes into the context, and what is out of date.",
    proof: {
      kind: "MASTER RESUME + PRD",
      title: "One source of truth, and a site built from a PRD",
      body: "My master resume feeds every tailored CV and the fit check. This site was built from a written PRD.",
      cta: "Read the PRD →",
      href: todo("[link: PRD page]"), // TODO(aswin): the PRD page
    },
  },
  {
    num: "03",
    name: "Building & communicating",
    summary: "Claude Code prototypes and data checks, to learn, not to ship; PRDs and decision docs.",
    tools: ["Claude Code", "PRDs", "Decision docs"],
    how: "I build throwaway prototypes and quick data checks to test an idea before asking engineering for time. What I learn goes into a PRD or a decision doc.",
    call: "What the prototype proved, and what still needs engineering.",
    proof: {
      kind: "LIVE ON THIS SITE",
      title: "The JD fit check, and how I built it",
      body: "Paste a job description and get a cited verdict. “How I built this” shows the spec, the trade-offs and the evals.",
      cta: "Try the fit check →",
      // A second link to "How I built this" is added once that page exists (STACK-HANDOFF §3).
      href: "/#fit-h",
    },
  },
  {
    num: "04",
    name: "Automation",
    summary: "Scheduled agents for feedback and competitor digests, metrics summaries and meeting briefs.",
    tools: ["Scheduled agents", "MCP connectors", "Claude"],
    how: "Agents run on a schedule and leave a digest for me to read. Anything that sends, applies or publishes waits for my approval.",
    call: "Every action that leaves my desk.",
    proof: {
      kind: "OPEN SOURCE",
      title: "Job-search agent on GitHub",
      body: "Searches LinkedIn, tailors my resume to each JD, and applies only after I approve.",
      // The design's `[repo]` is the job-search agent's repo, as in content/products.ts (Aswin, 2026-11-26).
      cta: "github.com/aswin-a/linkedin-job-search-agent →",
      href: "https://github.com/aswin-a/linkedin-job-search-agent",
    },
  },
];

export const stackRulesHeading = {
  eyebrow: "JUDGMENT RULES",
  title: "Four rules the whole stack runs on",
} as const;

export const stackClosing = {
  title: "What’s in your stack?",
  body: "I wrote about building mine on LinkedIn. Tell me what’s in yours.",
  cta: "Read the LinkedIn post",
} as const;

/** The LinkedIn post about building the stack. Empty hides the button (design update 12 §8). TODO(aswin): the post's URL. */
export const STACK_POST_URL: string = "";

/** Homepage strip (HomeStrip.dc.html, Main.dc.html, Mobile.dc.html). */
export const stackStrip = {
  label: "Operating stack",
  eyebrow: "HOW I WORK WITH AI", // design update 12 §9
  statement: "I run on an AI-powered operating stack.",
  cta: "See how I work, layer by layer",
  arrow: "→",
} as const;
