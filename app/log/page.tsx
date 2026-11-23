import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PostList } from "@/components/log/post-list";
import { Nav } from "@/components/nav";
import { siteMeta } from "@/content/site-meta";
import { hrefOf, withTodo } from "@/lib/content";
import { posts } from "@/lib/posts";

export const metadata: Metadata = { title: "Build log" };

export default async function BuildLog() {
  const all = await posts();
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <Nav current="log" />
      <main className="mx-auto flex max-w-[880px] flex-col gap-9 px-6 pt-[72px] pb-24">
        <header className="flex flex-col gap-[14px]">
          <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted">BUILD LOG</p>
          <h1 className="m-0 font-serif text-[clamp(44px,6vw,68px)] font-normal leading-[1.04] tracking-[-0.02em]">
            Notes from building AI products in public.
          </h1>
          <p className="m-0 font-serif text-[21px] leading-[1.45] text-muted">
            Build notes from my own projects first. Teardowns, essays and short TILs around them. A new post every{" "}
            {siteMeta.postingCadence} weeks, also on LinkedIn.
          </p>
        </header>
        <PostList posts={all} />
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-rule bg-paper p-[22px]">
          <p className="m-0 font-serif text-[20px]">Get the next post on LinkedIn.</p>
          <a
            href={hrefOf(siteMeta.linkedin)}
            className="inline-flex min-h-11 items-center rounded-[10px] bg-btn-bg px-4 py-2 text-[15px] font-semibold text-btn-ink no-underline"
          >
            {withTodo("Follow Aswin", siteMeta.linkedin)}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
