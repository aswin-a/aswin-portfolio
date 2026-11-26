"use client";

import Link from "next/link";
import { useState } from "react";
import { ComingSoonLink } from "@/components/coming-soon";
import type { FlowStep } from "@/content/products";

/** A card link, already resolved on the server. `soon`: it goes to a hidden case study. */
export type CardLink = { label: string; href: string; soon: boolean };
export type PhoneProduct = {
  num: string;
  name: string;
  pitch: string;
  built: string;
  flow: FlowStep[];
  primary?: CardLink;
  secondary?: CardLink;
};

const LINK = "inline-flex min-h-10 items-center font-mono text-[13px] text-accent no-underline";

function CardA({ l }: { l: CardLink }) {
  if (l.soon) return <ComingSoonLink label={l.label} className="min-h-10 font-mono text-[13px]" />;
  if (l.href.startsWith("/")) return <Link href={l.href} className={LINK}>{l.label}</Link>;
  return <a href={l.href} className={LINK}>{l.label}</a>;
}

/**
 * "Products I've built" below 640px (Mobile.dc.html, design update 9): expandable cards, one open at a
 * time, all closed at first. Open, a card adds "HOW IT WORKS" (the desktop stepper) and "WHAT I BUILT".
 */
export function ProductCards({ items, nameLevel = 3 }: { items: PhoneProduct[]; nameLevel?: 2 | 3 }) {
  const [openWork, setOpenWork] = useState(-1);
  const Name = nameLevel === 2 ? "h2" : "h3";
  return (
    <>
      {items.map((p, wi) => {
        const open = openWork === wi;
        const panel = `m-work-panel-${wi}`;
        return (
          <article
            key={p.num}
            className={`flex flex-col gap-[10px] rounded-xl border bg-paper p-4 ${open ? "border-accent" : "border-rule"}`}
          >
            <div className="flex items-center justify-between gap-[10px]">
              <span className="font-mono text-[12px] text-muted">{p.num}</span>
              <button
                type="button"
                onClick={() => setOpenWork((cur) => (cur === wi ? -1 : wi))}
                aria-expanded={open}
                aria-controls={panel}
                className="min-h-9 cursor-pointer border-0 bg-transparent px-0 py-1 font-mono text-[13px] text-accent"
              >
                {open ? "Collapse ↑" : "Expand ↓"}
              </button>
            </div>
            <Name className="m-0 text-[18px] font-semibold leading-[1.3]">{p.name}</Name>
            <p className="m-0 text-[15px] leading-[1.5] text-muted">{p.pitch}</p>
            {(p.primary || p.secondary) && (
              <div className="flex flex-wrap gap-x-[18px] gap-y-1">
                {p.primary && <CardA l={p.primary} />}
                {p.secondary && <CardA l={p.secondary} />}
              </div>
            )}
            <div id={panel} hidden={!open} className={open ? "flex flex-col gap-3 border-t border-rule pt-3" : "hidden"}>
              <span className="font-mono text-[11px] tracking-[0.06em] text-muted">HOW IT WORKS</span>
              <ol className="m-0 flex list-none flex-col p-0">
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
              <p className="m-0 text-[14px] leading-[1.5]">
                <span className="font-mono text-[11px] tracking-[0.06em] text-muted">WHAT I BUILT </span>
                {p.built}
              </p>
            </div>
          </article>
        );
      })}
    </>
  );
}
