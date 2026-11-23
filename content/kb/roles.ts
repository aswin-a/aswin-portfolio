import { cvItems, type CvItem } from "@/content/cv";
import { topicFor } from "@/lib/cv";

export type Role = {
  id: string;
  title: string;
  company: string;
  years: string;
  summary: string;
  /** The CV lines behind the role (ladder and highlights), word for word. */
  details: string[];
  label: string;
  href: string;
  /** Search tags for kb.search (SPEC §6), not claims. Taken from how the design maps requirements to this entry. */
  tags?: string[];
};

/**
 * Roles the fit check and Ask my work may cite, generated from content/cv.ts (design update 6):
 * every CV item in the `work` and `edu` lanes. Zelthy's area groups are KB projects (projects.ts).
 * Ids are stable: the fit check's fixtures and the career sources cite them.
 */
const ROLE_IDS: Record<string, { id: string; tags?: string[] }> = {
  // Hero.dc.html cites this role for public APIs, partner integrations and leading cross-functional teams.
  zelthy: { id: "platform-api", tags: ["platform", "public api", "partner integrations", "cross-functional", "product teams", "engineering"] },
  dhees: { id: "dhees", tags: ["founder", "0-to-1", "d2c", "direct to consumer", "pricing", "erp", "operations", "marketing", "seo", "market sizing"] },
  solar: { id: "solar-labs", tags: ["founder", "co-founder", "0-to-1", "startup", "saas", "b2b", "developer", "engineering", "user research", "onboarding"] },
  edu: { id: "iit-mandi", tags: ["education", "degree", "computer science", "engineering"] },
};

const toRole = (it: CvItem): Role => ({
  id: ROLE_IDS[it.id]?.id ?? it.id,
  title: it.title,
  company: it.org,
  years: it.dates,
  summary: it.scope,
  details: [...(it.ladder ? [it.ladder] : []), ...it.highlights],
  // "CV · {title} · {company}", like the CV page's Ask topic answers (Aswin, 2026-11-23).
  label: `CV · ${topicFor(it).label}`,
  href: "/about",
  tags: ROLE_IDS[it.id]?.tags,
});

export const roles: Role[] = cvItems.filter((it) => it.lane === "work" || it.lane === "edu").map(toRole);
