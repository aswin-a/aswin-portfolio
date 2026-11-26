import Link from "next/link";
import { stackStrip } from "@/content/stack";

const BAND = "block rounded-[2px] border border-strip-band bg-bg h-[9px] max-[640px]:h-[6px] max-[640px]:rounded-[1px]";

/**
 * The homepage strip (HomeStrip.dc.html; placed in Main.dc.html and Mobile.dc.html, design update 11):
 * one link to /stack under the fit-check hero. Top border only: the next section's top border closes it.
 * Below 640px the CTA drops under the statement as a mono line and the strip is at least 76px tall.
 */
export function StackStrip() {
  return (
    <section aria-label={stackStrip.label} className="border-t border-rule">
      <Link
        href="/stack"
        className="strip-link flex items-center px-6 py-5 text-ink no-underline max-[640px]:box-border max-[640px]:min-h-[76px] max-[640px]:px-5 max-[640px]:py-[14px]"
      >
        <span className="mx-auto flex w-full max-w-[1040px] items-center gap-6 max-[640px]:gap-[14px]">
          <span
            aria-hidden="true"
            className="box-border flex w-[112px] flex-none flex-col gap-[3px] rounded-lg border border-rule bg-paper p-2 max-[640px]:w-16 max-[640px]:gap-[2px] max-[640px]:rounded-md max-[640px]:p-[6px]"
          >
            <span className="block h-[14px] rounded-[3px] bg-ink max-[640px]:h-[9px] max-[640px]:rounded-[2px]" />
            <span className="block h-1 max-[640px]:h-[2px]" />
            <span className={BAND} />
            <span className={BAND} />
            <span className={BAND} />
            <span className={BAND} />
          </span>
          <span className="flex flex-[1_1_auto] flex-col gap-1">
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
