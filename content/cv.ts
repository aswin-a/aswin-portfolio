/**
 * The CV, word for word from the CV_STATS, CV_GENERAL, CV_ITEMS and CV_SKILLS arrays in
 * design/About.dc.html (design update 15). This file is the one source: the CV page (/about),
 * "Copy as plain text", /about.md and the knowledge base (content/kb/*) are all generated from it,
 * so the CV page and the AI can never disagree. Don't paraphrase; change the design first.
 *
 * Changes from the prototype: `qa` keeps only the questions (the canned `a` answers are never
 * shown; topic questions go to the live Ask endpoint, SPEC §5), design file links become routes
 * (Main.dc.html → "/"), and each Zelthy area has a stable `id` for the `#cv=` deep links
 * (SPEC §6.1; Aswin, 2026-11-27), so reordering areas doesn't break a shared link.
 */

export type CvLane = "work" | "project" | "edu";
/** `id` is ours, not the design's: the area's stable name in `#cv=` links. Never reuse or rename one. */
export type CvGroup = { id: string; name: string; summary: string; items: string[] };
export type CvQuestion = { q: string };
export type CvItem = {
  id: string;
  lane: CvLane;
  dates: string;
  title: string;
  org: string;
  ladder?: string;
  scope: string;
  highlights: string[];
  /** "Everything I did" (design update 15): the full list behind a project's highlights. */
  full?: string[];
  groups?: CvGroup[];
  qa?: CvQuestion[];
  link?: string;
  href?: string;
  link2?: string;
  href2?: string;
};
/** [figure, caption] */
export type CvStat = [big: string, small: string];
/** [name, list] */
export type CvSkill = [name: string, list: string];
export type CvTopic = { label: string; qa: CvQuestion[] };

/** When this CV content was last synced from the master resume (ISO date). The CV page's sync line shows it. */
export const cvUpdated = "2026-11-27";

/** The header (About.dc.html markup and cvPlainText()). */
export const cvHeader = {
  eyebrow: "CURRICULUM VITAE",
  name: "Aswin A",
  role: "Senior Product Manager · Platforms and Agentic AI · Enterprise SaaS",
  location: "Chennai, Tamil Nadu, India",
  links: [
    { label: "LinkedIn", href: "https://linkedin.com/in/aswin-a-pm", plain: "linkedin.com/in/aswin-a-pm" },
    { label: "GitHub", href: "https://github.com/aswin-a", plain: "github.com/aswin-a" },
    { label: "aswin-a.com", href: "https://aswin-a.com", plain: "aswin-a.com" },
  ],
  summary:
    "I’ve spent nine years across product and technology: four as a product manager at Zelthy, rising from Associate PM to Senior PM on a multi-tenant B2B SaaS platform, and about five as a founder across two startups. I own platforms end to end, from the workflow engine, RBAC and SSO to the connector framework and release gates. In 2026 I specified and built agentic and LLM products with Claude Code from my own PRDs and specs.",
  /** The CV PDF Aswin uploaded (Aswin, 2026-11-27), served from public/; not generated at build time. */
  downloadPdf: { label: "Download PDF", href: "/aswin-a-cv.pdf" },
  /** Followed by cvUpdated, formatted "27 Nov 2026". */
  synced: { label: "Synced from my master resume" },
};

export const cvStats: CvStat[] = [
  ["9 years","across product and technology; 2 startups founded"],
  ["125% growth","in B2B product revenue over 3 years at Zelthy"],
  ["17 packages","shipped in 8 months; 95% adoption, 80% faster to deploy"],
  ["1M API calls a day","at peak, across 100+ tenants and 25,000 users"],
];

/** The general topic: the Ask box's chips and the Nav's Ask button on the CV page. */
export const cvGeneral: CvTopic = {
  label: "My experience",
  qa: [
    { q: "What did he own at Zelthy?" },
    { q: "Has he managed integrations at scale?" },
    { q: "Has he led a team?" },
  ],
};

