import Link from "next/link";
import { stackStrip } from "@/content/stack";

const BAND = "block rounded-[2px] border border-strip-band bg-paper h-[9px] max-[640px]:h-[6px] max-[640px]:rounded-[1px]";

/**
 * The homepage strip (HomeStrip.dc.html; placed in Main.dc.html and Mobile.dc.html, design updates 11–12):
 * a paper card inside a tinted band, under the fit-check hero, without the design's "HOW I WORK WITH AI"
 * eyebrow (Aswin, 2026-11-26). Top border only: the next section's top
 * border closes it. Only the CTA links to /stack, not the whole card (Aswin, 2026-11-26; design update 13). The row wraps (design update 13). Below 640px the CTA drops under the statement as
 * a mono line.
 */
export function StackStrip() {
  return (
    <section aria-label={stackStrip.label} className="border-t border-rule bg-panel px-6 py-7 max-[640px]:px-4 max-[640px]:py-5">
      <div className="mx-auto box-border flex max-w-[1040px] items-center rounded-[14px] border border-rule bg-paper px-6 py-5 text-ink max-[640px]:rounded-xl max-[640px]:px-4 max-[640px]:py-[14px]">
        <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-4 max-[640px]:flex-nowrap max-[640px]:gap-[14px]">
          <span
            aria-hidden="true"
            className="box-border flex w-[112px] flex-none flex-col gap-[3px] rounded-lg border border-rule bg-bg p-2 max-[640px]:w-16 max-[640px]:gap-[2px] max-[640px]:rounded-md max-[640px]:p-[6px]"
          >
            <span className="block h-[14px] rounded-[3px] bg-ink max-[640px]:h-[9px] max-[640px]:rounded-[2px]" />
            <span className="block h-1 max-[640px]:h-[2px]" />
            <span className={BAND} />
            <span className={BAND} />
            <span className={BAND} />
            <span className={BAND} />
          </span>
          <div className="flex flex-[1_1_320px] flex-col gap-1 max-[640px]:flex-[1_1_auto]">
            <p className="m-0 font-serif text-[26px] leading-[1.25] max-[640px]:text-[19px] max-[640px]:leading-[1.3]">{stackStrip.statement}</p>
            <Link
              href="/stack"
              className="strip-cta hidden min-h-11 items-center self-start font-mono text-[13px] text-accent no-underline max-[640px]:inline-flex"
            >
              {stackStrip.cta} {stackStrip.arrow}
            </Link>
          </div>
          <Link
            href="/stack"
            className="strip-cta inline-flex min-h-11 flex-none items-center gap-2 rounded-[10px] border border-accent px-4 text-[15px] font-semibold text-accent no-underline max-[640px]:hidden"
          >
            {stackStrip.cta} <span aria-hidden="true">{stackStrip.arrow}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
