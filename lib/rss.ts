import { posts } from "@/lib/posts";
import { absolute, DESCRIPTIONS, isoDate, SITE_NAME } from "@/lib/seo";

/** RSS 2.0 for the build log (SPEC §11), from content/posts. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function rssXml(): Promise<string> {
  const items = (await posts()).map((p) => {
    const date = isoDate(p.date);
    const url = absolute(`/log/${p.slug}`);
    return [
      "    <item>",
      `      <title>${esc(p.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <description>${esc(p.summary)}</description>`,
      `      <category>${esc(p.tag)}</category>`,
      ...(date ? [`      <pubDate>${new Date(date).toUTCString()}</pubDate>`] : []),
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(`Build log · ${SITE_NAME}`)}</title>`,
    `    <link>${absolute("/log")}</link>`,
    `    <description>${esc(DESCRIPTIONS.log)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${absolute("/rss.xml")}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
