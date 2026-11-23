import { todo } from "@/lib/content";

/**
 * The CV, word for word from the CV_STATS, CV_GENERAL, CV_ITEMS and CV_SKILLS arrays in
 * design/About.dc.html (design update 6). This file is the one source: the CV page (/about),
 * "Copy as plain text", /about.md and the knowledge base (content/kb/*) are all generated from it,
 * so the CV page and the AI can never disagree. Don't paraphrase; change the design first.
 *
 * Changes from the prototype: `qa` keeps only the questions (the canned `a` answers are never
 * shown; topic questions go to the live Ask endpoint, SPEC §5), and design file links become routes
 * (Main.dc.html → "/"). `[date]` placeholders and "#" links stay until Aswin fills them.
 */

export type CvLane = "work" | "project" | "edu";
export type CvGroup = { name: string; summary: string; items: string[] };
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

/** The header (About.dc.html markup and cvPlainText()). */
export const cvHeader = {
  eyebrow: "CURRICULUM VITAE",
  name: "Aswin A",
  role: "Senior Product Manager · Platforms, integrations and agentic AI products",
  location: "Chennai, India",
  linkedin: { label: "LinkedIn", href: "https://linkedin.com/in/aswin-a-pm", plain: "linkedin.com/in/aswin-a-pm" },
  summary:
    "I’ve spent nine years across product and technology: four as a product manager at Zelthy, rising from Associate PM to Senior PM, and five as a founder across two startups. I own platforms end to end, from APIs and integrations to identity and workflow engines, and now I build AI agents on the same foundations.",
  downloadPdf: { label: "Download PDF", href: "#" }, // TODO(aswin): static PDF built from this file at build time (SPEC §5)
  synced: { label: "Synced from my master resume", date: todo("[date]") }, // TODO(aswin)
};

