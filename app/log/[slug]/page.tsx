import type { Metadata } from "next";
import Link from "next/link";
import { StudyChip } from "@/components/coming-soon";
import { siteMeta } from "@/content/site-meta";
import { isTodo } from "@/lib/content";
import { isHiddenStudy } from "@/lib/case-study-visibility";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Nav } from "@/components/nav";
import { loadPost, posts } from "@/lib/posts";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

/** The closing card on every post (LogPost.dc.html, design update 12). */
const POST_FOLLOW = { text: "Get the next post on LinkedIn.", cta: "Follow Aswin" } as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await posts()).map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await posts()).find((x) => x.slug === slug);
  if (!p) return { title: "Build log" };
  return pageMetadata({ title: p.title, description: p.summary, path: `/log/${p.slug}`, type: "article" });
}

/** A build-log post (LogPost.dc.html, design update 12): 880px column, serif body, RELATED row and the LinkedIn card. */
export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  if (!(await posts()).some((p) => p.slug === slug)) notFound();
  const { meta, Body } = await loadPost(slug);
  const related = meta.related ?? [];
  const hasRelated = !!meta.study || related.length > 0;
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <JsonLd data={articleJsonLd(meta)} />
      <Nav current="log" />
      <main className="mx-auto flex max-w-[880px] flex-col gap-8 px-6 pt-14 pb-24">
        <Link href="/log" className="inline-flex min-h-11 items-center self-start font-mono text-[13px] text-accent no-underline">
          ← Build log
        </Link>
        <header className="flex flex-col gap-[14px]">
          <p className="m-0 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[12px] tracking-[0.04em] text-muted">
            <span>{meta.tag}</span>
            <span>{meta.date}</span>
            <span>{meta.readTime}</span>
          </p>
          <h1 className="m-0 font-serif text-h1 font-normal leading-[1.1] tracking-[-0.015em]">{meta.title}</h1>
          {meta.standfirst && <p className="m-0 font-serif text-[21px] leading-[1.45] text-muted">{meta.standfirst}</p>}
        </header>
        <article className="flex flex-col gap-5">
          <Body />
        </article>
        {hasRelated && (
          <div className="flex flex-col gap-3 border-t border-rule pt-6">
            <p className="m-0 font-mono text-[11px] tracking-[0.06em] text-muted">RELATED</p>
            <div className="flex flex-wrap items-center gap-2">
              {meta.study && isHiddenStudy(meta.study.slug) && <StudyChip label={meta.study.label} />}
              {meta.study && !isHiddenStudy(meta.study.slug) && (
                <Link
                  href={`/work/${meta.study.slug}`}
                  className="rounded-md bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline"
                >
                  {meta.study.label} →
                </Link>
              )}
              {related.map((r) => (
                <a key={r.href} href={r.href} className="rounded-md bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline">
                  {r.label} →
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-rule bg-paper p-[22px]">
          <p className="m-0 font-serif text-[20px]">{POST_FOLLOW.text}</p>
          {/* The LinkedIn follow link is the profile (content/site-meta.ts); hidden if that's ever a placeholder. */}
          {!isTodo(siteMeta.linkedin) && (
            <a
              href={siteMeta.linkedin}
              className="inline-flex min-h-11 items-center rounded-[10px] bg-btn-bg px-4 py-2 text-[15px] font-semibold text-btn-ink no-underline"
            >
              {POST_FOLLOW.cta}
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
