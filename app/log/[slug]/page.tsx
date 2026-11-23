import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { loadPost, posts } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await posts()).map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await posts()).find((x) => x.slug === slug);
  return { title: p ? p.title : "Build log" };
}

/** Design gap (SPEC §4): a simple article page in the build log's type styles, 880px column. */
export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  if (!(await posts()).some((p) => p.slug === slug)) notFound();
  const { meta, Body } = await loadPost(slug);
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <Nav current="log" />
      <main className="mx-auto flex max-w-[880px] flex-col gap-9 px-6 pt-[72px] pb-24">
        <header className="flex flex-col gap-[14px]">
          <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[12px] text-muted">
            <span>{meta.tag}</span>
            <span>{meta.date}</span>
            <span>{meta.readTime}</span>
          </div>
          <h1 className="m-0 font-serif text-[clamp(44px,6vw,68px)] font-normal leading-[1.04] tracking-[-0.02em]">{meta.title}</h1>
        </header>
        <article className="flex flex-col gap-4">
          <Body />
        </article>
        {meta.study && (
          <Link
            href={`/work/${meta.study.slug}`}
            className="self-start rounded-md bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline"
          >
            {meta.study.label} →
          </Link>
        )}
      </main>
      <Footer />
    </div>
  );
}