export const cvItems: CvItem[] = [
  {
    id: "site",
    lane: "project",
    dates: "Nov 2026",
    title: "AI Fit-Check Product for Recruiters",
    org: "Live on aswin-a.com",
    scope: "A recruiter pastes a JD or job link and gets a cited fit check with up to 10 matches and gaps, with no scores or percentages.",
    highlights: [
      "Wrote the PRD, build spec and coding-agent rules; Claude Code wrote the code (176 commits)",
      "Honesty enforced by deterministic guards in code, not prompts; a public Promptfoo eval suite runs in CI on every push",
      "Lighthouse mobile scores of 100 for accessibility, best practices and SEO, and 94-96 for performance",
    ],
    full: [
      "Wrote the PRD, build spec (SPEC.md) and AI coding-agent rules (CLAUDE.md) and iterated requirements with Claude Code, which wrote the code (176 commits), to ship a live AI product: a recruiter pastes a JD or job link and gets a cited fit check with up to 10 matches and gaps, with no scores or percentages. Stack: Next.js 16, React 19, TypeScript, Vercel AI SDK, Claude.",
      "Designed a fixed, streamed pipeline (link fetch, JD parse, knowledge-base search, evidence mapping, two citation and honesty guards, verdict) over a typed knowledge base of roles, projects, facts and a not-done list, and chose deterministic keyword and tag retrieval over embeddings or a vector database so every result is auditable; when a job site blocks the link reader, the run stops before any model call and asks for pasted text.",
      "Enforced honesty with deterministic guards in code rather than prompts: claims without a source become gaps, verdict counts must match the cards shown and not-done topics never appear as matches; user text is wrapped and treated as data, and the model has no state-changing tools.",
      "Set production guardrails and cost controls: Zod validation, Cloudflare Turnstile, per-visitor rate limits, a monthly budget cap (Upstash Redis) and an output-token limit; privacy by design, with JDs and questions never stored and only run metrics (steps, tokens, cost, latency) logged to Supabase.",
      "Built a public Promptfoo eval suite that runs sample JDs and every red-team prompt injection through the real pipeline (valid output, no uncited matches, no strong verdict for a poor fit, no not-done topic shown as a match, refused injections); CI runs it on every push with a deterministic fake model, a separate real-model workflow opens a pull request with updated results, and offline eval results are kept separate from live usage.",
      "Added AI transparency features: an X-ray mode with real run traces (timings, tokens, cost), a Break my AI red-team panel against the live guardrails, and Ask my work Q&A with source citations and session memory with a Forget this control.",
      "Reached Lighthouse mobile scores of 100 for accessibility, best practices and SEO on every route and 94-96 for performance; WCAG AA contrast verified by a unit test; Vitest unit tests and Playwright visual tests.",
    ],
    link: "Try it on the home page →",
    href: "/#fit-h",
    link2: "github.com/aswin-a/aswin-portfolio ↗",
    href2: "https://github.com/aswin-a/aswin-portfolio",
  },
  {
    id: "builder",
    lane: "project",
    dates: "Nov 2026",
    title: "AI Connector Builder for SaaS APIs",
    org: "Prototype",
    scope: "AI turns a SaaS app's API docs into a schema-validated, read-only declarative connector that a non-developer IT admin completes by answering 1-3 questions.",
    highlights: [
      "A control plane that never holds credentials; an egress guard allows only GET and HEAD and caps a run at 25 requests",
      "Layered prompt-injection safeguards and a bounded test-and-fix loop with model routing (Sonnet, then Opus)",
      "A live Calendly run passed the loop with 0 safety violations, at an estimated USD 0.10-0.30 per connector build",
    ],
    full: [
      "Specified and iterated with Claude Code, which wrote the code (Python standard library, Anthropic API), a prototype in which AI turns a SaaS app's API docs into a schema-validated, read-only declarative connector (no generated code) that a non-developer IT admin completes by answering 1-3 questions, connecting a token and approving sample records; wrote the PRD with a production target of 15-20 long-tail APIs and a release gate of at least 80% loop pass and 0 safety violations.",
      "Split the design into a control plane that never holds credentials and a data plane that handles auth, pagination, retries and logging; an egress guard allows only GET and HEAD, locks the host and caps a run at 25 requests; the engine runs 8 checks of its own, including that the token works, every page is read once and no secrets appear in logs or in anything sent to the AI.",
      "Layered prompt-injection safeguards: same-domain doc fetch with SHA-256 snapshot pinning and refused off-domain redirects, docs wrapped as untrusted, a regex plus Claude Haiku scan before drafting, a no-tool JSON-only model and a hard validator gate (chosen because strict structured outputs could not compile the schema).",
      "Designed a bounded test-and-fix loop with model routing (Sonnet for attempts 1-2, Opus for the final attempt, at most 3), redacted data shapes only and deterministic diffs with meaning changes flagged for human confirmation, then a go-live gate of sample records, attestation and shadow mode until 3 clean syncs and owner trust, with auto-pause on a drop of more than 20% in people.",
      "Built an eval harness with hand-labelled golden connectors for Calendly and Okta (field accuracy across 14 key locations, first-pass rate, loop pass rate, attempts, safety violations, cost, time) and 19 offline unit tests; a live Calendly run passed the loop with 0 safety violations, at an estimated USD 0.10-0.30 per connector build.",
    ],
    link: "github.com/aswin-a/ai-integration-builder ↗",
    href: "https://github.com/aswin-a/ai-integration-builder",
  },
  {
    id: "jsa",
    lane: "project",
    dates: "Oct – Nov 2026",
    title: "Agentic Job-Search and Apply Assistant",
    org: "Claude agent · Agent Skills · MCP connectors",
    scope: "A multi-step Claude agent with an orchestrator prompt and 7 Agent Skills, one per stage, connected to Google Drive, Docs, Sheets and Chrome through MCP connectors.",
    highlights: [
      "A custom Skill scores job fit against the master resume and JD",
      "A two-key human approval gate that page text cannot open",
      "Used to prepare 20+ applications; fit scores compared with LinkedIn's match score as an informal quality check",
    ],
    full: [
      "Designed and published a multi-step Claude agent with an orchestrator prompt and 7 Agent Skills, one per stage (job search, ideal resume, tailored resume, cover letter, apply, tracker sync, HR outreach), including a custom Skill that scores job fit against the master resume and JD; connected it to Google Drive, Docs, Sheets and Chrome through MCP connectors.",
      "Designed the context rules (source-of-truth documents, token limits) and state in Google Drive and a tracker sheet with a data contract per column and thread-per-job handoffs.",
      "Built a two-key human approval gate (an exact approval line, then SUBMIT after a field-by-field review) that page text cannot open, with a prompt-injection test case; CI checks privacy, skill and link lint and resume format; documented known weaknesses in a design review; used it to prepare 20+ applications and compared its fit scores with LinkedIn's match score as an informal quality check.",
    ],
    link: "github.com/aswin-a/linkedin-job-search-agent ↗",
    href: "https://github.com/aswin-a/linkedin-job-search-agent",
  },
  {
    id: "ig",
    lane: "project",
    dates: "2026",
    title: "Instagram Content-Intelligence Agent for a Pet Food Brand",
    org: "Built, not yet validated",
    scope: "A Claude Project with 4 Agent Skills that browses Instagram read-only and produces one report of competitor posts, trends and content ideas; a person approves and posts, and the agent never posts.",
    highlights: [
      "Sourced, normalized metrics: each post compared with its own account's median within one format",
      "A claims-check gate, because a food brand cannot make health claims",
      "Seeded eval cases and an idea rubric written (not yet run)",
    ],
    full: [
      "Designed a Claude content-intelligence agent: a Claude Project with a system prompt, brand docs and 4 Agent Skills (competitor analysis, trend scouting, content ideation, claims check) that browses Instagram read-only through Claude in Chrome and produces one report (top and bottom competitor posts, patterns, phone-shootable trends rated by difficulty, 10 content ideas, competitor gaps, risk flags) plus CSV records; a person approves and posts, and the agent never posts.",
      "Defined sourced, normalized metrics: each post compared with its own account's median within one format, outliers at 2x that median, values that are not visible marked not available rather than estimated, every record carrying its source URL, and patterns requiring at least 2 accounts or 3 posts; Python scripts compute medians and outliers from CSV and check the repo for frontmatter, link and schema drift.",
      "Added a claims-check gate so the agent's own ideas reach the report only after they pass, are rewritten or are dropped, with risk flags on competitor claims, because a food brand cannot make health claims; captions, comments and bios are treated as data, not instructions; the agent never likes, follows, comments, DMs or posts, and stops at CAPTCHAs and login walls; wrote seeded eval cases and an idea rubric (not yet run).",
    ],
    link: "github.com/aswin-a/instagram-content-intelligence-agent ↗",
    href: "https://github.com/aswin-a/instagram-content-intelligence-agent",
  },
  {
    id: "web",
    lane: "project",
    dates: "Oct 2024 – Sep 2026",
    title: "Dhee’s website",
    org: "Built for Dhee’s · Astro 6, Tailwind CSS 4, Cloudflare Pages",
    scope: "A single landing page (hero, products, testimonials, service areas and contact), built with Cursor and v0 and deployed to Cloudflare Pages with Wrangler.",
    highlights: [
      "One data file feeds both the page and JSON-LD structured data, so local SEO markup stays in sync",
      "First page of search results for fresh dog food in Chennai",
      "Orders and enquiries over WhatsApp, with a contact form that opens a pre-filled message",
    ],
    link: "Visit dhees.com ↗",
    href: "https://dhees.com",
    link2: "github.com/aswin-a/dpc-website ↗",
    href2: "https://github.com/aswin-a/dpc-website",
  },
  {
    id: "dhees",
    lane: "work",
    dates: "Oct 2024 – Sep 2026",
    title: "Founder and Product Lead",
    org: "Dhee’s Pet Company · Chennai",
    scope: "Founded and ran a made-to-order fresh pet food business for cats and dogs; built its product, operating systems and go-to-market from zero.",
    highlights: [
      "Owned 5 SKUs, recipes, marketing and sales; about 20 customers and 20 orders a month",
      "Sized the Chennai market and wrote the market requirements document",
      "Ran customer interviews, worked out margin per pack and changed pricing twice",
      "Extended ERPNext with custom records for pets, owners and pack sizes",
      "Generated production plans from sales orders automatically, saving about 1 hour a day",
      "Built pack and carton labels, and got a label printer working on Linux with no vendor driver",
      "Ran purchasing, inventory, delivery routing and invoicing in ERPNext",
      "Built the website (dhees.com) with Cursor and v0; first page of search results for fresh dog food in Chennai",
      "Kept local SEO in sync from one data file; orders and enquiries over WhatsApp",
      "Ran Google and Meta ads (INR 15,000 over one month); narrower targeting improved lead quality",
    ],
    qa: [
      { q: "What did he build to run the business?" },
      { q: "How did he find customers?" },
      { q: "How did he decide pricing?" },
    ],
  },
  {
    id: "zelthy",
    lane: "work",
    dates: "Sep 2020 – Sep 2024",
    title: "Senior Product Manager",
    org: "Zelthy (Multi-Tenant SaaS Low-Code Platform) · Bangalore (remote)",
    ladder: "Senior Product Manager, Oct 2022 – Sep 2024 · Product Manager, Dec 2020 – Sep 2022 · Associate Product Manager, Sep 2020 – Nov 2020",
    scope: "About 50-person startup. Platform served 100+ tenants, 25,000 users and 1M API calls/day at peak, with healthcare and pharma clients that were regional arms of global enterprises in Singapore, Malaysia, Vietnam, Hong Kong and Australia.",
    highlights: [],
    groups: [
      {
        id: "core",
        name: "Core Platform",
        summary: "Owned the workflow engine, data models and app lifecycle as priced packages. A shared directory app now powers about 15 apps.",
        items: [
          "Owned the product lifecycle and defined vision, strategy and roadmap for core platform capabilities: workflow engine, RBAC, authentication, data models, app lifecycle management, audit trails and messaging, designed as independent, customizable packages with pricing for each.",
          "Specified the workflow engine's condition-based rules evaluated at runtime and multi-level approvals routed by role and condition, used in apps such as contract management with contract and approval flows; decomposed components into reusable modules, contributed to multi-tenancy design and gave engineering data models and schema designs.",
          "Resolved a multi-tenant trade-off (data duplication versus per-app field flexibility) by proposing a shared directory app and persuading the CEO and CTO to build it; it now powers about 15 apps.",
          "Enabled tenants and app builders to define custom fields, foreign keys and one-to-many child tables on a base model with built-in workflow, RBAC/ABAC, export and API support; owned app lifecycle management (versioning, dev-to-staging-to-production promotion, rollback); long-running tasks such as report exports ran as background jobs.",
        ],
      },
      {
        id: "integrations",
        name: "Identity, Integrations and Data Sync",
        summary: "RBAC/ABAC and SSO for 100+ tenants. A connector framework across 50+ tenants, 10+ integrations and a SOAP sync of millions of rows.",
        items: [
          "Delivered RBAC with attribute-based row and column filters so tenant admins across 100+ tenants self-manage users, roles and permissions; delivered SAML SSO with Azure AD for 10+ enterprise clients and OIDC login; specified MFA, OTP login, password policies, a 1-hour session timeout, single-session login, IP allowlisting, approval-based user provisioning and audit trails of every login, action and view.",
          "Built a connector framework of reusable connectors enabled and configured from one dashboard, replacing one-off per-app integrations, used across 50+ tenants; led integration of 10+ third-party services (Zoom, Twilio, DocuSign, SAP, Power BI, Azure AD) and client EHR systems, including inbound webhooks; ran API design reviews on REST endpoints, webhooks, authentication (API keys, OAuth) and request and response formats, testing APIs in Postman.",
          "Led a daily two-way batch sync over client SOAP APIs handling millions of rows, with reconciliation and alerts for failed transfers, and caught a missed item-update path in the SKU sync before release; evaluated HL7 and FHIR and chose a FHIR converter per package (design stage).",
          "Migrated client master data (HCPs, hospitals, clinics) from Excel into apps, cleaning data, mapping columns to fields, de-duplicating, sequencing imports by foreign-key dependencies and defining validation rules.",
        ],
      },
      {
        id: "ai-ml",
        name: "AI, ML and Data",
        summary: "ML OCR in production at 95% accuracy with human review. Platform v3 built for AI coding. LLM prototypes and 10+ Power BI dashboards.",
        items: [
          "Wrote requirements for ML-based OCR of patient prescriptions and bills in patient reimbursement apps, shipped to production: evaluated vendors on price and accuracy with about 100 labelled documents; results under 90% confidence go to human review (about 10%); accuracy held at 95%; auto-fills 20+ documents a day, saving about 5 minutes per document and replacing a manual process that ran at 10-12 documents an hour.",
          "Ideated and launched platform v3, moving from UI-based configuration to code-based development built for AI coding while keeping full customizability, cutting internal development time from 2 months to as little as 2 weeks (up to 75%); v3 rebuilt RBAC and the workflow engine and ran alongside the previous version for backward compatibility.",
          "Prototyped LLM features (not shipped): ChatGPT-generated app configurations as JSON, reaching about 70% working without fixes after diagnosing wrong-field-type failures and fixing them with GPT-4, prompts with good and bad examples and a JSON schema; compared GPT-4 and GPT-3.5 on output quality and selected GPT-4.",
          "Built a chat-to-app proof of concept with LLMs and LangChain (prompts, JSON output schema, generated apps checked against previously built ones) and a RAG assistant over the platform's product documentation (both not shipped); created technical training videos with AI-assisted scripts and voiceovers.",
          "Built batch pipelines from apps into a data lake and delivered 10+ Power BI dashboards over millions of records for managers and regional leads; most client apps had built-in reports for client admins; advised against sending patient data to LLMs because of privacy risk; coached 5 PMs to use ChatGPT for PRDs and documentation.",
        ],
      },
      {
        id: "delivery",
        name: "Product Delivery and Roadmap",
        summary: "17 packages in 8 months with 95% adoption. 125% growth in B2B product revenue. 80% of roadmap commitments on time.",
        items: [
          "Delivered 17 software packages in 8 months (CRM, Appointment Scheduling, Messaging, CMS for Patient Education Programs with creator and approver roles, drafts and scheduling); 95% of new apps adopted them and time to deploy fell 80%.",
          "Updated the product vision and new-features roadmap, contributing to 125% growth in B2B product revenue over 3 years; ran 30+ customer interviews, 5+ competitor analyses and 10+ vendor evaluations, and discovery drove the move to platform v3.",
          "Prioritized with RICE, client input and adoption, defect and time-to-deploy metrics across 3 teams with quarterly planning, sizing features in story points against capacity; wrote 150+ user stories per quarter with acceptance criteria and Jira traceability to test cases; delivered 80% of roadmap commitments on time.",
          "Resolved engineering feasibility and timeline pushback by proposing alternative technical or product approaches; split a D2C patient-ordering app into two phases (order lifecycle and core flows first, SAP integration later) so phase 1 launched on time; largest program: 4 engineers, 2 countries, 2 years, delivered on the committed date; launched a client program in 3 countries and rolled out a template in 5.",
          "Delivered native Android and iOS apps with GPS and push notifications for 100+ field staff and 1,000+ SMS notifications a day; most client apps were multi-language (English plus Thai, Vietnamese or Malay); worked with design to deliver 70+ designs on a shared UI component library and design system, creating wireframes for design discussions.",
        ],
      },
      {
        id: "releases",
        name: "Releases, Reliability and Compliance",
        summary: "Release gates and staged releases, a 99.5% uptime SLA met, and GDPR, HIPAA and SOC2 with penetration testing passed.",
        items: [
          "Defined the path to production: release criteria, release gates and staged releases across dev, staging and production with client UAT sign-off; set up the QA process; coordinated Play Store and App Store releases; owned bug triage, integration alerts, incident handling and release notes.",
          "Defined support SLAs in contracts with a 99.5% uptime commitment, measured and met; monitored API errors with Sentry and wrote incident post-mortems for clients.",
          "Specified security, privacy and regulatory requirements to meet GDPR, HIPAA and SOC2 with 100% compliance; the platform passed penetration testing; wrote IQ, OQ and PQ validation documents, checked vendors against HIPAA and met data residency by hosting client data in Singapore and Australia.",
        ],
      },
      {
        id: "commercial",
        name: "Commercial, Go-to-Market and Developer Adoption",
        summary: "Moved pricing to usage-based. 2 enterprise RFP wins of about USD 100K each. Templates beta added USD 200K+ in revenue. Docs that saved 500 hours.",
        items: [
          "Initiated the shift from seat-based to usage-based pricing, designed the meters and tiers from market analysis, customer value and competitor benchmarks, and persuaded sales leadership to adopt it; adopted in 2 key enterprise deals and multiple RFPs.",
          "Supported CEO-led sales with presales, the sales deck, pricing and RFP preparation, answering security and compliance sections; contributed to 2 enterprise RFP wins averaging about USD 100K; created quotations, effort estimates and project charters, and created and reviewed client contracts.",
          "Piloted configurable app templates as a beta with about 20 client business users; after adding training and documentation, clients built apps without support; 6 apps deployed, saving clients USD 150K+ and adding USD 200K+ in revenue.",
          "Wrote product positioning, messaging and launch plans; for the v3 launch, wrote customer release notes and created demo videos; wrote launch communications and supported rollouts for 10+ clients.",
          "Authored the platform's product documentation used by every team and developer building on it, saving 500 hours of developer time; built an open-source developer community on Discord (50+ members) after the core was open-sourced as Zango, onboarded external developers and wrote the zango.dev getting-started guide.",
        ],
      },
      {
        id: "leadership",
        name: "Team Leadership",
        summary: "Led 5 PMs and 2 interns; hired 3 and drove 4 promotions. Utilization up 20%.",
        items: [
          "Led and mentored 5 product managers and 2 interns; hired 3 of the PMs and ran 1:1s and feedback reviews that drove 4 promotions; led recruitment, training and mentoring of 10+ team members and conducted performance reviews with the CEO.",
          "Ran the PM operating rhythm (weekly product reviews, PRD reviews, quarterly roadmap reviews) and quarterly resource planning that improved utilization by 20%; administered Jira and built automations and workflows; ran internal product updates and training.",
        ],
      },
      {
        id: "client-ops",
        name: "Client Engagement and Delivery Operations",
        summary: "8+ enterprise clients up to VP level. 20+ projects worth USD 500K+. Scope creep down 80%+.",
        items: [
          "Engagement manager for 8+ global enterprise clients, working with executives up to VP level, running up to 5 projects in parallel with monthly steering meetings; handled escalations, including recovering an unhappy client engagement on site in Thailand with a plan of quick wins and long-term fixes; advised pharma and distribution clients on their digital products.",
          "Managed 20+ enterprise solution projects valued at USD 500K+ and created solutions for 60+ web and mobile proposals; headed project teams of 20+ BAs, PMs, engineers, designers and QAs, with 80% of projects completed on time and within budget; tracked risks, dependencies and project financials and reported delivery metrics to the CEO.",
          "Established Agile Scrum delivery on Jira (1-week sprints, biweekly releases, change management, scope control), reducing scope creep by 80%+, cutting turnaround time by 30% and increasing development efficiency by 40%; standardized project documents and set up support in Jira; ran 10+ client projects in Rocketlane.",
        ],
      },
    ],
    qa: [
      { q: "What did he own on the platform?" },
      { q: "How big was the integration work?" },
      { q: "What did he ship with ML or AI?" },
    ],
  },
  {
    id: "solar",
    lane: "work",
    dates: "May 2017 – Jun 2020",
    title: "Co-Founder, Product and Technology",
    org: "The Solar Labs · Delhi",
    scope: "B2B SaaS solar design software for solar installers and EPC firms.",
    highlights: [
      "Co-founded the company and led product and technology from day one; INR 50L+ in revenue",
      "Built 3D solar design software from satellite imagery; wrote frontend and Python backend code for about 3 years",
      "Shipped 50+ ease-of-use features, cutting proposal creation time by 90%",
      "Onboarded and supported 400+ customers; shadowed users and added an onboarding flow",
      "Hired and led 8 developers, interviewing 100+ candidates",
    ],
    qa: [
      { q: "What did he build?" },
      { q: "What was the impact?" },
    ],
  },
  {
    id: "edu",
    lane: "edu",
    dates: "Jun 2013 – May 2017",
    title: "B.Tech, Computer Science and Engineering",
    org: "IIT Mandi",
    scope: "",
    highlights: [],
  },
];

