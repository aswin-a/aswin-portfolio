import { caseStudies } from "@/lib/case-studies";
import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Case study";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await caseStudies()).map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = (await caseStudies()).find((c) => c.slug === slug);
  return ogImage({ title: cs?.title ?? "Case study", eyebrow: "CASE STUDY" });
}