export const cvStats: CvStat[] = [
  ["9 years", "across product and technology; 2 startups founded"],
  ["125% growth", "in B2B product revenue over 3 years at Zelthy"],
  ["17 packages", "shipped in 8 months; 95% adoption, 80% faster to deploy"],
  ["1M API calls a day", "at peak, across 100+ tenants and 25,000 users"],
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
    title: "Job-fit AI on this site",
    org: "Side project · live on the home page",
    scope: "Paste a job description and get a cited verdict: what fits, with proof, and what doesn’t. A fixed pipeline over a knowledge base built from this CV.",
    highlights: [],
    link: "Try it on the home page →",
    href: "/",
  },
  {
    id: "jsa",
    lane: "project",
    dates: "Oct 2026",
    title: "AI job-search agent",
    org: "Side project · Claude",
    scope: "An agent workflow that searches and scores LinkedIn jobs, maps my resume to each role and tracks applications, with an approval gate before anything is submitted.",
    highlights: [
      "Orchestrated four agents: fit scoring, ideal resume, tailored resume, and applying after approval",
      "Connected Drive and Chrome through MCP connectors and wrote a custom Claude Skill for job-fit scoring",
      "Used to prepare 20+ applications; fit scores checked against LinkedIn’s match score",
    ],
    link: "View recorded run →",
    href: "#", // TODO(aswin): recorded run link
  },
  {
    id: "ig",
    lane: "project",
    dates: "Sep 2026",
    title: "Instagram content intelligence agent",
    org: "Side project · for Dhee’s",
    scope: "Reads what competing pet-food brands post, finds what performs and what’s trending, and suggests what Dhee’s should post next.",
    highlights: [],
    link: "View recorded run →",
    href: "#", // TODO(aswin): recorded run link
  },
  {
    id: "web",
    lane: "project",
    dates: todo("[date]"), // TODO(aswin)
    title: "Dhee’s website",
    org: "Side project · for Dhee’s · Astro, TypeScript, Cloudflare",
    scope: "Designed and built the company’s single-page site with Cursor and v0: recipes, prices, delivery areas and free-sample requests, with ordering over WhatsApp.",
    highlights: [
      "Built on Astro and TypeScript, set up for Cloudflare Workers; 23 commits on GitHub",
      "Local SEO with geo tags, neighbourhood-level descriptions and social cards; first page of search results for fresh dog food in Chennai",
      "Five recipes with ingredients, calories, macros and per-kg prices; about 22 Chennai areas served",
    ],
    link: "Visit dhees.com ↗",
    href: "https://dhees.com",
    link2: "View the code on GitHub ↗",
    href2: "https://github.com/aswin-dhees/dpc-website",
  },
  {
    id: "dhees",
    lane: "work",
    dates: "Oct 2024 – Sep 2026",
    title: "Founder and Product Lead",
    org: "Dhee’s Pet Company · Chennai",
    scope: "Founded and ran a made-to-order fresh dog food business; built its product, operating systems and go-to-market from zero.",
    highlights: [
      "Owned 5 SKUs, recipes, marketing and sales; about 20 customers and 20 orders a month",
      "Ran customer interviews, worked out margin per pack and changed pricing twice",
      "Sized the Chennai market and wrote the market requirements document",
      "Extended ERPNext with custom records for pets, owners and pack sizes",
      "Generated production plans from sales orders automatically, saving about 1 hour a day",
      "Got a label printer working on Linux with no vendor driver",
      "Ran purchasing, inventory, delivery routing and invoicing in ERPNext",
      "Built the website with Cursor and v0; first page of search results for fresh dog food in Chennai",
      "Ran Google and Meta ads; narrower targeting improved lead quality",
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
    org: "Zelthy · Bangalore (remote)",
    ladder: "Senior PM, Oct 2022 – Sep 2024 · PM, Dec 2020 – Sep 2022 · Associate PM, Sep – Nov 2020",
    scope: "Multi-tenant B2B SaaS low-code platform at a 50-person startup: 100+ tenants, 25,000 users, 1M API calls a day at peak. Healthcare and pharma clients in Singapore, Malaysia, Vietnam, Hong Kong and Australia.",
    highlights: [],
    groups: [
      {
        name: "Core platform and integrations",
        summary: "Owned RBAC/ABAC, SSO, the workflow engine and app lifecycle. 10+ integrations and a connector framework across 50+ tenants.",
        items: [
          "Owned the product lifecycle and defined vision, strategy and roadmap for core platform capabilities: RBAC, authentication, workflow engine, data models, app lifecycle management, audit trails and messaging, designed as independent, customizable packages with pricing for each.",
          "Decomposed platform components into reusable modules and contributed to multi-tenancy design; wrote technical requirements and data models for modules such as the workflow engine; owned app lifecycle management (versioning, promotion from dev to staging to production, and rollback).",
          "Resolved a multi-tenant trade-off (data duplication versus per-app field flexibility) by proposing a shared directory app and persuading the CEO and CTO to build it; it now powers about 15 apps.",
          "Delivered RBAC with attribute-based access control (row and column filters) so tenant admins across 100+ tenants self-manage users, roles and permissions; built an approval-based user provisioning workflow.",
          "Delivered SAML SSO with Azure AD for 10+ enterprise clients; specified OTP login, MFA, password policies, session timeout and single-session login; audit trails logged every login, action and view.",
          "Enabled tenants and app builders to define custom fields, foreign keys and one-to-many child tables, each extending a base model with built-in workflow, RBAC/ABAC, export and API support.",
          "Ran API design reviews with engineers on REST endpoints, webhooks, authentication (API keys, OAuth) and request and response formats; tested APIs hands-on in Postman.",
          "Led integration of 10+ third-party services (Zoom, Twilio, DocuSign, SAP, Power BI, Azure AD) and client EHR systems, including inbound webhooks.",
          "Built a connector framework of reusable connectors enabled and configured from one dashboard, replacing one-off per-app integrations; used across 50+ tenants.",
          "Led a daily two-way batch data sync over client SOAP APIs handling millions of rows, with reconciliation and alerts for failed transfers.",
          "Evaluated HL7 and FHIR for interoperability and chose a FHIR converter per package (design stage).",
          "Migrated client master data (HCPs, hospitals, clinics) from Excel into apps, with cleaning, mapping, de-duplication and validation rules.",
        ],
      },
      {
        name: "Product delivery, roadmap and metrics",
        summary: "17 packages in 8 months with 95% adoption. 80% of roadmap commitments on time. 30+ customer interviews.",
        items: [
          "Delivered 17 software packages in 8 months (CRM, Appointment Scheduling, Messaging, CMS for Patient Education Programs); 95% of new apps adopted them and time to deploy fell 80%.",
          "Updated the product vision and new-features roadmap, contributing to 125% growth in B2B product revenue over 3 years.",
          "Wrote 150+ user stories per quarter with business requirements and acceptance criteria; managed roadmap, backlog and releases in Jira with traceability to test cases.",
          "Prioritized with RICE, client input and adoption, defect and time-to-deploy metrics across 3 teams; delivered 80% of roadmap commitments on time.",
          "Ran 30+ customer interviews, 5+ competitor analyses and 10+ vendor evaluations; discovery drove the move to code-based development (platform v3).",
          "Split a D2C app into two phases to resolve a scope-versus-schedule trade-off; phase 1 launched on time while coordinating with the client’s SAP team.",
          "Largest program: 4 engineers, 2 countries, 2 years, delivered on the committed date; launched a client program in 3 countries and rolled out a template in 5.",
          "Worked with design to deliver 70+ designs on a shared UI component library and design system.",
        ],
      },
      {
        name: "Releases, reliability and compliance",
        summary: "Release gates and staged releases. 99.5% uptime commitment met. GDPR, HIPAA and SOC2.",
        items: [
          "Defined the path to production: release criteria, release gates and staged releases across dev, staging and production with client UAT sign-off.",
          "Defined support SLAs (4-hour first response, 6-hour triage) with a 99.5% uptime commitment, measured and met; monitored API errors in Sentry and wrote incident post-mortems.",
          "Owned bug triage, integration alerts and incident handling; coordinated Play Store and App Store releases.",
          "Specified security, privacy and regulatory requirements to meet GDPR, HIPAA and SOC2 with 100% compliance; wrote IQ, OQ and PQ validation documents; met data residency by hosting in Singapore and Australia.",
        ],
      },
      {
        name: "Data, ML and AI",
        summary: "ML OCR in production at 95% accuracy with human review. LLM prototypes. 10+ Power BI dashboards.",
        items: [
          "Wrote requirements for ML-based OCR of patient prescriptions and bills, shipped to production: vendors evaluated on about 100 labelled documents; results under 90% confidence go to human review (about 10%); accuracy held at 95%, saving about 5 minutes per document.",
          "Ideated and launched platform v3, moving to code-based development built for AI coding, cutting internal development time from 2 months to as little as 2 weeks.",
          "Prototyped LLM features (not shipped): GPT-generated app configurations as JSON (about 70% worked without fixes), a chat-to-app proof of concept with LangChain, and a RAG assistant over product documentation.",
          "Built batch pipelines into a data lake and delivered 10+ Power BI dashboards over millions of records.",
          "Advised against sending patient data to LLMs because of security and privacy risks.",
        ],
      },
      {
        name: "Commercial and go-to-market",
        summary: "Moved pricing to usage-based. 2 RFP wins of about USD 100K each. Templates beta added USD 200K+ in revenue.",
        items: [
          "Initiated the shift from seat-based to usage-based pricing and persuaded sales leadership to adopt it; used in 2 key enterprise deals and multiple RFPs.",
          "Supported CEO-led sales with presales, pricing and RFP preparation; contributed to 2 enterprise RFP wins averaging about USD 100K.",
          "Piloted configurable app templates as a beta with about 20 client business users; 6 apps deployed, saving clients USD 150K+ and adding USD 200K+ in revenue.",
          "Managed 20+ enterprise solution projects valued at USD 500K+ across India and Southeast Asia.",
          "Built an open-source developer community on Discord (50+ members) after the platform core was open-sourced as Zango; authored product documentation that saved 500 hours of developer time.",
        ],
      },
      {
        name: "Client engagement and delivery",
        summary: "8+ enterprise clients, up to VP level. Teams of 20+. Scope creep down 80%+.",
        items: [
          "Engagement manager for 8+ global enterprise clients, working with executives up to VP level; ran up to 5 client projects in parallel.",
          "Established Agile Scrum delivery in Jira, reducing scope creep by 80%+, cutting turnaround time by 30% and increasing development efficiency by 40%.",
          "Headed project teams of 20+ and tracked project financials; 80% of projects completed on time and within budget.",
          "Delivered native Android and iOS apps for 100+ field staff and 1,000+ SMS notifications a day; most apps were multi-language.",
          "Recovered an unhappy client engagement by working through the issues on site in Thailand.",
        ],
      },
      {
        name: "Team leadership",
        summary: "Led 5 PMs and 2 interns. Hired 3, drove 4 promotions. Utilization up 20%.",
        items: [
          "Led and mentored 5 product managers and 2 interns; hired 3 of the PMs and drove 4 promotions; coached the PMs to use ChatGPT for PRDs and documentation.",
          "Ran the PM operating rhythm (weekly product reviews, PRD reviews, quarterly roadmap reviews) and quarterly resource planning, improving utilization by 20%.",
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
      "Built 3D solar design software from satellite imagery; wrote frontend and Python backend code",
      "Shipped 50+ ease-of-use features, cutting proposal creation time by 90%",
      "Onboarded and supported 400+ customers",
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
  ["Product management", "Vision and strategy, discovery to launch, 0-to-1, platform PM, roadmaps, RICE, PRDs, success metrics, customer interviews, market sizing, usage-based pricing, go-to-market, staged releases"],
  ["Platform, APIs and integrations", "Multi-tenant SaaS, REST and SOAP APIs, webhooks, API keys and OAuth, connector frameworks, batch sync and reconciliation, workflow engines, data models, app lifecycle, data migration, EHR integrations, HL7 and FHIR"],
  ["Identity, security and compliance", "IAM, RBAC, ABAC, SAML SSO (Azure AD), MFA, audit trails, GDPR, HIPAA, SOC2, IQ/OQ/PQ validation, data residency"],
  ["Release and reliability", "Release gates, UAT, SLAs, 99.5% uptime, Sentry, incident post-mortems, Scrum and Kanban, risk and dependency management, project financials"],
  ["Data and AI", "ML OCR, human-in-the-loop review, LLMs, LangChain, RAG (prototype), AI agents, prompt and output schema design, model evaluation, responsible AI, data lakes, Power BI, SQL"],
  ["Leadership", "Hiring, mentoring, performance reviews, stakeholder management, steering committees, presales and RFPs, distributed teams"],
  ["Tools", "Jira, Confluence, Postman, Figma, Claude, Claude Code, Cursor, v0, ChatGPT, Python, JavaScript, SQL, Django, Vue.js, React, ERPNext"],
];

