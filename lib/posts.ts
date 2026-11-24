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

/** Posts in the design's order, minus unproven ones in production. */
export async function posts(): Promise<Post[]> {
  const all = await Promise.all(POST_SLUGS.map(async (s) => (await loadPost(s)).meta));
  return published(all);
}