export const cvSkills: CvSkill[] = [
  ["Agentic AI and LLM Products","AI Agents, Agent Skills, Multi-Step Agent Workflows, Orchestrator Prompts, Context Engineering (Source-of-Truth Documents, Token Limits), Human-in-the-Loop Approval Gates, LLM Evals (Promptfoo, Golden Sets, Evals in CI), Red-Teaming, Guardrails, Prompt-Injection Defence, Model Routing (Claude Haiku, Sonnet, Opus), Model Selection, Token and Cost Budgeting, LLM Tracing and Observability, Structured-Output Validation (Zod, JSON Schema), Retrieval Design, RAG (prototype), MCP Connectors (configured), Responsible AI, Privacy by Design, ML OCR, Prototyping with AI, AI-Assisted Development, Anthropic API, Vercel AI SDK, Claude in Chrome, LangChain"],
  ["Platform Product Management","Multi-Tenant SaaS, Modular Platform Architecture, Control Plane and Data Plane Design, Workflow Engine (Rules, Multi-Level Approvals), Data Models and Schema Design, Custom Fields and Objects, App Lifecycle Management, Connector Framework, REST APIs, SOAP APIs, Webhooks, API Authentication (API Keys, OAuth), API Design Reviews, Third-Party Integrations, EHR Integrations, HL7 and FHIR (evaluated), Batch Data Sync and Reconciliation, Background Jobs (Celery), Notifications and Messaging (Email, SMS, WhatsApp, Voice), Data Migration and Validation, Design Systems, Developer Documentation, Open-Source Developer Community"],
  ["Product Management","Product Vision and Strategy, Product Lifecycle (Discovery to Launch to Iteration), 0-to-1 Product Development, PRDs and Specs, Roadmap Planning, Prioritization (RICE), Epics, User Stories, Acceptance Criteria, Backlog Management, Trade-off Decisions, Success Metrics, Customer Discovery and Interviews, User Shadowing, Personas and Journey Maps, Competitive Analysis, Market Sizing, Market Segmentation, Market Requirements Document (MRD), Pricing Strategy (Usage-Based Pricing), Go-to-Market, Product Positioning, Launch Planning, Pilot and Beta Programs, Staged Releases"],
  ["Identity, Security and Compliance","IAM, RBAC, ABAC, SAML SSO (Azure AD), OIDC, MFA and OTP Login, Session and Password Policies, IP Allowlisting, User Provisioning, Audit Trails, Penetration Testing, GDPR, HIPAA, SOC2, Validated Systems (IQ, OQ, PQ), Vendor Compliance Reviews, Data Residency"],
  ["Release, Reliability and Delivery","Path to Production, Release Gates, Shadow Mode, UAT, Release Notes, App Store Releases, SLAs, 99.5% Uptime, Error Monitoring (Sentry), Incident Post-Mortems, Bug Triage, QA Process, Agile (Scrum, Kanban), Story-Point Sizing, Program and Project Management, Risk and Dependency Management, Change Management, Scope Control, Resource Planning, Project Financials, Project Documents (Charter, BRD, SRS, FRS, Release Document)"],
  ["Leadership and Commercial","People Management, Hiring, Mentoring and Coaching, Performance Reviews, AI Enablement, Stakeholder Management, Executive Communication, Steering Committees, Client Engagement, Escalation Management, Presales, RFPs, Solutioning and Estimation, Contracts, Distributed and Global Teams"],
  ["Tools and Tech","Claude, Claude Code, ChatGPT, Cursor, GitHub Copilot, v0, Next.js, React, TypeScript, Astro, Tailwind CSS, Python, JavaScript, SQL (Postgres, MySQL), Django, Vue.js, Supabase, Upstash Redis, Cloudflare, Vercel, GitHub Actions, Vitest, Playwright, Jira (admin, automations), Confluence, Rocketlane, Slack, Postman, Sentry, Power BI, Figma, Draw.io, Tango, MS Excel, Trello, Asana, Notion, Zoho CRM, Zoho Projects, ERPNext and Frappe, Google Analytics, Google Search Console, Local SEO (JSON-LD), Google Ads, Meta Ads, Docker (basic), AWS, GCP and Oracle Cloud (familiar)"],
];
