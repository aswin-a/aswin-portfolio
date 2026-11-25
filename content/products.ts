/** One step of "How it works". A `human` step is where a person decides (amber, "· person decides"). */
export type FlowStep = { text: string; human?: boolean };

/**
 * "Products I've built" (Main.dc.html `products`, design update 4). `status` is data only: neither the
 * desktop cards nor the phone cards show it (design update 9).
 */
export type Product = {
  num: string;
  /** The product's case study, `/work/{slug}`. */
  slug: string;
  status: string;
  name: string;
  pitch: string;
  built: string;
  flow: FlowStep[];
  tags: string[];
  /** The main button. None while there is nothing to show (the Instagram agent has no run yet). */
  primary?: { label: string; href: string };
  secondary: { label: string; href: string };
  /** The shorter pitch on the phone card (Mobile.dc.html `MOB_WORK`, design update 9). */
  phonePitch: string;
};

export const products: Product[] = [
  {
    num: "01",
    slug: "job-search-agent",
    status: "IN USE · RECORDED RUN",
    name: "AI job search and apply agent",
    pitch: "Finds roles that fit, tailors my resume to each one, and applies only after I say yes. Shown as a recorded run, since it signs in as me.",
    phonePitch: "Finds roles that fit, tailors my resume to each, and applies only after I say yes.",
    built: "The project instructions, step prompts A–F and the approval step.",
    flow: [
      { text: "Search LinkedIn and save matches" },
      { text: "Write the ideal resume for the JD" },
      { text: "Tailor mine with a three-way map" },
      { text: "Wait for my approval", human: true },
      { text: "Apply" },
    ],
    tags: ["agents", "tools", "orchestration"],
    primary: { label: "Add to Claude/ChatGPT", href: "https://github.com/aswin-a/linkedin-job-search-agent" }, // Aswin, 2026-11-24
    secondary: { label: "Read the case study →", href: "/work/job-search-agent" },
  },
  {
    num: "02",
    slug: "fit-check",
    status: "LIVE HERE",
    name: "Job-fit AI on this site",
    pitch: "Paste a job description and get an honest verdict: what fits with proof, and what doesn’t, stated plainly.",
    phonePitch: "Paste a job description and get an honest verdict: what fits, with proof, and what doesn’t.",
    built: "The pipeline, the knowledge base built from my master resume, the guardrails and the eval set.",
    flow: [
      { text: "Paste a JD or a link" },
      { text: "fetch_url, only for links" },
      { text: "Parse requirements, search the record" },
      { text: "Guardrails check every claim" },
      { text: "Cited verdict, gaps included" },
    ],
    tags: ["tools", "guardrails", "evals"],
    primary: { label: "Try it above ↑", href: "#fit-h" },
    secondary: { label: "Read the case study →", href: "/work/fit-check" },
  },
  {
    num: "03",
    slug: "integration-builder",
    status: "CONCEPT",
    name: "AI integration builder",
    pitch: "Lets AI draft connectors for the long tail of SaaS apps, with safeguards so nothing reaches production unreviewed. A CloudEagle.ai take-home, shared with permission.",
    phonePitch: "AI drafts connectors for long-tail SaaS apps, and nothing reaches production unreviewed. A CloudEagle.ai take-home.",
    built: "The product spec and design notes, the six-step admin flow and screens, the safeguard rules, and the working prototype.", // Aswin, 2026-11-24
    flow: [
      { text: "Paste the app’s API docs" },
      { text: "AI drafts the connector" },
      { text: "Policy checks: scopes, secrets, allow-list" },
      { text: "A person approves the diff", human: true },
      { text: "Deploy" },
    ],
    tags: ["integrations", "guardrails"],
    primary: { label: "Run it locally", href: "https://github.com/aswin-a/cloudeagle-ai-integration-builder" }, // Aswin, 2026-11-24
    secondary: { label: "Read the case study →", href: "/work/integration-builder" },
  },
  {
    num: "04",
    slug: "instagram-agent",
    status: "IN PROGRESS", // Not run yet (Aswin, 2026-11-24): the design's "IN USE · RECORDED RUN" returns with a real run
    name: "Instagram content intelligence agent",
    pitch: "Reads what competing pet-food brands post, finds what performs and what’s trending, and suggests what Dhee’s should post next.",
    phonePitch: "Finds what competing pet-food brands post that performs, and suggests what Dhee’s should post next.",
    built: "The agent’s prompts and analysis steps.",
    flow: [
      { text: "Pick the competitors to watch" },
      { text: "Pull their recent posts" },
      { text: "Rank what performs" },
      { text: "Spot trending formats" },
      { text: "Suggest Dhee’s next posts" },
    ],
    tags: ["agents", "tools"],
    primary: { label: "Add to Claude/ChatGPT", href: "https://github.com/aswin-a/instagram-content-intelligence-agent" }, // Aswin, 2026-11-24
    secondary: { label: "Read the case study →", href: "/work/instagram-agent" },
  },
];
