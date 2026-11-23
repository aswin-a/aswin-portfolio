import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/components/case-study/case-study";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { caseStudies } from "@/lib/case-studies";
import { posts } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await caseStudies()).map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = (await caseStudies()).find((c) => c.slug === slug);
  return { title: cs ? `Case study — ${cs.title}` : "Case study" };
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
      <Nav current="work" />
      <CaseStudyPage cs={cs} next={next} related={related} />
      <Footer />
    </div>
  );
}
