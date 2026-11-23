import { cvGeneral, cvHeader, cvItems, cvSkills, cvStats } from "@/content/cv";
import { cvItem } from "@/lib/cv";

export type Fact = { id: string; text: string; label: string; href: string };

/**
 * Canonical bio facts used in Ask answers (SPEC §6), generated from content/cv.ts (design update 6):
 * the CV header, stats, skills and a few lines Ask cites often. Ids are stable (lib/ai/fake.ts cites them).
 * Labels are the source chips Ask my work shows: "CV · My experience" (the CV page's general Ask topic,
 * Aswin 2026-11-23) and "Case studies".
 */
const career = { label: `CV · ${cvGeneral.label}`, href: "/about" };
const zelthy = cvItem("zelthy");
const line = (group: string, starts: string) => {
  const hit = zelthy.groups?.find((g) => g.name === group)?.items.find((x) => x.startsWith(starts));
  if (!hit) throw new Error(`content/cv.ts: no Zelthy line "${starts}…" in ${group}`);
  return hit;
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
  { id: "fact-llm-experience", text: line("Data, ML and AI", "Prototyped LLM features"), ...career },
  { id: "fact-platform-win", text: line("Product delivery, roadmap and metrics", "Delivered 17 software packages"), ...career },
  {
    id: "fact-career-total",
    text: cvItems
      .filter((it) => it.lane === "work")
      .map((it) => `${it.title}, ${it.org} (${it.dates}).`)
      .join(" "),
    ...career,
  },
  { id: "fact-ladder", text: `${zelthy.ladder}.`, ...career },
  { id: "fact-education", text: `${edu.title}, ${edu.org} (${edu.dates}).`, ...career },
  { id: "fact-location", text: `Location: ${cvHeader.location}.`, ...career },
  { id: "fact-leadership", text: line("Team leadership", "Led and mentored"), ...career },
  ...cvSkills.map(([name, list], i) => ({ id: `fact-skills-${i + 1}`, text: `Skills · ${name}: ${list}.`, ...career })),
];
