import type { ComponentType } from "react";
import { published } from "@/lib/content";
import { CaseStudySchema, type CaseStudy } from "@/lib/schemas/content";
import { posts } from "@/lib/posts";

// The 4 products' case studies, in their home order 01–04 (design update 4). The "Next" card follows it.
export const CASE_STUDY_SLUGS = ["job-search-agent", "fit-check", "integration-builder", "instagram-agent"] as const;

type MdxModule = { default: ComponentType; meta: unknown };

export async function loadCaseStudy(slug: string): Promise<CaseStudy> {
  const mod = (await import(`@/content/case-studies/${slug}.mdx`)) as MdxModule;
  return CaseStudySchema.parse(mod.meta);
}

/** All case studies in order, minus unproven ones in production. */
export async function caseStudies(): Promise<CaseStudy[]> {
  const all = await Promise.all(CASE_STUDY_SLUGS.map(loadCaseStudy));
  return published(all);
}

/**
 * True unless `href` points at a case study or build-log post that isn't published (production hides unfinished ones).
 * Links to those are left out rather than leading to a 404 (Aswin, 2026-11-24).
 */
export async function workLinkIsLive(): Promise<(href: string | undefined) => boolean> {
  const [studies, logPosts] = await Promise.all([caseStudies(), posts()]);
  const live = new Set([...studies.map((c) => `work/${c.slug}`), ...logPosts.map((p) => `log/${p.slug}`)]);
  return (href) => {
    const m = href?.match(/^\/(work|log)\/([^/#?]+)/);
    return !m || live.has(`${m[1]}/${m[2]}`);
  };
}
