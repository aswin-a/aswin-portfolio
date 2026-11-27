import type { CvItem } from "@/content/cv";
import { products } from "@/content/products";
import { cvItem, orgName } from "@/lib/cv";
import type { CvLocator } from "@/lib/cv-link";
import type { KbLine } from "./roles";

export type Project = {
  id: string;
  title: string;
  status: string;
  summary: string;
  /** Proof that is not on the CV (the integration-builder concept only), word for word. */
  evidence: string[];
  /** Proof the fit check may cite by number: CV lines, word for word, each with its CV locator. */
  lines: KbLine[];
  /** Where the entry sits on the CV; empty when it isn't on the CV (SPEC §6.1). */
  cv: CvLocator[];
  label: string;
  href: string;
  /** Search tags for kb.search (SPEC §6), not claims. Taken from how the design maps requirements to this entry. */
  tags?: string[];
};

/**
 * Projects the fit check and Ask my work may cite, generated from content/cv.ts (design update 6):
 * the CV's side projects, each of Zelthy's area groups, and a healthcare cross-cut of Zelthy's lines.
 * Ids are stable: case-study links, fixtures and tests cite them.
 *
 * The one entry not on the CV is `integration-builder` (the AI integration builder concept, product 03 on
 * home); it comes from content/products.ts and stays hidden in production until its evidence is filled.
 */

const statusOf = (slug: string) => products.find((p) => p.slug === slug)?.status;
const integrationBuilder = products.find((p) => p.slug === "integration-builder");
const siteProduct = products.find((p) => p.slug === "fit-check");

/** Side projects with a case study: [CV id, KB id, case-study slug, source label, tags]. */
const SIDE: [string, string, string | null, string | null, string[]][] = [
  ["site", "fit-check", "fit-check", `Case study · ${siteProduct?.name ?? "Job-fit AI on this site"}`, ["ai", "fit check", "guardrails", "citations", "evals", "knowledge base"]],
  ["jsa", "job-search-agent", "job-search-agent", "Case study · Job-search agent", ["ai agent", "human-in-the-loop", "approval", "workflows", "mcp", "design"]], // "design": the hero sample maps "Design human-in-the-loop workflows" here; without it the integration-builder evidence ties and wins the id tie-break
  ["ig", "dhees-instagram-agent", "instagram-agent", "Case study · Dhee's agent", ["ai agent", "business stakeholders", "adoption"]],
  ["web", "dhees-website", null, null, ["website", "seo", "frontend", "astro", "typescript", "cloudflare"]],
];

const side = (it: CvItem, id: string, slug: string | null, label: string | null, tags: string[]): Project => ({
  id,
  title: it.title,
  status: (slug && statusOf(slug)) || it.dates,
  summary: `${it.org}. ${it.scope}`,
  evidence: [],
  lines: it.highlights.map((text, item) => ({ at: { roleId: it.id, item }, text })),
  cv: [{ roleId: it.id }],
  label: label ?? `CV · ${it.title}`,
  href: slug ? `/work/${slug}` : "/about",
  tags,
});

/** Zelthy's area groups, in CV order: [KB id, tags]. */
const ZELTHY_GROUPS: [string, string[]][] = [
  ["zelthy-core-platform", ["platform", "multi-tenant", "saas", "b2b", "low-code", "iam", "rbac", "abac", "sso", "authentication", "workflow", "data models", "custom objects", "api", "rest", "webhooks", "integrations", "connectors", "oauth", "soap", "data sync", "ehr", "fhir", "hl7", "public api", "partner integrations"]],
  ["zelthy-delivery", ["roadmap", "prioritization", "delivery", "metrics", "adoption", "discovery", "customer research", "launch"]],
  ["zelthy-releases", ["releases", "release gates", "sla", "reliability", "uptime", "compliance", "security", "privacy", "hipaa", "gdpr", "soc2"]],
  ["zelthy-ai-ml", ["ai", "ml", "ocr", "human", "evals", "prompts", "json schema", "rag", "langchain", "data", "analytics", "dashboards"]],
  ["zelthy-commercial", ["pricing", "usage-based", "go-to-market", "gtm", "sales", "presales", "rfp", "beta", "pilot", "open source", "developer", "documentation", "revenue"]],
  ["zelthy-clients", ["client", "enterprise", "executive", "stakeholder", "agile", "scrum", "mobile", "delivery"]],
  ["zelthy-leadership", ["leadership", "people management", "hiring", "mentoring", "cross-functional", "product teams", "engineering", "distributed teams"]],
];

