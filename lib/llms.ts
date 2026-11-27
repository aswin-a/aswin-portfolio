import { cvHeader } from "@/content/cv";
import { products } from "@/content/products";
import { siteMeta } from "@/content/site-meta";
import { stackHero } from "@/content/stack";
import { hrefOf, isTodo, published } from "@/lib/content";
import { linkedCaseStudies } from "@/lib/case-studies";
import { isHiddenStudy } from "@/lib/case-study-visibility";
import { cvMarkdown } from "@/lib/cv";
import { posts } from "@/lib/posts";
import { stackMarkdown } from "@/lib/stack";
import { absolute, DESCRIPTIONS, SITE_URL } from "@/lib/seo";

/**
 * /llms.txt and /llms-full.txt (SPEC §11, llmstxt.org format), built from /content. Like the pages,
 * production leaves out anything that still holds a placeholder.
 */
const link = (label: string, path: string, note?: string) => `- [${label}](${absolute(path)})${note ? `: ${note}` : ""}`;

function header(): string[] {
  return [
    `# ${cvHeader.name}`,
    "",
    `> ${cvHeader.role}. ${DESCRIPTIONS.home}`,
    "",
    cvHeader.summary,
    "",
    `This site is an AI product: the fit check and "Ask my work" answer only from the knowledge base generated from the CV, and every claim cites a source. Site: ${SITE_URL}`,
  ];
}

export async function llmsTxt(): Promise<string> {
  const [studies, logPosts] = await Promise.all([linkedCaseStudies(), posts()]);
  const elsewhere = [
    ["LinkedIn", siteMeta.linkedin],
    ["GitHub", siteMeta.github],
  ].filter(([, u]) => !isTodo(u));
  return [
    ...header(),
    "",
    "## CV",
    "",
    link("CV", "/about", "roles, agentic AI builds and side projects, education and skills"),
    link("CV as markdown", "/about.md"),
    "",
    "## How I work with AI",
    "",
    link(stackHero.title, "/stack", stackHero.subline),
    link("Operating stack as markdown", "/stack.md"),
    "",
    ...(studies.length ? ["## Case studies", "", ...studies.map((cs) => link(cs.title, `/work/${cs.slug}`, cs.lede)), ""] : []),
    "## Build log",
    "",
    ...logPosts.map((p) => link(p.title, `/log/${p.slug}`, p.summary)),
    "",
    "## Optional",
    "",
    link("Full text for LLMs", "/llms-full.txt"),
    link("Build log RSS", "/rss.xml"),
    ...elsewhere.map(([label, url]) => `- [${label}](${url})`),
    "",
  ].join("\n");
}

export async function llmsFullTxt(): Promise<string> {
  const [studies, logPosts] = await Promise.all([linkedCaseStudies(), posts()]);
  const out = [...header(), "", "## Products I've built", ""];
  for (const p of published(products)) {
    out.push(`### ${p.num} · ${p.name}`, "", p.pitch, "", `What I built: ${p.built}`, "");
    out.push(`How it works: ${p.flow.map((s) => s.text).join(" → ")}`, "", `Tags: ${p.tags.join(", ")}`, "");
    if (!isHiddenStudy(p.slug)) out.push(`Case study: ${absolute(`/work/${p.slug}`)}`, "");
  }
  if (studies.length) out.push("## Case studies", "");
  for (const cs of studies) {
    out.push(`### ${cs.title}`, "", absolute(`/work/${cs.slug}`), "", cs.lede, "");
    out.push(...cs.facts.map((f) => `- ${f.label}: ${f.value}`), "");
    if (cs.problem) out.push(`Who: ${cs.problem.who}`, "", `Problem: ${cs.problem.problem}`, "", `Why AI: ${cs.problem.whyAi}`, "");
    for (const d of cs.decisions ?? []) out.push(`- Decision · ${d.topic}: chose ${d.chose} over ${d.over}, because ${d.because}`);
    if (cs.decisions?.length) out.push("");
    for (const s of cs.safeguards ?? []) out.push(`- Safeguard · ${s.title}: stops ${s.stops} The user sees: ${s.userSees}`);
    if (cs.safeguards?.length) out.push("");
    if (cs.v2) out.push(`v2: ${cs.v2}`, "");
    if (cs.learned) out.push(`What I learned: ${cs.learned}`, "");
    const repo = hrefOf(cs.repo);
    if (repo !== "#") out.push(`Repository: ${repo}`, "");
  }
  out.push("## Build log", "");
  for (const p of logPosts) out.push(`### ${p.title}`, "", `${p.tag} · ${p.date} · ${absolute(`/log/${p.slug}`)}`, "", p.summary, "");
  out.push("## Operating stack", "", stackMarkdown().replace(/^# .*\n\n/, "").replace(/^#/gm, "##"), "");
  out.push("## CV", "", cvMarkdown().replace(/^# .*\n\n/, ""));
  return out.join("\n");
}
