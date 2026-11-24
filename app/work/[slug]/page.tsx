import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/components/case-study/case-study";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Nav } from "@/components/nav";
import { caseStudies } from "@/lib/case-studies";
import { isHiddenStudy } from "@/lib/case-study-visibility";
import { posts } from "@/lib/posts";
import { creativeWorkJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await caseStudies()).map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = (await caseStudies()).find((c) => c.slug === slug);
  if (!cs) return { title: "Case study" };
  const meta = pageMetadata({ title: `Case study — ${cs.title}`, description: cs.lede, path: `/work/${cs.slug}`, type: "article" });
  // A hidden case study stays reachable by URL but out of search indexes (content/case-studies/visibility.ts).
  return isHiddenStudy(cs.slug) ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function CaseStudyRoute({ params }: Props) {
  const { slug } = await params;
  const [all, logPosts] = await Promise.all([caseStudies(), posts()]);
  const i = all.findIndex((c) => c.slug === slug);
  if (i < 0) notFound();
  const cs = all[i];
  // The design shows 01 → 02; the last study wraps to the first.
  const next = all[(i + 1) % all.length];
  const related = logPosts.find((p) => p.slug === cs.relatedPost);
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <JsonLd data={creativeWorkJsonLd(cs)} />
      <Nav current="work" />
      <CaseStudyPage cs={cs} next={next} related={related} />
      <Footer />
    </div>
  );
}