const zelthy = cvItem("zelthy");
/** Source chips for Zelthy's lines: "CV · Zelthy · {area name as on the CV}" (design update 14; Aswin, 2026-11-27). */
const zelthyLabel = (area: string) => `CV · ${orgName(zelthy)} · ${area}`;
const zelthyGroups = zelthy.groups ?? [];
if (zelthyGroups.length !== ZELTHY_GROUPS.length) throw new Error("content/cv.ts: Zelthy's groups changed; update ZELTHY_GROUPS");

const zelthyProjects: Project[] = zelthyGroups.map((g, i) => ({
  id: ZELTHY_GROUPS[i][0],
  title: `${orgName(zelthy)}: ${g.name}`,
  status: zelthy.dates,
  summary: g.summary,
  evidence: [],
  lines: g.items.map((text, item) => ({ at: { roleId: zelthy.id, group: i, item }, text })),
  cv: [{ roleId: zelthy.id, group: i }],
  label: zelthyLabel(g.name),
  href: "/about",
  tags: ZELTHY_GROUPS[i][1],
}));

/** Healthcare lines across Zelthy's groups (the Ask answer on healthcare cites this entry). */
const HEALTHCARE = /healthcare|EHR|HL7|FHIR|HCPs|HIPAA|patient|prescriptions/i;
const healthcareLines: KbLine[] = zelthyGroups.flatMap((g, group) =>
  g.items.flatMap((text, item) => (HEALTHCARE.test(text) ? [{ at: { roleId: zelthy.id, group, item }, text }] : [])),
);
const healthcare: Project = {
  id: "healthcare-integrations",
  // "Healthcare and pharma clients in Singapore, …", the last sentence of Zelthy's scope.
  title: `${orgName(zelthy)}: ${zelthy.scope.split(/(?<=\.) /).at(-1)}`,
  status: zelthy.dates,
  summary: zelthy.scope,
  evidence: [],
  lines: healthcareLines,
  cv: healthcareLines.map((l) => l.at),
  // The design's label for this cross-cut (Ask.dc.html, design update 14).
  label: zelthyLabel("healthcare"),
  href: "/about",
  tags: ["healthcare", "hospital", "integrations", "platform reliability", "pharma", "hipaa", "gdpr", "soc2", "compliance", "security", "privacy", "validated systems", "data residency", "data migration", "regulated"],
};


export const projects: Project[] = [
  {
    id: "integration-builder",
    title: "AI integration builder",
    status: integrationBuilder?.status ?? "CONCEPT",
    summary: "Safeguards as the centrepiece.",
    // D26 (Aswin, 2026-11-24)
    evidence: [
      "The goal: AI that generates integration code from an app's API docs (API client, auth, user and usage retrieval, error handling, pagination and logging), plus screens, safeguards and a prototype.",
      "I delivered design notes, a six-step flow with two human gates, a working prototype repo and a Loom walkthrough, and reframed the problem: \"Don't make customers developers. Make them reviewers.\" The AI fills a declarative, read-only connector form that one hardened engine runs, instead of writing code per app.",
    ],
    lines: [],
    cv: [], // Not on the CV: a concept project (content/products.ts)
    label: "Case study · Integration builder",
    href: "/work/integration-builder",
    tags: ["ai agent", "guardrails", "safeguards", "integrations", "evals"],
  },
  ...SIDE.map(([cvId, id, slug, label, tags]) => side(cvItem(cvId), id, slug, label, tags)),
  ...zelthyProjects,
  healthcare,
];

