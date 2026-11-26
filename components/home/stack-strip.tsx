import Link from "next/link";
import { stackStrip } from "@/content/stack";

const BAND = "block rounded-[2px] border border-strip-band bg-paper h-[9px] max-[640px]:h-[6px] max-[640px]:rounded-[1px]";

/**
 * The homepage strip (HomeStrip.dc.html; placed in Main.dc.html and Mobile.dc.html, design updates 11–12):
 * a paper card inside a tinted band, one link to /stack, under the fit-check hero. Top border only: the
 * next section's top border closes it. Below 640px the CTA drops under the statement as a mono line and
 * the card is at least 76px tall.
 */
export function StackStrip() {
  return (
    <section aria-label={stackStrip.label} className="border-t border-rule bg-panel px-6 py-7 max-[640px]:px-4 max-[640px]:py-5">
      <Link
        href="/stack"
        className="strip-link mx-auto box-border flex max-w-[1040px] items-center rounded-[14px] border border-rule bg-paper px-6 py-5 text-ink no-underline max-[640px]:min-h-[76px] max-[640px]:rounded-xl max-[640px]:px-4 max-[640px]:py-[14px]"
      >
        <span className="flex w-full items-center gap-6 max-[640px]:gap-[14px]">
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
          <span className="flex flex-[1_1_auto] flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[0.08em] text-muted">{stackStrip.eyebrow}</span>
            <span className="font-serif text-[26px] leading-[1.25] max-[640px]:text-[19px] max-[640px]:leading-[1.3]">
              {stackStrip.statement}
            </span>
            <span className="strip-cta hidden font-mono text-[13px] text-accent max-[640px]:inline">
              {stackStrip.cta} {stackStrip.arrow}
            </span>
          </span>
          <span className="strip-cta inline-flex min-h-11 flex-none items-center gap-2 rounded-[10px] border border-accent px-4 text-[15px] font-semibold text-accent max-[640px]:hidden">
            {stackStrip.cta} <span aria-hidden="true">{stackStrip.arrow}</span>
          </span>
        </span>
      </Link>
    </section>
  );
}
