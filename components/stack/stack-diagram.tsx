"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { stackJudgment, stackLabels, stackLayers, type StackLayer } from "@/content/stack";

/**
 * StackDiagram (StackDiagram.dc.html, design update 11): the Judgment band, the rail and the 4-layer
 * accordion. One tree for both layouts: below 640px it takes the design's `compact` values.
 * Layers open independently, all closed at first; `/stack#layer-N` opens layer N and scrolls to it.
 * Closed panels stay in the HTML with `hidden` (STACK-HANDOFF §5), so crawlers read every layer.
 *
 * `hrefs` says which proof links are real; a placeholder renders the card as a plain box with no CTA line
 * (Aswin, 2026-11-26). It's computed on the server, where todo() placeholders are known.
 */
const ID = "pg"; // Stack.dc.html `id-prefix="pg"`

const layerFromHash = (hash: string) => {
  const m = /^#layer-([1-4])$/.exec(hash);
  return m ? Number(m[1]) : null;
};

export function StackDiagram({ realProof }: { realProof: boolean[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const openFromHash = useCallback(() => {
    const n = layerFromHash(window.location.hash);
    if (!n) return;
    setOpen((o) => ({ ...o, [n]: true }));
    // Scroll once the panel is laid out.
    requestAnimationFrame(() => document.getElementById(`layer-${n}`)?.scrollIntoView({ block: "start" }));
  }, []);

  useEffect(() => {
    // A direct load of /stack#layer-N: open it after hydration (a frame later, outside the effect body).
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [openFromHash]);

  return (
    <div className="flex flex-col font-sans text-ink">
      <section
        aria-labelledby={`${ID}-judgment`}
        className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 rounded-2xl bg-ink px-9 py-8 text-paper max-[640px]:px-5 max-[640px]:py-[22px]"
      >
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[10px]">
          <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-judg-label">{stackJudgment.eyebrow}</p>
          <h2
            id={`${ID}-judgment`}
            className="m-0 font-serif text-[34px] font-normal leading-[1.12] tracking-[-0.01em] max-[640px]:text-[26px]"
          >
            {stackJudgment.title}
          </h2>
          <p className="m-0 font-serif text-[20px] leading-[1.45] text-judg-body max-[640px]:text-[17px]">{stackJudgment.body}</p>
        </div>
        <ul aria-label={stackJudgment.pillsLabel} className="m-0 flex list-none flex-wrap gap-2 p-0">
          {stackJudgment.pills.map((p) => (
            <li key={p} className="rounded-full border border-judg-pill px-3 py-[6px] font-mono text-[13px]">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <div aria-hidden="true" className="flex h-10 items-center gap-3 pl-[51px] max-[640px]:pl-[34px]">
        <span className="block h-10 w-px bg-stack-rail" />
        <span className="font-mono text-[12px] text-muted">{stackJudgment.rail}</span>
      </div>

      <ol aria-label={stackLabels.layers} className="m-0 list-none overflow-hidden rounded-2xl border border-rule bg-paper p-0">
        {stackLayers.map((l, i) => {
          const n = i + 1;
          const isOpen = !!open[n];
          return (
            <Layer
              key={l.num}
              layer={l}
              n={n}
              first={i === 0}
              open={isOpen}
              realProof={realProof[i] ?? false}
              toggle={() => setOpen((o) => ({ ...o, [n]: !o[n] }))}
            />
          );
        })}
      </ol>
    </div>
  );
}

function Layer({
  layer: l,
  n,
  first,
  open,
  realProof,
  toggle,
}: {
  layer: StackLayer;
  n: number;
  first: boolean;
  open: boolean;
  realProof: boolean;
  toggle: () => void;
}) {
  const btnId = `${ID}-layer-${n}`;
  const panelId = `${btnId}-panel`;
  return (
    <li id={`layer-${n}`} className={`bg-paper ${first ? "" : "border-t border-rule"}`}>
      <h3 className="m-0 [font-size:inherit] [font-weight:inherit]">
        <button
          type="button"
          id={btnId}
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group grid min-h-16 w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 border-0 bg-transparent px-7 py-[22px] text-left font-sans text-ink max-[640px]:grid-cols-[32px_minmax(0,1fr)_auto] max-[640px]:p-4"
        >
          <span
            aria-hidden="true"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border font-mono text-[12px] max-[640px]:h-8 max-[640px]:w-8 ${
              open ? "border-ink bg-ink text-paper" : "border-rule bg-paper text-muted"
            }`}
          >
            {l.num}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
              <span className="font-serif text-[26px] leading-[1.2] max-[640px]:text-[21px]">{l.name}</span>
            </span>
            <span className="text-[15px] leading-[1.45] text-muted max-[640px]:text-[14px]">{l.summary}</span>
          </span>
          <span className="inline-flex items-center gap-2 justify-self-end whitespace-nowrap font-mono text-[13px] text-accent">
            <span className="[@media(hover:hover)]:group-hover:underline max-[640px]:hidden">
              {open ? "Close" : "Open"}
            </span>
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[15px] leading-none ${
                open ? "border-accent" : "border-rule"
              }`}
            >
              {open ? "−" : "+"}
            </span>
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-x-8 gap-y-5 pt-1 pr-7 pb-7 pl-[88px] max-[760px]:grid-cols-[minmax(0,1fr)] max-[640px]:pr-4 max-[640px]:pb-5 max-[640px]:pl-4"
      >
        <div className="flex flex-col gap-[10px]">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted">{stackLabels.tools}</span>
          <ul className="m-0 flex list-none flex-wrap gap-[6px] p-0">
            {l.tools.map((t) => (
              <li key={t} className="rounded-md border border-rule bg-bg px-[10px] py-1 font-mono text-[12px] text-ink">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-[10px]">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted">{stackLabels.how}</span>
          <p className="m-0 text-[15px] leading-[1.55]">{l.how}</p>
          <p className="m-0 text-[14px] leading-[1.5] text-amber-text">
            <span className="font-mono text-[11px] tracking-[0.06em]">{stackLabels.call}</span>
            {l.call}
          </p>
        </div>
        <ProofCard layer={l} real={realProof} />
      </div>
    </li>
  );
}

function ProofCard({ layer: l, real }: { layer: StackLayer; real: boolean }) {
  const className = "flex flex-col gap-2 rounded-xl border border-rule bg-bg p-4 text-ink no-underline";
  const body = (
    <>
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
        {stackLabels.proof}
        {l.proof.kind}
      </span>
      <span className="text-[16px] font-semibold leading-[1.35]">{l.proof.title}</span>
      <span className="text-[14px] leading-[1.5] text-muted">{l.proof.body}</span>
      {real && <span className="mt-1 font-mono text-[13px] text-accent">{l.proof.cta}</span>}
    </>
  );
  if (!real) return <div className={className}>{body}</div>;
  return l.proof.href.startsWith("/") ? (
    <Link href={l.proof.href} className={className}>
      {body}
    </Link>
  ) : (
    <a href={l.proof.href} className={className}>
      {body}
    </a>
  );
}
