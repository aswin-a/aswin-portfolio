import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/case-studies";
import { posts } from "@/lib/posts";
import { absolute, isoDate } from "@/lib/seo";

/** Every page, from /content (published entries only). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [studies, logPosts] = await Promise.all([caseStudies(), posts()]);
  return [
    { url: absolute("/"), changeFrequency: "weekly", priority: 1 },
    { url: absolute("/work"), changeFrequency: "monthly", priority: 0.8 },
    ...studies.map((cs) => ({ url: absolute(`/work/${cs.slug}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: absolute("/log"), changeFrequency: "weekly", priority: 0.7 },
    ...logPosts.map((p) => {
      const date = isoDate(p.date);
      return { url: absolute(`/log/${p.slug}`), ...(date ? { lastModified: date } : {}), changeFrequency: "yearly" as const, priority: 0.6 };
    }),
    { url: absolute("/about"), changeFrequency: "monthly", priority: 0.9 },
    { url: absolute("/about.md"), changeFrequency: "monthly", priority: 0.5 },
  ];
}
