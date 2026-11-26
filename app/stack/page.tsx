import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { StackDiagram } from "@/components/stack/stack-diagram";
import { stackClosing, stackHero, stackLayers, stackRulesHeading } from "@/content/stack";
import { stackRules } from "@/content/stack-rules";
import { isTodo } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "My AI-powered operating stack — Aswin",
  description: stackHero.subline,
  path: "/stack",
});

/**
 * /stack (Stack.dc.html, StackMobile.dc.html, design update 11; STACK-HANDOFF.md). No AI features
 * here, so X-ray changes nothing and the intro banner isn't shown. Placeholder links are hidden.
 */
export default function StackPage() {
  const linkedIn = !isTodo(stackClosing.href);
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <Nav current="stack" />
      <main>
        <section aria-labelledby="stack-h" className="px-6 pt-[72px] pb-10 max-[640px]:px-5 max-[640px]:pt-9 max-[640px]:pb-7">
          <div className="mx-auto flex max-w-[1040px] flex-col gap-4 max-[640px]:gap-3">
            <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted max-[640px]:text-[11px]">{stackHero.eyebrow}</p>
            <h1
              id="stack-h"
              className="m-0 max-w-[820px] font-serif text-[clamp(40px,6vw,64px)] font-normal leading-[1.04] tracking-[-0.015em] max-[640px]:text-[38px] max-[640px]:leading-[1.06] max-[640px]:tracking-[-0.01em]"
            >
              {stackHero.title}
            </h1>
            <p className="m-0 max-w-[720px] font-serif text-[22px] leading-[1.45] text-muted max-[640px]:text-[19px]">
              {stackHero.subline}
            </p>
            <p className="mt-2 mb-0 font-mono text-[13px] leading-[1.6] text-muted max-[640px]:mt-1 max-[640px]:text-[12px]">
              <span className="max-[640px]:hidden">{stackHero.meta}</span>
              <span className="hidden max-[640px]:inline">{stackHero.metaPhone}</span>
            </p>
          </div>
        </section>

        <section aria-label="Stack diagram" className="px-6 pb-16 max-[640px]:px-5 max-[640px]:pb-11">
          <div className="mx-auto max-w-[1040px]">
            <StackDiagram realProof={stackLayers.map((l) => !isTodo(l.proof.href))} />
          </div>
        </section>

        <section aria-labelledby="rules-h" className="border-t border-rule px-6 py-16 max-[640px]:px-5 max-[640px]:py-9">
          <div className="mx-auto flex max-w-[1040px] flex-col gap-6 max-[640px]:gap-[18px]">
            <div className="flex flex-col gap-[10px] max-[640px]:gap-[14px]">
              <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted max-[640px]:text-[11px]">{stackRulesHeading.eyebrow}</p>
              <h2 id="rules-h" className="m-0 font-serif text-[36px] font-normal leading-[1.15] max-[640px]:text-[28px] max-[640px]:leading-[1.2]">
                {stackRulesHeading.title}
              </h2>
            </div>
            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px] p-0 max-[640px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[640px]:gap-[10px]">
              {stackRules.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-[10px] rounded-xl border border-rule bg-paper p-5 max-[640px]:gap-[6px] max-[640px]:p-[14px]"
                >
                  <span className="font-mono text-[12px] text-muted max-[640px]:text-[11px]">{r.id}</span>
                  <h3 className="m-0 font-serif text-[23px] font-normal leading-[1.2] max-[640px]:text-[19px]">{r.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.5] text-muted max-[640px]:text-[13px] max-[640px]:leading-[1.45]">
                    <span className="max-[640px]:hidden">{r.body}</span>
                    <span className="hidden max-[640px]:inline">{r.phoneBody}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="yours-h" className="border-t border-rule px-6 pt-16 pb-[72px] max-[640px]:px-5 max-[640px]:pt-9 max-[640px]:pb-12">
          <div className="mx-auto flex max-w-[1040px] flex-wrap items-end justify-between gap-x-10 gap-y-6 max-[640px]:flex-col max-[640px]:flex-nowrap max-[640px]:items-stretch max-[640px]:gap-[18px]">
            <div className="flex flex-[1_1_420px] flex-col gap-3 max-[640px]:flex-none">
              <h2
                id="yours-h"
                className="m-0 font-serif text-[44px] font-normal leading-[1.08] tracking-[-0.01em] max-[640px]:text-[32px] max-[640px]:leading-[1.1] max-[640px]:tracking-normal"
              >
                {stackClosing.title}
              </h2>
              <p className="m-0 font-serif text-[20px] leading-[1.45] text-muted max-[640px]:text-[18px]">{stackClosing.body}</p>
            </div>
            {linkedIn && (
              <div className="flex flex-wrap gap-[10px] max-[640px]:block">
                <a
                  href={stackClosing.href}
                  className="inline-flex min-h-12 items-center rounded-[10px] bg-ink px-[18px] py-[10px] text-[15px] font-semibold text-paper no-underline max-[640px]:flex max-[640px]:justify-center"
                >
                  {stackClosing.cta}
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
