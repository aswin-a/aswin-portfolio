"use client";

import Link from "next/link";
import { ComingSoonLink, ComingSoonPill } from "@/components/coming-soon";
import { isHiddenStudy } from "@/lib/case-study-visibility";
import { useState } from "react";
import type { Post } from "@/lib/schemas/content";

const CATS: [Post["category"] | "all", string][] = [
  ["all", "All"],
  ["build", "Build notes"],
  ["teardown", "Teardowns"],
  ["essay", "Essays"],
  ["til", "TIL"],
];

/** Filters, posts and the empty state from BuildLog.dc.html. */
export function PostList({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<Post["category"] | "all">("all");
  const shown = posts.filter((p) => filter === "all" || p.category === filter);
  const label = (CATS.find((c) => c[0] === filter) ?? CATS[0])[1];
  // TIL stays upper-case (Aswin, 2026-11-13); the other labels are lower-cased as designed.
  const emptyLabel = label === "TIL" ? label : label.toLowerCase();

  return (
    <>
      <div role="group" aria-label="Filter posts" className="flex flex-wrap gap-2">
        {CATS.map(([id, name]) => {
          const on = filter === id;
          const n = id === "all" ? posts.length : posts.filter((p) => p.category === id).length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={on}
              className={`min-h-11 cursor-pointer rounded-full border px-4 py-2 font-sans text-[14px] ${
                on ? "border-btn-bg bg-btn-bg text-btn-ink" : "border-rule bg-transparent text-ink"
              }`}
            >
              {name} <span className="font-mono text-[12px] opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {shown.map((p) => (
          <article key={p.slug} className="flex flex-col gap-[10px] border-t border-rule py-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] text-muted">
              <span>{p.tag}</span>
              {p.comingSoon ? (
                <ComingSoonPill />
              ) : (
                <>
                  <span>{p.date}</span>
                  <span>{p.readTime}</span>
                </>
              )}
            </div>
            <h2 className="m-0 font-serif text-[32px] font-normal leading-[1.2]">
              {p.comingSoon ? (
                <span className="text-muted">{p.title}</span>
              ) : (
                <Link href={`/log/${p.slug}`} className="no-underline">
                  {p.title}
                </Link>
              )}
            </h2>
            <p className="m-0 font-mono text-[13px] leading-[1.55] text-muted">
              {p.summary}
            </p>
            {p.study && isHiddenStudy(p.study.slug) && (
              <ComingSoonLink label={p.study.label} className="self-start font-mono text-[12px]" />
            )}
            {p.study && !isHiddenStudy(p.study.slug) && (
              <Link
                href={`/work/${p.study.slug}`}
                className="self-start rounded-md bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline"
              >
                {p.study.label} →
              </Link>
            )}
          </article>
        ))}
        {shown.length === 0 && (
          <div className="flex flex-col gap-2 border-t border-rule py-9">
            <p className="m-0 font-serif text-[24px]">No {emptyLabel} yet. The first one is in the works.</p>
            <p className="m-0 text-[15px] text-muted">Build notes come first. Until then, the case studies go deeper.</p>
            <Link href="/work" className="inline-flex min-h-11 items-center text-[15px] text-accent">
              Read a case study →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
