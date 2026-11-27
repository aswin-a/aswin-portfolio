import type { CvItem } from "@/content/cv";
import { products } from "@/content/products";
import { resumeBullets } from "@/content/resume";
import { cvItem, orgShort } from "@/lib/cv";
import type { CvLocator } from "@/lib/cv-link";
import type { KbLine } from "./roles";

export type Project = {
  id: string;
  title: string;
  status: string;
  summary: string;
  /** A project's "Everything I did" points, word for word from the CV. The model reads them; it cites the numbered `lines`. */
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
 * Projects the fit check and Ask my work may cite, generated from content/cv.ts (design update 15):
 * the CV's projects, each of Zelthy's areas, and a healthcare cross-cut of Zelthy's lines. Every
 * entry is on the CV. Ids are stable: case-study links, fixtures and tests cite them.
 */

const statusOf = (slug: string) => products.find((p) => p.slug === slug)?.status;
const siteProduct = products.find((p) => p.slug === "fit-check");

/** The CV's projects: [CV id, KB id, case-study slug, source label, tags]. */
const SIDE: [string, string, string | null, string | null, string[]][] = [
  ["site", "fit-check", "fit-check", `Case study · ${siteProduct?.name ?? "Job-fit AI on this site"}`, ["ai", "fit check", "guardrails", "citations", "evals", "knowledge base"]],
  ["builder", "integration-builder", "integration-builder", "Case study · Integration builder", ["ai agent", "guardrails", "safeguards", "integrations", "connectors", "api", "prompt injection", "evals", "model routing"]],
  ["jsa", "job-search-agent", "job-search-agent", "Case study · Job-search agent", ["ai agent", "human-in-the-loop", "approval", "workflows", "mcp", "design"]], // "design": the hero sample maps "Design human-in-the-loop workflows" here; without it the integration-builder evidence ties and wins the id tie-break
  ["ig", "dhees-instagram-agent", "instagram-agent", "Case study · Dhee's agent", ["ai agent", "business stakeholders", "adoption"]],
  ["web", "dhees-website", null, null, ["website", "seo", "frontend", "astro", "typescript", "cloudflare"]],
];

const side = (it: CvItem, id: string, slug: string | null, label: string | null, tags: string[]): Project => ({
  id,
  title: it.title,
  status: (slug && statusOf(slug)) || it.dates,
  summary: `${it.org}. ${it.scope}`,
  // The CV's "Everything I did" list, or the master resume's bullets when the CV card has none (content/resume.ts).
  evidence: it.full ?? resumeBullets[it.id] ?? [],
  lines: it.highlights.map((text, item) => ({ at: { roleId: it.id, item }, text })),
  cv: [{ roleId: it.id }],
  label: label ?? `CV · ${it.title}`,
  href: slug ? `/work/${slug}` : "/about",
  tags,
});

/** Zelthy's areas by their stable id (content/cv.ts): [KB id, tags]. KB ids stay put when areas are reordered. */
const ZELTHY_GROUPS: Record<string, [string, string[]]> = {
  core: ["zelthy-core-platform", ["platform", "multi-tenant", "saas", "b2b", "low-code", "workflow", "approvals", "data models", "schema", "custom objects", "custom fields", "app lifecycle", "versioning", "audit trails", "messaging", "packages"]],
  integrations: ["zelthy-integrations", ["iam", "identity", "rbac", "abac", "sso", "saml", "oidc", "mfa", "authentication", "api", "rest", "webhooks", "integrations", "connectors", "oauth", "soap", "data sync", "reconciliation", "ehr", "fhir", "hl7", "public api", "partner integrations", "data migration"]],
  "ai-ml": ["zelthy-ai-ml", ["ai", "ml", "ocr", "human", "human-in-the-loop", "llm", "evals", "prompts", "json schema", "rag", "langchain", "ai coding", "data", "data lake", "analytics", "dashboards", "power bi"]],
  delivery: ["zelthy-delivery", ["roadmap", "prioritization", "rice", "delivery", "metrics", "adoption", "discovery", "customer research", "user stories", "launch", "mobile", "design system", "revenue"]],
  releases: ["zelthy-releases", ["releases", "release gates", "staged releases", "uat", "qa", "sla", "reliability", "uptime", "incidents", "compliance", "security", "privacy", "hipaa", "gdpr", "soc2", "penetration testing"]],
  commercial: ["zelthy-commercial", ["pricing", "usage-based", "go-to-market", "gtm", "sales", "presales", "rfp", "beta", "pilot", "positioning", "launch", "open source", "developer", "documentation", "community", "revenue"]],
  leadership: ["zelthy-leadership", ["leadership", "people management", "hiring", "mentoring", "coaching", "performance reviews", "operating rhythm", "cross-functional", "product teams", "engineering", "distributed teams", "resource planning"]],
  "client-ops": ["zelthy-clients", ["client", "enterprise", "executive", "stakeholder", "escalations", "project management", "agile", "scrum", "delivery", "steering"]],
};

const zelthy = cvItem("zelthy");
/** Source chips for Zelthy's lines: "CV · Zelthy · {area name as on the CV}" (design update 14; Aswin, 2026-11-27). */
const zelthyLabel = (area: string) => `CV · ${orgShort(zelthy)} · ${area}`;
const zelthyGroups = zelthy.groups ?? [];
for (const g of zelthyGroups) if (!ZELTHY_GROUPS[g.id]) throw new Error(`content/cv.ts: Zelthy area ${g.id} has no KB entry; add it to ZELTHY_GROUPS`);

const zelthyProjects: Project[] = zelthyGroups.map((g, i) => ({
  id: ZELTHY_GROUPS[g.id][0],
  title: `${orgShort(zelthy)}: ${g.name}`,
  status: zelthy.dates,
  summary: g.summary,
  evidence: [],
  lines: g.items.map((text, item) => ({ at: { roleId: zelthy.id, group: i, item }, text })),
  cv: [{ roleId: zelthy.id, group: i }],
  label: zelthyLabel(g.name),
  href: "/about",
  tags: ZELTHY_GROUPS[g.id][1],
}));

/** Healthcare lines across Zelthy's groups (the Ask answer on healthcare cites this entry). */
const HEALTHCARE = /healthcare|EHR|HL7|FHIR|HCPs|HIPAA|patient|prescriptions/i;
const healthcareLines: KbLine[] = zelthyGroups.flatMap((g, group) =>
  g.items.flatMap((text, item) => (HEALTHCARE.test(text) ? [{ at: { roleId: zelthy.id, group, item }, text }] : [])),
);
const healthcare: Project = {
  id: "healthcare-integrations",
  // "Healthcare and pharma clients in Singapore, …", the last sentence of Zelthy's scope.
  title: `${orgShort(zelthy)}: ${zelthy.scope.split(/(?<=\.) /).at(-1)}`,
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
  ...SIDE.map(([cvId, id, slug, label, tags]) => side(cvItem(cvId), id, slug, label, tags)),
  ...zelthyProjects,
  healthcare,
];

