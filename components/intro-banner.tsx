"use client";

import { useShowIntro, useSite } from "@/components/xray-provider";

/**
 * "New here? Try X-ray." Desktop only (Main.dc.html): below 640px the phone dock's hint replaces it
 * (Mobile.dc.html, design update 9) and shares its dismissal.
 */
export function IntroBanner() {
  const show = useShowIntro();
  const { setXray, dismissIntro } = useSite();
  if (!show) return null;

  return (
    <div role="region" aria-label="About X-ray mode" className="intro-only border-b border-rule bg-accent-tint max-[640px]:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-[10px] px-6 py-3">
        <p className="m-0 text-[15px] leading-[1.5]">
          <b className="font-semibold">New here? Try X-ray.</b> It shows how the AI works in the fit check, Ask my work and the
          case studies: the sources, guardrails, live traces, cost and eval results behind each answer.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setXray(true)}
            className="min-h-10 cursor-pointer rounded-lg border-0 bg-btn-bg px-[14px] py-[6px] font-sans text-[14px] font-semibold text-btn-ink"
          >
            Turn on X-ray
          </button>
          <button
            type="button"
            onClick={dismissIntro}
            className="min-h-10 cursor-pointer rounded-lg border border-accent bg-transparent px-[14px] py-[6px] font-sans text-[14px] text-accent"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
