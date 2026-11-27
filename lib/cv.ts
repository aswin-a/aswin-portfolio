import { cvGeneral, cvHeader, cvItems, cvSkills, cvStats, cvUpdated, type CvItem, type CvTopic } from "@/content/cv";

/** Helpers over content/cv.ts, the one source for the CV page, its plain-text and markdown copies, and the KB. */

export function cvItem(id: string): CvItem {
  const it = cvItems.find((x) => x.id === id);
  if (!it) throw new Error(`No CV item: ${id}`);
  return it;
}

/** "Zelthy (Multi-Tenant SaaS Low-Code Platform) · Bangalore (remote)" → "Zelthy (Multi-Tenant SaaS Low-Code Platform)" (About.dc.html `it.org.split(' · ')[0]`, the Ask topic label). */
export const orgName = (it: CvItem) => it.org.split(" · ")[0];
/** The organisation alone, for source chips: "Zelthy" ("CV · Zelthy · …", as Ask.dc.html and Hero.dc.html label them). */
export const orgShort = (it: CvItem) => orgName(it).replace(/\s*\([^)]*\)$/, "");

/** The Ask topic for "Ask about this role →": "{title} · {company}" plus the item's questions. */
export function topicFor(it: CvItem): CvTopic {
  return { label: `${it.title} · ${orgName(it)}`, qa: it.qa ?? [] };
}
export { cvGeneral };

/** "Copy as plain text": `cvPlainText()` in About.dc.html, line for line (design update 15). */
export function cvPlainText(): string {
  const out = [cvHeader.name, cvHeader.role, [cvHeader.location, ...cvHeader.links.map((l) => l.plain)].join(" · ")];
  const section = (title: string, lane: CvItem["lane"]) => {
    out.push("", title);
    for (const it of cvItems.filter((x) => x.lane === lane)) {
      out.push("", `${it.title} — ${it.org} (${it.dates})`);
      if (it.ladder) out.push(it.ladder);
      if (it.scope) out.push(it.scope);
      if (it.full) for (const x of it.full) out.push(`- ${x}`);
      else if (it.groups)
        for (const g of it.groups) {
          out.push(g.name);
          for (const x of g.items) out.push(`- ${x}`);
        }
      else for (const x of it.highlights) out.push(`- ${x}`);
    }
  };
  section("AGENTIC AI PRODUCT BUILDS", "project");
  section("EXPERIENCE", "work");
  section("EDUCATION", "edu");
  out.push("", "SKILLS");
  for (const [name, list] of cvSkills) out.push(`${name}: ${list}`);
  return out.join("\n");
}

/** A project's label on the CV page (About.dc.html `kind`, design update 15). */
export const projectKind = (it: CvItem) => (it.id === "web" ? "Side project" : "Agentic AI build");

/** cvUpdated ("2026-11-27") as the CV page shows it: "27 Nov 2026". */
export function cvUpdatedLabel(): string {
  return new Date(`${cvUpdated}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** /about.md, the markdown twin of the CV page for GEO (SPEC §4), from the same content. */
export function cvMarkdown(): string {
  const out = [
    `# ${cvHeader.name}`,
    "",
    cvHeader.role,
    "",
    [cvHeader.location, ...cvHeader.links.map((l) => `[${l.label}](${l.href})`)].join(" · "),
    "",
    cvHeader.summary,
    "",
    ...cvStats.map(([big, small]) => `- **${big}** ${small}`),
    "",
    "## Experience",
  ];
  for (const it of cvItems) {
    out.push("", `### ${it.title}`, "", `${it.org} · ${it.dates}${it.lane === "project" ? ` · ${projectKind(it)}` : ""}`);
    if (it.ladder) out.push("", it.ladder);
    if (it.scope) out.push("", it.scope);
    if (it.highlights.length) out.push("", ...it.highlights.map((h) => `- ${h}`));
    if (it.full) out.push("", "Everything I did:", "", ...it.full.map((x) => `- ${x}`));
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
    s.push(it.dates, it.title, it.org, it.scope, ...it.highlights, ...(it.full ?? []));
    if (it.ladder) s.push(it.ladder);
    for (const g of it.groups ?? []) s.push(g.name, g.summary, ...g.items);
  }
  for (const [a, b] of cvSkills) s.push(a, b);
  return s.filter(Boolean);
}
