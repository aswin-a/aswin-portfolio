import Link from "next/link";
import type { ReactNode } from "react";
import { products, type Product } from "@/content/products";
import { workLinkIsLive } from "@/lib/case-studies";
import { hrefOf, published } from "@/lib/content";

/** `/` paths use client navigation; anchors and placeholder links stay plain. No href: not a link. */
function A({ href, className, children }: { href: string | undefined; className: string; children: ReactNode }) {
  if (href === undefined) return <div className={className}>{children}</div>;
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} className={className}>{children}</a>;
}

const accentStatus = (status: string) => status === "LIVE HERE" || status.startsWith("IN USE");

/**
 * "Products I've built" (Main.dc.html, design update 4) plus the phone list (Mobile.dc.html, ≤ 640px).
 * `headingLevel` is 1 on the standalone /work page (a design gap, SPEC §4), where the hero's
 * `#fit-h` anchor lives on `/`, so `anchorBase` is "/".
 */
export async function ProductsSection({ headingLevel = 2, anchorBase = "" }: { headingLevel?: 1 | 2; anchorBase?: "" | "/" }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const items = published(products);
  // A button to an unpublished case study is left out (Aswin, 2026-11-24); the card stays.
  const isLive = await workLinkIsLive();
  const primaryOf = (p: Product) => (p.primary && isLive(p.primary.href) ? p.primary : undefined);
  const secondaryOf = (p: Product) => (isLive(p.secondary.href) ? p.secondary : undefined);
  const href = (h: string) => {
    const url = hrefOf(h);
    return url.startsWith("#") && url !== "#" ? `${anchorBase}${url}` : url;
  };
  // The phone card goes where the primary button goes when that's on this page ("Try it above ↑").
  const phoneHref = (p: Product) => {
    const primary = primaryOf(p);
    if (primary?.href.startsWith("#")) return href(primary.href);
    const secondary = secondaryOf(p);
    return secondary && href(secondary.href);
  };

  return (
    <>
      <section aria-labelledby="work-h" className="border-t border-rule px-6 py-16 max-[640px]:hidden">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-7">
          <div className="flex flex-col gap-[10px]">
            <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted">CASE STUDIES</p>
            <H id="work-h" className="m-0 font-serif text-[40px] font-normal leading-[1.1] tracking-[-0.01em]">
              Products I&apos;ve built
            </H>
            <p className="m-0 text-[16px] leading-[1.5] text-muted">
              Four AI products, each with a case study written like a PRD: the problem, the trade-offs, the safeguards and
              what&apos;s next.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {items.map((p) => (
              <article
                key={p.slug}
                className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-10 gap-y-6 rounded-2xl border border-rule bg-paper p-7"
              >
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[12px] text-muted">{p.num}</span>
                  <h3 className="m-0 font-serif text-[30px] font-normal leading-[1.15]">{p.name}</h3>
                  <p className="m-0 text-[16px] leading-[1.5] text-muted">{p.pitch}</p>
                  <p className="m-0 text-[15px] leading-[1.5]">
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">What I built </span>
                    {p.built}
                  </p>
                  {(primaryOf(p) || secondaryOf(p)) && (
                    <div className="mt-auto flex flex-wrap gap-[10px] pt-[6px]">
                      {primaryOf(p) && (
                        <A
                          href={href(primaryOf(p)!.href)}
                          className="inline-flex min-h-11 items-center rounded-[10px] bg-btn-bg px-4 py-2 text-[14px] font-semibold text-btn-ink no-underline"
                        >
                          {primaryOf(p)!.label}
                        </A>
                      )}
                      {secondaryOf(p) && (
                        <A
                          href={href(secondaryOf(p)!.href)}
                          className="inline-flex min-h-11 items-center px-1 font-mono text-[13px] text-accent no-underline"
                        >
                          {secondaryOf(p)!.label}
                        </A>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">How it works</span>
                  <ol className="m-0 flex list-none flex-col gap-0 p-0">
                    {p.flow.map((f, k) => (
                      <li key={f.text} className="flex items-start gap-3">
                        <span className="flex flex-[0_0_auto] flex-col items-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${
                              f.human
                                ? "border-[1.5px] border-dashed border-amber-border bg-amber-bg text-amber-text"
                                : "border border-solid border-rule bg-paper text-muted"
                            }`}
                          >
                            {k + 1}
                          </span>
                          <span className={`block w-px bg-rule ${k < p.flow.length - 1 ? "h-[14px]" : "h-0"}`} />
                        </span>
                        <span className={`pt-[2px] pb-3 text-[15px] leading-[1.4] ${f.human ? "text-amber-text" : "text-ink"}`}>
                          {f.text}
                          <span className="font-mono text-[11px] text-amber-text">{f.human ? "  · person decides" : ""}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-auto flex flex-wrap gap-[6px]">
                    {p.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-rule px-2 py-[3px] font-mono text-[11px] text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="m-work" className="hidden flex-col gap-3 border-t border-rule px-5 pt-9 pb-14 max-[640px]:flex">
        <p className="m-0 font-mono text-[11px] tracking-[0.08em] text-muted">CASE STUDIES</p>
        <H id="m-work" className="m-0 mb-1 font-serif text-[30px] font-normal">
          Products I&apos;ve built
        </H>
        {items.map((p) => (
          <A
            key={p.slug}
            href={phoneHref(p)}
            className="flex flex-col gap-[6px] rounded-xl border border-rule bg-paper px-4 py-[14px] no-underline"
          >
            <span className={`font-mono text-[11px] ${accentStatus(p.status) ? "text-accent" : "text-muted"}`}>{p.status}</span>
            <span className="text-[16px]">{p.name}</span>
            {p.phoneFlow ? (
              <span className="font-mono text-[12px] text-muted">
                {p.phoneFlow.map((f, i) => (
                  <span key={f.text}>
                    {f.human ? <span className="text-amber-text">{f.text}</span> : f.text}
                    {i < p.phoneFlow!.length - 1 ? " → " : ""}
                  </span>
                ))}
              </span>
            ) : (
              primaryOf(p)?.href.startsWith("#") && <span className="font-mono text-[12px] text-muted">{primaryOf(p)!.label}</span>
            )}
          </A>
        ))}
      </section>
    </>
  );
}
