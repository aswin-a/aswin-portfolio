/**
 * Master-resume text the CV page doesn't show, word for word from Aswin's master resume
 * (public/aswin-a-cv.pdf, 27 Nov 2026). The knowledge base reads it; the CV page, "Copy as plain
 * text" and /about.md don't (they follow design/About.dc.html via content/cv.ts). Aswin, 2026-11-27:
 * the AI should know the full resume, while the CV page stays as designed.
 *
 * Only text that isn't already in content/cv.ts: the summary paragraph, and the full bullets of the
 * roles whose CV cards show short highlights. Keyed by the content/cv.ts item id. Don't paraphrase;
 * update this when the master resume changes.
 */

export const resumeUpdated = "2026-11-27";

/** The resume's Summary section. */
export const resumeSummary =
  "Senior Product Manager with 9 years across product and technology: 4 years in product management at Zelthy, rising from Associate Product Manager to Senior Product Manager on a multi-tenant B2B SaaS low-code platform (100+ tenants, 25,000 users, 1M API calls/day at peak), and about 5 years as a founder owning product across two startups. Owned core platform capabilities end to end: workflow engine, RBAC and SSO, data models, app lifecycle, connector framework and release gates. In 2026 specified and built agentic and LLM products with Claude Code from my PRDs and specs: a live AI fit-check product, an AI connector-builder prototype, a multi-skill job-search agent and an Instagram content-intelligence agent, using evals in CI, guardrails, prompt-injection defence, model routing, cost controls and human-in-the-loop approval gates. Shipped ML-based OCR with human review to production for a pharma client. Led 5 product managers and delivery teams of 20+ for enterprise healthcare and pharma clients across Southeast Asia and Australia. B.Tech CS, IIT Mandi; former developer.";

/** Full resume bullets for CV items whose card shows short highlights, by content/cv.ts id. */
export const resumeBullets: Record<string, string[]> = {
  dhees: [
    "Owned product lines (5 SKUs, custom pack sizes), recipes, marketing and sales for a recurring-revenue business serving about 20 customers and 20 orders per month.",
    "Estimated the market size for fresh dog food in Chennai and wrote a market requirements document: segmented the market, selected the target segment and defined product positioning.",
    "Ran customer interviews and feedback loops to guide product-line, recipe and pricing decisions; calculated margin per pack and iterated pricing twice using margin, competitor pricing and customer input.",
    "Implemented ERPNext and extended its data model with custom DocTypes for pets, owners and pack sizes (one pet parent to many pets), linked to sales orders for personalized made-to-order fulfillment.",
    "Customized ERPNext with client and server scripts (Python, JavaScript) and configured manufacturing to generate production plans automatically from sales orders, removing about 1 hour of manual planning a day.",
    "Built custom print formats for pack labels and outer cartons and integrated a label and barcode printer with ERPNext on Linux with no vendor driver, by identifying its command language and a compatible driver.",
    "Ran purchasing and inventory in ERPNext (suppliers, material requests, purchase orders, receipts, invoices, stock); selected and managed ingredient and packaging suppliers; automated delivery scheduling, routing and partner assignment; configured invoicing linked to sales orders.",
    "Ran Google Search and Meta ads (INR 15,000 over one month) and tracked CTR; defined customer profiles of pet parents (area, gender, income) to target campaigns and tracked leads; narrowing targeting by locality and gender improved lead quality and conversion; listed the catalog on Google and WhatsApp.",
  ],
  // The resume lists these two under Dhee's; the CV page shows the website as its own card.
  web: [
    "Built the company website (dhees.com) with Cursor and v0 as a single landing page on Astro 6 and Tailwind CSS 4 (hero, products, testimonials, service areas and contact), using Cursor to read and update the code, and deployed it to Cloudflare Pages with Wrangler (github.com/aswin-a/dpc-website); optimized for local SEO to reach the first page of search results for fresh dog food in Chennai, tracked with Google Analytics and Search Console.",
    "Centralized business details, SEO defaults and Chennai service-area neighbourhoods in one data file that feeds both the page and JSON-LD structured data, so local SEO markup stays in sync; added sitemap generation and meta and Open Graph tags; chose WhatsApp as the order and enquiry channel, with a contact form that opens a pre-filled WhatsApp message, and made Google Analytics 4 opt-in at build time.",
  ],
  solar: [
    "Co-founded the company and led product and technical development from inception, owning roadmap, prioritization and requirements as product owner under Scrum, and estimated the market size; generated INR 50L+ in revenue.",
    "Built 3D modelling software that used satellite imagery to model roofs, place and optimize solar panels and estimate generation, with breakeven analysis in customer proposals; wrote production frontend and Python backend code for about 3 years; integrated the Google Maps Geocoding API.",
    "Built 50+ ease-of-use features, reducing proposal creation time by 90%.",
    "Ran user research, demos, onboarding and support for 400+ customers who self-onboarded with tutorials and demo videos; shadowed users and added an onboarding flow for core 3D interactions; created user personas and customer journey maps.",
    "Recruited, mentored and led a team of 8 developers, interviewing 100+ candidates; ran daily stand-ups.",
  ],
  edu: ["Project: blood alcohol detection system (breathalyser), a hardware prototype with Arduino and Raspberry Pi."],
};

/** Every resume string, for the KB trace test. */
export const resumeStrings = (): string[] => [resumeSummary, ...Object.values(resumeBullets).flat()];
