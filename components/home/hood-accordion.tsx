"use client";

import Link from "next/link";
import { useState } from "react";
import { ComingSoonLink } from "@/components/coming-soon";
import { LiveLink } from "@/components/home/live-link";
import type { HoodItem } from "@/content/hood";

/** One part as the phone accordion shows it. `href` is already resolved (`#` for a placeholder). */
export type AccordionItem = HoodItem & { soon: boolean; label: string };
export type AccordionGroup = { name: string; summary: string; items: AccordionItem[] };

/** Phone status pill (Mobile.dc.html): live → accent/tint, shipped → ink, the rest → rule/muted. Never dashed. */
function pillClass(u: HoodItem) {
  if (u.status === "live here") return "border-accent bg-accent-tint text-accent";
  if (u.status === "shipped") return "border-ink bg-transparent text-ink";
  return "border-rule bg-transparent text-muted";
}

/** Chip status dot: filled accent for live here, filled ink for shipped, hollow muted for the rest. */
function dotClass(u: HoodItem) {
  if (u.status === "live here") return "border-accent bg-accent";
  if (u.status === "shipped") return "border-ink bg-ink";
  return "border-muted bg-transparent";
}

const CTA = "self-start inline-flex min-h-[36px] items-center font-mono text-[13px] text-accent no-underline";

function Cta({ u }: { u: AccordionItem }) {
  if (u.soon) return <ComingSoonLink label={u.label} className="min-h-[36px] self-start font-mono text-[13px]" />;
  if (!u.href) return <span className="font-mono text-[13px] text-muted">{u.cta}</span>;
  if (u.live) return <LiveLink href={u.href} className={CTA}>{u.cta}</LiveLink>;
  if (u.href.startsWith("/")) return <Link href={u.href} className={CTA}>{u.cta}</Link>;
  return <a href={u.href} className={CTA}>{u.cta}</a>;
}

/**
 * "How I build agentic products, with proof" below 640px (Mobile.dc.html, design update 8): 4 groups,
 * one open at a time, the first open by default; tapping the open group closes it.
 */
export function HoodAccordion({ groups }: { groups: AccordionGroup[] }) {
  const [openGroup, setOpenGroup] = useState(0);
  return (
    <>
      {groups.map((g, gi) => {
        const open = openGroup === gi;
        const panel = `m-hood-panel-${gi}`;
        return (
          <div key={g.name} className={`flex flex-col rounded-xl border bg-paper ${open ? "border-accent" : "border-rule"}`}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panel}
              onClick={() => setOpenGroup((cur) => (cur === gi ? -1 : gi))}
              className="flex w-full cursor-pointer flex-col gap-2 border-0 bg-transparent px-4 py-[14px] text-left font-sans text-ink"
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className="text-[16px] font-semibold">{g.name}</span>
                <span className="flex-none font-mono text-[12px] text-accent">{open ? "Hide ↑" : `Show ${g.items.length} ↓`}</span>
              </span>
              <span className="text-[14px] leading-[1.45] text-muted">{g.summary}</span>
              <span className="flex flex-wrap gap-[6px]">
                {g.items.map((u) => (
                  <span
                    key={u.name}
                    className="inline-flex items-center gap-[6px] rounded-full border border-rule px-2 py-[3px] font-mono text-[12px] text-ink"
                  >
                    <span aria-hidden="true" className={`box-content h-[6px] w-[6px] rounded-full border ${dotClass(u)}`} />
                    {u.name}
                  </span>
                ))}
              </span>
            </button>
            <ul id={panel} hidden={!open} className={open ? "m-0 flex list-none flex-col px-4 pb-[6px] pt-0" : "hidden"}>
              {g.items.map((u) => (
                <li key={u.name} className="flex flex-col gap-[6px] border-t border-rule py-3">
                  <span className="flex items-center justify-between gap-[10px]">
                    <span className="font-mono text-[14px]">{u.name}</span>
                    <span className={`rounded-full border px-2 py-[2px] font-mono text-[11px] ${pillClass(u)}`}>{u.status}</span>
                  </span>
                  <span className="text-[14px] leading-[1.5]">{u.proof}</span>
                  <Cta u={u} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
