import type { ComponentType } from "react";
import { isHiddenStudy } from "@/lib/case-study-visibility";
import { published } from "@/lib/content";
import { CaseStudySchema, type CaseStudy } from "@/lib/schemas/content";

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

/** Case studies the site links to, for the sitemap, llms.txt and the like. */
export async function linkedCaseStudies(): Promise<CaseStudy[]> {
  return (await caseStudies()).filter((cs) => !isHiddenStudy(cs.slug));
}
