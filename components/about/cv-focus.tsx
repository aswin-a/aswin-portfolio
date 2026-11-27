"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CvGroup } from "@/content/cv";
import { isHighlighted, parseCvHash, type CvFocus, type CvTarget } from "@/lib/cv-link";

/**
 * The CV focus mode (About.dc.html, CVFromProof.dc.html, design update 14; SPEC §6.1). A proof or
 * source link opens `/about#cv=…&req=…`; on load and on `hashchange` the page opens the named areas,
 * scrolls to the first target, shows the note on each targeted card, outlines the cards and areas,
 * and highlights the points. Clear removes all of that and strips the hash; opened areas stay open.
 */

type FocusCtx = {
  focus: CvFocus | null;
  open: Record<string, boolean>;
  toggle: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<FocusCtx>({
  focus: null,
  open: {},
  toggle: () => {},
  clear: () => {},
});

const groupKey = (id: string, group: number) => `${id}:${group}`;
const anchorOf = (t: CvTarget) => (t.group !== null ? `cv-${t.id}-g${t.group}` : `cv-${t.id}`);

export function CvFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState<CvFocus | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      const f = parseCvHash(window.location.hash);
      if (!f) return;
      setFocus(f);
      setOpen((o) => {
        const next = { ...o };
        for (const t of f.targets) if (t.group !== null) next[groupKey(t.id, t.group)] = true;
        return next;
      });
      // After the opened areas render (About.dc.html waits 80 ms too).
      clearTimeout(timer);
      timer = setTimeout(() => document.getElementById(anchorOf(f.targets[0]))?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", read);
    };
  }, []);

  const toggle = useCallback((key: string) => setOpen((o) => ({ ...o, [key]: !o[key] })), []);
  const clear = useCallback(() => {
    setFocus(null);
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    } catch {
      // History can be locked down (sandboxed frames); the highlight is cleared either way.
    }
  }, []);

  const value = useMemo(() => ({ focus, open, toggle, clear }), [focus, open, toggle, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const useTargets = (id: string) => {
  const ctx = useContext(Ctx);
  const targets = ctx.focus ? ctx.focus.targets.filter((t) => t.id === id) : [];
  return { ...ctx, targets };
};

/** Point styles from About.dc.html `pt()`: highlighted points keep their text in place. */
const pointClass = (on: boolean) =>
  on ? "-mr-2 -ml-[10px] rounded-[6px] bg-accent-tint py-1 pr-2 pl-[10px] shadow-[inset_3px_0_0_var(--color-accent)]" : "rounded-[6px]";

/** A timeline card: the `#cv-{id}` anchor, a 2px accent outline and the focus note when targeted. */
export function CvCard({ id, bg, border, children }: { id: string; bg: string; border: string; children: ReactNode }) {
  const { targets, focus, clear } = useTargets(id);
  const focused = targets.length > 0;
  return (
    <article
      id={`cv-${id}`}
      className={`ml-[22px] flex scroll-mt-[96px] flex-col gap-[10px] rounded-[14px] px-[22px] py-5 ${bg} ${focused ? "border-2 border-solid border-accent" : border}`}
    >
      {focused && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-[10px] border border-accent bg-accent-tint px-3 py-[10px]"
        >
          <span className="flex flex-col gap-[2px]">
            <span className="font-mono text-[11px] tracking-[0.06em] text-accent">FROM YOUR FIT CHECK</span>
            <span className="text-[15px] leading-[1.45]">{focus?.req || "Evidence for this requirement"}</span>
            <span className="text-[13px] text-muted">The points that back it up are highlighted below.</span>
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label="Clear highlight"
            className="min-h-9 flex-none cursor-pointer rounded-[8px] border border-accent bg-transparent px-[10px] py-0 font-mono text-[12px] text-accent"
          >
            Clear ✕
          </button>
        </div>
      )}
      {children}
    </article>
  );
}

/** A role's or side project's highlight bullets (targets `roleId..itemList`). */
export function CvHighlights({ id, items }: { id: string; items: string[] }) {
  const { targets } = useTargets(id);
  return (
    <ul className="m-0 flex list-disc flex-col gap-[6px] pl-5 text-[15px] leading-[1.5]">
      {items.map((h, i) => (
        <li key={h} className={pointClass(targets.some((t) => t.group === null && t.items.includes(i)))}>
          {h}
        </li>
      ))}
    </ul>
  );
}

/** Zelthy's area cards: each opens on its own and then spans the full row; targeted areas are outlined in 2px accent. */
export function CvGroups({ id, groups }: { id: string; groups: CvGroup[] }) {
  const { targets, open, toggle } = useTargets(id);
  return (
    <div className="flex flex-col gap-[10px] pt-[6px]">
      <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">Pick an area to see everything I did</span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[10px]">
        {groups.map((g, i) => {
          const key = groupKey(id, i);
          const isOpen = !!open[key];
          const gFocus = targets.some((t) => t.group === i);
          return (
            <div
              key={g.name}
              id={`cv-${id}-g${i}`}
              className={`flex scroll-mt-[96px] flex-col rounded-[10px] border-solid bg-bg ${gFocus ? "border-2" : "border"} ${isOpen || gFocus ? "border-accent" : "border-rule"} ${isOpen ? "col-[1/-1]" : ""}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(key)}
                className="flex w-full cursor-pointer items-start justify-between gap-3 border-0 bg-transparent px-4 py-[14px] text-left font-sans text-ink"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">{g.name}</span>
                  <span className="text-[14px] leading-[1.5] text-muted">{g.summary}</span>
                  <span className="font-mono text-[12px] text-accent">
                    {isOpen ? `Hide ${g.items.length} points ↑` : `See all ${g.items.length} points ↓`}
                  </span>
                </span>
                <span aria-hidden="true" className="font-mono text-[16px] leading-[1.2] text-muted">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <ul className="m-0 flex list-disc flex-col gap-[6px] pt-0 pr-4 pb-4 pl-9 text-[14px] leading-[1.55]">
                  {g.items.map((x, xi) => (
                    <li key={x} className={pointClass(gFocus && isHighlighted(targets, i, xi))}>
                      {x}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
