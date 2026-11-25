"use client";

import Link from "next/link";
import { isHiddenStudyHref } from "@/lib/case-study-visibility";
import type { Ref } from "react";
import { useMedia } from "@/lib/hooks/use-media";
import type { ResultEvent } from "@/lib/fit-check/types";

const colHead = "px-5 py-3 text-left align-bottom font-mono text-[11px] font-medium uppercase tracking-[0.06em]";
const rowHead = "px-5 py-[18px] text-left align-top text-[16px] font-semibold leading-[1.4]";
const cell = "px-5 py-[18px] align-top text-[15px] leading-[1.55]";
const stackLabel = "font-mono text-[11px] uppercase tracking-[0.06em]";

/**
 * Result and bad-fit states (Hero.dc.html `isResult`, design update 3): matches and gaps as
 * tables at ≥ 640px, stacked rows below. The run's numbers live in X-ray's "This run" panel.
 */
export function Result({
  result,
  bad,
  onAskGap,
  onAsk,
  onTalk,
  headingRef,
}: {
  result: ResultEvent;
  bad: boolean;
  onAskGap: (i: number) => void;
  onAsk: () => void;
  onTalk: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const wide = useMedia("(min-width: 640px)");
  const matchCount = result.matches.length;
  const askGap = (i: number, narrow: boolean) => (
    <button
      type="button"
      onClick={() => onAskGap(i)}
      className={`cursor-pointer rounded-lg border border-amber-border bg-transparent font-mono text-[12px] text-amber-text ${
        narrow ? "min-h-10 self-start px-3 py-[6px]" : "min-h-9 px-[10px] py-1"
      }`}
    >
      Ask about this gap →
    </button>
  );
  return (
    <div className="flex flex-col gap-7 max-[640px]:gap-5">
      <div className="flex flex-col gap-[10px]">
        <span className="self-start rounded-full border-[1.5px] border-ink px-[10px] py-[3px] font-mono text-[11px] font-medium tracking-[0.1em] text-ink">
          RESULT
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-serif text-[40px] font-normal leading-[1.1] tracking-[-0.01em] outline-none max-[640px]:text-[28px] max-[640px]:leading-[1.15]"
        >
          {result.verdict}
        </h2>
        <p className="m-0 text-[16px] text-muted">{result.note}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-accent">Where I fit · {matchCount}</p>
        <div className="overflow-hidden rounded-xl border border-rule bg-paper">
          {wide ? (
            <table className="w-full table-fixed border-collapse font-sans">
              <thead>
                <tr>
                  <th scope="col" className={`w-[32%] text-muted ${colHead}`}>The JD asks for</th>
                  <th scope="col" className={`w-[44%] text-accent ${colHead}`}>✓ My relevant experience</th>
                  <th scope="col" className={`w-[24%] text-muted ${colHead}`}>Proof</th>
                </tr>
              </thead>
              <tbody>
                {result.matches.map((m) => (
                  <tr key={m.req}>
                    <th scope="row" className={`border-t border-rule ${rowHead}`}>{m.req}</th>
                    <td className={`border-t border-rule ${cell}`}>{m.evidence}</td>
                    <td className="border-t border-rule px-5 py-[18px] align-top">
                      {isHiddenStudyHref(m.href) ? (
                        <span className="font-mono text-[12px] leading-[1.5] text-muted">{m.source}</span>
                      ) : (
                        <Link href={m.href} className="font-mono text-[12px] leading-[1.5] text-accent">
                          {m.source} →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            result.matches.map((m) => (
              <div key={m.req} className="flex flex-col gap-2 border-b border-rule px-[18px] py-4">
                <span className={`${stackLabel} text-muted`}>The JD asks for</span>
                <p className="m-0 text-[16px] font-semibold leading-[1.4]">{m.req}</p>
                <span className={`mt-1 ${stackLabel} text-accent`}>✓ My relevant experience</span>
                <p className="m-0 text-[15px] leading-[1.55]">{m.evidence}</p>
                {isHiddenStudyHref(m.href) ? (
                  <span className="font-mono text-[12px] text-muted">Proof: {m.source}</span>
                ) : (
                  <Link href={m.href} className="font-mono text-[12px] text-accent">
                    Proof: {m.source} →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-amber-text">
          Where I don&apos;t (yet) · {result.gaps.length}
        </p>
        <div className="overflow-hidden rounded-xl border-[1.5px] border-dashed border-amber-border bg-amber-bg">
          {wide ? (
            <table className="w-full table-fixed border-collapse font-sans">
              <thead>
                <tr>
                  <th scope="col" className={`w-[32%] text-amber-text ${colHead}`}>The JD asks for</th>
                  <th scope="col" className={`w-[34%] text-amber-text ${colHead}`}>Where I stand</th>
                  <th scope="col" className={`w-[34%] text-amber-text ${colHead}`}>How I&apos;d close it</th>
                </tr>
              </thead>
              <tbody>
                {result.gaps.map((g, i) => (
                  <tr key={g.req}>
                    <th scope="row" className={`border-t border-amber-border ${rowHead}`}>{g.req}</th>
                    <td className={`border-t border-amber-border ${cell}`}>{g.closest}</td>
                    <td className={`border-t border-amber-border ${cell}`}>
                      <span className={`mb-[10px] block ${g.close ? "text-ink" : "text-muted"}`}>{g.close || "—"}</span>
                      {askGap(i, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            result.gaps.map((g, i) => (
              <div key={g.req} className="flex flex-col gap-2 border-b border-dashed border-amber-border px-[18px] py-4">
                <span className={`${stackLabel} text-amber-text`}>The JD asks for</span>
                <p className="m-0 text-[16px] font-semibold leading-[1.4]">{g.req}</p>
                <span className={`mt-1 ${stackLabel} text-amber-text`}>Where I stand</span>
                <p className="m-0 text-[15px] leading-[1.55]">{g.closest}</p>
                {g.close && (
                  <>
                    <span className={`mt-1 ${stackLabel} text-amber-text`}>How I&apos;d close it</span>
                    <p className="m-0 text-[15px] leading-[1.55]">{g.close}</p>
                  </>
                )}
                {askGap(i, true)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compact (design update 9): one per line, full width. */}
      <div className="flex flex-wrap items-center gap-3 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-x-3 max-[640px]:gap-y-[10px]">
        <a
          href="#contact"
          onClick={onTalk}
          className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-btn-bg px-[22px] py-3 text-[16px] font-semibold text-btn-ink no-underline"
        >
          {bad ? "Talk to Aswin anyway" : "Talk to Aswin about this role"}
        </a>
        <button
          type="button"
          onClick={onAsk}
          className="min-h-12 cursor-pointer rounded-[10px] border border-rule bg-paper px-[18px] py-3 font-sans text-[15px] text-ink"
        >
          Ask my work <span className="font-mono text-[12px] text-muted">⌘K</span>
        </button>
        {/* "See my CV" links to the CV page (design update 9; was "Download resume"). */}
        <Link href="/about" className="inline-flex min-h-12 items-center justify-center px-[6px] py-0 text-[15px] text-ink">
          See my CV
        </Link>
      </div>
    </div>
  );
}
