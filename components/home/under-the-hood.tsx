import Link from "next/link";
import type { ReactNode } from "react";
import { LiveLink } from "@/components/home/live-link";
import { hood, type HoodItem } from "@/content/hood";
import { workLinkIsLive } from "@/lib/case-studies";
import { hrefOf, published } from "@/lib/content";

/** Status pill colours (Main.dc.html, design update 4). The phone list never uses dashed borders. */
function pillClass(u: HoodItem, phone = false) {
  if (u.live) return "border-solid border-accent bg-accent-tint text-accent";
  if (u.status === "shipped") return "border-solid border-ink bg-transparent text-ink";
  if (!phone && (u.status === "planned" || u.status === "prototype")) return "border-dashed border-rule bg-transparent text-muted";
  return "border-solid border-rule bg-transparent text-muted";
}

function CardLink({ card, className, children }: { card: HoodItem; className: string; children: ReactNode }) {
  // "planned" has no link and isn't clickable.
  if (!card.href) return <div className={className}>{children}</div>;
  if (card.live) return <LiveLink href={card.href} className={className}>{children}</LiveLink>;
  const href = hrefOf(card.href);
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} className={className}>{children}</a>;
}

/** Desktop grid (Main.dc.html) and the phone list (Mobile.dc.html, ≤ 640px). */
export async function UnderTheHood() {
  // A card whose proof is an unpublished case study is left out with it (Aswin, 2026-11-24).
  const isLive = await workLinkIsLive();
  const cards = published(hood).filter((u) => isLive(u.href));
  return (
    <>
      <section aria-labelledby="uh-h" className="border-t border-rule px-6 py-14 max-[640px]:hidden">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-5">
          <div className="flex flex-col gap-[10px]">
            <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted">ACROSS ALL MY WORK</p>
            <h2 id="uh-h" className="m-0 font-serif text-[36px] font-normal leading-[1.15]">
              How I build agentic products, with proof
            </h2>
            <p className="m-0 text-[16px] leading-[1.5] text-muted">
              Each part links to where you can see it working: live on this site, in a case study, or on GitHub.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[14px]">
            {cards.map((u) => (
              <CardLink
                key={u.name}
                card={u}
                className="box-border flex min-h-[170px] flex-col gap-[10px] rounded-xl border border-rule bg-paper p-[18px] text-ink no-underline"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[14px] font-medium">{u.name}</span>
                  <span className={`whitespace-nowrap rounded-full border px-2 py-[2px] font-mono text-[11px] ${pillClass(u)}`}>
                    {u.status}
                  </span>
                </span>
                <span className="text-[15px] leading-[1.5] text-muted">{u.proof}</span>
                <span className={`mt-auto font-mono text-[12px] ${u.status === "planned" ? "text-muted" : "text-accent"}`}>{u.cta}</span>
              </CardLink>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="m-hood" className="hidden flex-col gap-[10px] border-t border-rule px-5 py-9 max-[640px]:flex">
        <p className="m-0 font-mono text-[11px] tracking-[0.08em] text-muted">ACROSS ALL MY WORK</p>
        <h2 id="m-hood" className="m-0 font-serif text-[28px] font-normal leading-[1.2]">
          How I build agentic products, with proof
        </h2>
        <p className="m-0 mb-1 text-[15px] leading-[1.5] text-muted">Each part links to where you can see it working.</p>
        {cards.map((u) => (
          <CardLink
            key={u.name}
            card={u}
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-[10px] border border-rule bg-paper px-[14px] py-[10px] text-ink no-underline"
          >
            <span className="font-mono text-[14px]">{u.name}</span>
            <span className={`rounded-full border px-2 py-[2px] font-mono text-[11px] ${pillClass(u, true)}`}>{u.status}</span>
          </CardLink>
        ))}
      </section>
    </>
  );
}
