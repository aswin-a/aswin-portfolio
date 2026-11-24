import type { ComponentType } from "react";
import { published } from "@/lib/content";
import { PostSchema, type Post } from "@/lib/schemas/content";

export const POST_SLUGS = [
  "why-job-search-agent-asks-before-it-applies",
  "designing-safeguards-for-an-ai-that-writes-integrations",
  "integrations-experience-is-agent-experience",
  "ml-ocr-with-a-person-in-the-loop",
  "patient-data-and-llms",
] as const;

type MdxModule = { default: ComponentType; meta: unknown };

export async function loadPost(slug: string): Promise<{ meta: Post; Body: ComponentType }> {
  const mod = (await import(`@/content/posts/${slug}.mdx`)) as MdxModule;
  return { meta: PostSchema.parse(mod.meta), Body: mod.default };
}

async function allPosts(): Promise<Post[]> {
  return published(await Promise.all(POST_SLUGS.map(async (s) => (await loadPost(s)).meta)));
}

/** Readable posts in the design's order, minus unproven ones in production. Coming-soon posts aren't included. */
export async function posts(): Promise<Post[]> {
  return (await allPosts()).filter((p) => !p.comingSoon);
}

/** Posts in the design's order, coming-soon ones included: the build log lists both. */
export async function logEntries(): Promise<Post[]> {
  return allPosts();
}

/** `/log/{slug}` paths of coming-soon posts: links to them show "COMING SOON". */
export async function comingSoonPostHrefs(): Promise<Set<string>> {
  return new Set((await allPosts()).filter((p) => p.comingSoon).map((p) => `/log/${p.slug}`));
}
