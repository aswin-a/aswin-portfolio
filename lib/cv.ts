import { cvGeneral, cvHeader, cvItems, cvSkills, cvStats, type CvItem, type CvTopic } from "@/content/cv";

/** Helpers over content/cv.ts, the one source for the CV page, its plain-text and markdown copies, and the KB. */

export function cvItem(id: string): CvItem {
  const it = cvItems.find((x) => x.id === id);
  if (!it) throw new Error(`No CV item: ${id}`);
  return it;
}

/** "Zelthy · Bangalore (remote)" → "Zelthy" (About.dc.html `it.org.split(' · ')[0]`). */
export const orgName = (it: CvItem) => it.org.split(" · ")[0];

/** The Ask topic for "Ask about this role →": "{title} · {company}" plus the item's questions. */
export function topicFor(it: CvItem): CvTopic {
  return { label: `${it.title} · ${orgName(it)}`, qa: it.qa ?? [] };
}
export { cvGeneral };

/** "Copy as plain text": `cvPlainText()` in About.dc.html, line for line. */
export function cvPlainText(): string {
  const out = [cvHeader.name, cvHeader.role, `${cvHeader.location} · ${cvHeader.linkedin.plain}`, "", "EXPERIENCE"];
  for (const it of cvItems) {
    out.push("", `${it.title} — ${it.org} (${it.dates})`);
    if (it.scope) out.push(it.scope);
    if (it.groups) for (const g of it.groups) for (const x of g.items) out.push(`- ${x}`);
    else for (const x of it.highlights) out.push(`- ${x}`);
  }
  out.push("", "SKILLS");
  for (const [name, list] of cvSkills) out.push(`${name}: ${list}`);
  return out.join("\n");
}

/** /about.md, the markdown twin of the CV page for GEO (SPEC §4), from the same content. */
export function cvMarkdown(): string {
  const out = [
    `# ${cvHeader.name}`,
    "",
    cvHeader.role,
    "",
    `${cvHeader.location} · [${cvHeader.linkedin.label}](${cvHeader.linkedin.href})`,
    "",
    cvHeader.summary,
    "",
    ...cvStats.map(([big, small]) => `- **${big}** ${small}`),
    "",
    "## Experience",
  ];
  for (const it of cvItems) {
    out.push("", `### ${it.title}`, "", `${it.org} · ${it.dates}${it.lane === "project" ? " · Side project" : ""}`);
    if (it.ladder) out.push("", it.ladder);
    if (it.scope) out.push("", it.scope);
    if (it.highlights.length) out.push("", ...it.highlights.map((h) => `- ${h}`));
    for (const g of it.groups ?? []) out.push("", `#### ${g.name}`, "", g.summary, "", ...g.items.map((x) => `- ${x}`));
  }
  out.push("", "## Skills", "", ...cvSkills.map(([name, list]) => `- **${name}:** ${list}`), "");
  return out.join("\n");
}

/** Every piece of CV text, for the "every KB entry traces back to a CV line" test. */
export function cvStrings(): string[] {
  const s: string[] = [cvHeader.name, cvHeader.role, cvHeader.location, cvHeader.summary];
  for (const [a, b] of cvStats) s.push(a, b);
  for (const it of cvItems) {
    s.push(it.dates, it.title, it.org, it.scope, ...it.highlights);
    if (it.ladder) s.push(it.ladder);
    for (const g of it.groups ?? []) s.push(g.name, g.summary, ...g.items);
  }
  for (const [a, b] of cvSkills) s.push(a, b);
  return s.filter(Boolean);
}
