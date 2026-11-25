"use client";

import Link from "next/link";
import type { Ref } from "react";
import { XrayPanel } from "@/components/xray-panel";
import { fallback as precomputed } from "@/content/kb/fallback";
import { FALLBACK_COPY } from "@/lib/fit-check/copy";
import type { FallbackEvent } from "@/lib/fit-check/types";

/** Error and rate-limited states, including both failure drills (Hero.dc.html `showFallback`). */
export function Fallback({
  event,
  xray,
  onRetry,
  onTalk,
  headingRef,
}: {
  event: FallbackEvent;
  xray: boolean;
  onRetry: () => void;
  onTalk: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const copy = FALLBACK_COPY[event.drill ?? event.reason];
  const isError = event.reason === "error" && !event.drill;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-[10px] rounded-[14px] border border-rule bg-paper p-[22px]">
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-muted">{copy.tag}</p>
        <h2 ref={headingRef} tabIndex={-1} className="m-0 font-serif text-[32px] font-normal leading-[1.15] outline-none">
          {copy.title}
        </h2>
        <p className="m-0 max-w-[680px] text-[16px] leading-[1.55] text-muted">{copy.text}</p>
        <div className="mt-[6px] flex flex-wrap gap-[10px]">
          {isError && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-btn-bg px-[18px] py-[10px] font-sans text-[15px] font-semibold text-btn-ink"
            >
              Try again
            </button>
          )}
          <a
            href="#contact"
            onClick={onTalk}
            className="inline-flex min-h-11 items-center rounded-[10px] border border-rule px-[18px] py-[10px] text-[15px] text-ink no-underline"
          >
            Message Aswin about this role
          </a>
        </div>
      </div>
      {xray && event.drill && (
        <XrayPanel className="flex flex-col gap-[6px] rounded-[10px] px-4 py-[14px] font-mono text-[13px]">
          <p className="m-0 text-[12px] text-xr-muted">FALLBACK TRACE · drill run {event.runId ?? "[run id]"}</p>
          {(event.trace ?? []).map((l, i) => (
            <p key={i} className={`m-0 ${l.bad ? "text-xr-amber-text" : "text-xr-ink"}`}>
              {l.mark} {l.text}
              {l.timed && ` · ${l.ms !== undefined ? `${l.ms} ms` : "[ms]"}`}
            </p>
          ))}
        </XrayPanel>
      )}
      <p className="m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-accent">Precomputed matches · same knowledge base</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[14px]">
        {precomputed.map((f) => (
          <article key={f.role} className="flex flex-col gap-[10px] rounded-xl border border-rule bg-paper p-[18px]">
            <h3 className="m-0 text-[17px] font-semibold">{f.role}</h3>
            <p className="m-0 text-[15px] leading-[1.5] text-muted">{f.summary}</p>
            <Link
              href={f.href}
              className="mt-auto self-start rounded-md bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline"
            >
              {f.source} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
