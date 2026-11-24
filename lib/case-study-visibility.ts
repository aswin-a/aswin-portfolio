import { LIVE_CASE_STUDIES } from "@/content/case-studies/visibility";

/** True while a case study is hidden: its page stays reachable, but the site doesn't link to it. */
export function isHiddenStudy(slug: string): boolean {
  return !LIVE_CASE_STUDIES.includes(slug);
}

/** True for a link to a hidden case study (`/work/{slug}`, with or without a #hash). */
export function isHiddenStudyHref(href: string): boolean {
  const m = /^\/work\/([^/?#]+)/.exec(href);
  return m !== null && isHiddenStudy(m[1]);
}

/** A link label without its trailing arrow, for the muted "coming soon" state. */
export function plainLabel(label: string): string {
  return label.replace(/\s*[→↑]$/, "");
}
