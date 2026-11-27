import { cvItems, type CvItem } from "@/content/cv";
import { orgName } from "@/lib/cv";
import type { CvLocator } from "@/lib/cv-link";

/** A CV line the model can cite by number, with where it sits on the CV (SPEC §6.1). */
export type KbLine = { at: CvLocator; text: string };

export type Role = {
  id: string;
  title: string;
  company: string;
  years: string;
  summary: string;
  /** The ladder line, word for word (not addressable on the CV, so not a numbered line). */
  details: string[];
  /** The role's highlights, word for word, each with its CV locator. */
  lines: KbLine[];
  /** Where the role sits on the CV. */
  cv: CvLocator[];
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
  details: it.ladder ? [it.ladder] : [],
  lines: it.groups ? [] : it.highlights.map((text, item) => ({ at: { roleId: it.id, item }, text })),
  cv: [{ roleId: it.id }],
  // "CV · {org}" (design update 14: "CV · Dhee's", "CV · The Solar Labs", "CV · Zelthy"; Aswin, 2026-11-27).
  label: `CV · ${orgName(it)}`,
  href: "/about",
  tags: ROLE_IDS[it.id]?.tags,
});

export const roles: Role[] = cvItems.filter((it) => it.lane === "work" || it.lane === "edu").map(toRole);
