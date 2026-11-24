"use client";

import { useShowIntro, useSite } from "@/components/xray-provider";

/**
 * "New here? Try X-ray." Desktop copy and sizes from Main.dc.html; the phone variant
 * (copy and full-width 44px buttons) from Mobile.dc.html. The design gives no breakpoint,
 * so it switches at 640px, the same as the Ask bottom sheet (SPEC §5).
 */
export function IntroBanner() {
  const show = useShowIntro();
  const { setXray, dismissIntro } = useSite();
  if (!show) return null;

  return (
    <div role="region" aria-label="About X-ray mode" className="intro-only border-b border-rule bg-accent-tint">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-[10px] px-6 py-3 max-[640px]:flex-col max-[640px]:flex-nowrap max-[640px]:items-stretch max-[640px]:px-5 max-[640px]:py-[14px]">
        <p className="m-0 text-[15px] leading-[1.5]">
          <b className="font-semibold">New here? Try X-ray.</b>{" "}
          <span className="max-[640px]:hidden">
            It shows how the AI works in the fit check, Ask my work and the case studies: the sources, guardrails, live
            traces, cost and eval results behind each answer.
          </span>
          <span className="hidden max-[640px]:inline">
            It shows how the AI works in the fit check, Ask my work and the case studies.
          </span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setXray(true)}
            className="min-h-10 cursor-pointer rounded-lg border-0 bg-btn-bg px-[14px] py-[6px] font-sans text-[14px] font-semibold text-btn-ink max-[640px]:min-h-11 max-[640px]:flex-1 max-[640px]:text-[15px]"
          >
            Turn on X-ray
          </button>
          <button
            type="button"
            onClick={dismissIntro}
            className="min-h-10 cursor-pointer rounded-lg border border-accent bg-transparent px-[14px] py-[6px] font-sans text-[14px] text-accent max-[640px]:min-h-11 max-[640px]:flex-1 max-[640px]:text-[15px]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
