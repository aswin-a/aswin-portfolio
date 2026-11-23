import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { posts } from "@/lib/posts";

export const alt = "Build log";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await posts()).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = (await posts()).find((x) => x.slug === slug);
  return ogImage({ title: p?.title ?? "Build log", eyebrow: "BUILD LOG" });
}
