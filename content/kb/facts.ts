import { cvGeneral, cvHeader, cvItems, cvSkills, cvStats } from "@/content/cv";
import { cvItem, orgName } from "@/lib/cv";
import type { CvLocator } from "@/lib/cv-link";
import type { KbLine } from "./roles";

/** `lines` and `cv` are set when the fact is one CV line or one CV item (SPEC §6.1); header, stats and skills facts have none. */
export type Fact = { id: string; text: string; label: string; href: string; lines?: KbLine[]; cv?: CvLocator[] };

/**
 * Canonical bio facts used in Ask answers (SPEC §6), generated from content/cv.ts (design update 6):
 * the CV header, stats, skills and a few lines Ask cites often. Ids are stable (lib/ai/fake.ts cites them).
 * Labels are the source chips Ask my work shows: "CV · My experience" (the CV page's general Ask topic,
 * Aswin 2026-11-23) and "Case studies".
 */
const career = { label: `CV · ${cvGeneral.label}`, href: "/about" };
const zelthy = cvItem("zelthy");
/** One Zelthy line as a fact: its text, its locator, and the area's label ("CV · Zelthy · {area}"). */
const line = (id: string, group: string, starts: string): Fact => {
  const gi = zelthy.groups?.findIndex((g) => g.name === group) ?? -1;
  const items = zelthy.groups?.[gi]?.items ?? [];
  const item = items.findIndex((x) => x.startsWith(starts));
  if (item < 0) throw new Error(`content/cv.ts: no Zelthy line "${starts}…" in ${group}`);
  const at = { roleId: zelthy.id, group: gi, item };
  return { id, text: items[item], label: `CV · ${orgName(zelthy)} · ${group}`, href: "/about", lines: [{ at, text: items[item] }], cv: [at] };
};
const sideProjects = cvItems.filter((it) => it.lane === "project");
const edu = cvItem("edu");

export const facts: Fact[] = [
  { id: "fact-title", text: `${cvHeader.name}: ${cvHeader.role}.`, ...career },
  { id: "fact-focus", text: cvHeader.summary, ...career },
  { id: "fact-years", text: `${cvStats[0][0]} ${cvStats[0][1]}.`, ...career },
  { id: "fact-stats", text: cvStats.map(([big, small]) => `${big} ${small}.`).join(" "), ...career },
  {
    id: "fact-ai-work",
    text: `Projects: ${sideProjects.map((it) => `${it.title} (${it.org}, ${it.dates}). ${it.scope}`).join(" ")}`,
    label: "Case studies",
    href: "/work",
  },
  line("fact-llm-experience", "Data, ML and AI", "Prototyped LLM features"),
  line("fact-platform-win", "Product delivery, roadmap and metrics", "Delivered 17 software packages"),
  {
    id: "fact-career-total",
    text: cvItems
      .filter((it) => it.lane === "work")
      .map((it) => `${it.title}, ${it.org} (${it.dates}).`)
      .join(" "),
    ...career,
  },
  { id: "fact-ladder", text: `${zelthy.ladder}.`, label: `CV · ${orgName(zelthy)}`, href: "/about", cv: [{ roleId: zelthy.id }] },
  { id: "fact-education", text: `${edu.title}, ${edu.org} (${edu.dates}).`, label: `CV · ${orgName(edu)}`, href: "/about", cv: [{ roleId: edu.id }] },
  { id: "fact-location", text: `Location: ${cvHeader.location}.`, ...career },
  line("fact-leadership", "Team leadership", "Led and mentored"),
  ...cvSkills.map(([name, list], i) => ({ id: `fact-skills-${i + 1}`, text: `Skills · ${name}: ${list}.`, ...career })),
];
