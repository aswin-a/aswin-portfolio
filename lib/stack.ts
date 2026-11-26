import { stackClosing, stackHero, stackJudgment, stackLayers, stackRulesHeading } from "@/content/stack";
import { stackRules } from "@/content/stack-rules";
import { isTodo } from "@/lib/content";
import { absolute } from "@/lib/seo";

/** A site path becomes an absolute URL; other links stay as they are. */
const url = (href: string) => (href.startsWith("/") ? absolute(href) : href);

/**
 * /stack.md: the /stack page as markdown for GEO (design update 11), from the same content as the page.
 * Like the page, it leaves out every placeholder link.
 */
export function stackMarkdown(): string {
  const out = [`# ${stackHero.title}`, "", stackHero.subline, "", `## ${stackJudgment.title}`, "", stackJudgment.body, ""];
  out.push(`${stackJudgment.pillsLabel}: ${stackJudgment.pills.join(" · ")}.`, "");
  for (const l of stackLayers) {
    out.push(`### ${l.num} · ${l.name}`, "", l.summary, "");
    out.push(`- Tools: ${l.tools.join(", ")}`, `- How I use it: ${l.how}`, `- My call: ${l.call}`);
    const p = l.proof;
    const link = isTodo(p.href) ? "" : ` [${p.cta.replace(/\s*→$/, "")}](${url(p.href)})`;
    out.push(`- Proof (${p.kind}): ${p.title}. ${p.body}${link}`, "");
  }
  out.push(`## ${stackRulesHeading.title}`, "");
  for (const r of stackRules) out.push(`- ${r.id} · ${r.title}: ${r.body}`);
  out.push("", `## ${stackClosing.title}`, "", stackClosing.body);
  if (!isTodo(stackClosing.href)) out.push("", `[${stackClosing.cta}](${stackClosing.href})`);
  out.push("");
  return out.join("\n");
}
