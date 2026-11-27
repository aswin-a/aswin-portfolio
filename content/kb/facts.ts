import { cvGeneral, cvHeader, cvItems, cvSkills, cvStats } from "@/content/cv";
import { resumeSummary } from "@/content/resume";
import { cvItem, orgShort } from "@/lib/cv";
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
/** One Zelthy line as a fact: its text, its locator, and the area's label ("CV · Zelthy · {area name}"). */
const line = (id: string, area: string, starts: string): Fact => {
  const gi = zelthy.groups?.findIndex((g) => g.id === area) ?? -1;
  const g = zelthy.groups?.[gi];
  const item = g?.items.findIndex((x) => x.startsWith(starts)) ?? -1;
  if (!g || item < 0) throw new Error(`content/cv.ts: no Zelthy line "${starts}…" in area ${area}`);
  const at = { roleId: zelthy.id, group: gi, item };
  return { id, text: g.items[item], label: `CV · ${orgShort(zelthy)} · ${g.name}`, href: "/about", lines: [{ at, text: g.items[item] }], cv: [at] };
};
const sideProjects = cvItems.filter((it) => it.lane === "project");
const edu = cvItem("edu");

export const facts: Fact[] = [
  { id: "fact-title", text: `${cvHeader.name}: ${cvHeader.role}.`, ...career },
  { id: "fact-focus", text: cvHeader.summary, ...career },
  // The master resume's Summary (content/resume.ts): the CV page shows the shorter design summary above.
  { id: "fact-resume-summary", text: resumeSummary, ...career },
  { id: "fact-years", text: `${cvStats[0][0]} ${cvStats[0][1]}.`, ...career },
  { id: "fact-stats", text: cvStats.map(([big, small]) => `${big} ${small}.`).join(" "), ...career },
  {
    id: "fact-ai-work",
    text: `Projects: ${sideProjects.map((it) => `${it.title} (${it.org}, ${it.dates}). ${it.scope}`).join(" ")}`,
    label: "Case studies",
    href: "/work",
  },
  line("fact-llm-experience", "ai-ml", "Prototyped LLM features"),
  line("fact-platform-win", "delivery", "Delivered 17 software packages"),
  {
    id: "fact-career-total",
    text: cvItems
      .filter((it) => it.lane === "work")
      .map((it) => `${it.title}, ${it.org} (${it.dates}).`)
      .join(" "),
    ...career,
  },
  { id: "fact-ladder", text: `${zelthy.ladder}.`, label: `CV · ${orgShort(zelthy)}`, href: "/about", cv: [{ roleId: zelthy.id }] },
  { id: "fact-education", text: `${edu.title}, ${edu.org} (${edu.dates}).`, label: `CV · ${orgShort(edu)}`, href: "/about", cv: [{ roleId: edu.id }] },
  { id: "fact-location", text: `Location: ${cvHeader.location}.`, ...career },
  line("fact-leadership", "leadership", "Led and mentored"),
  ...cvSkills.map(([name, list], i) => ({ id: `fact-skills-${i + 1}`, text: `Skills · ${name}: ${list}.`, ...career })),
];
