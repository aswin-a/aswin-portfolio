"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { NavCurrent } from "@/components/nav";
import { useSite } from "@/components/xray-provider";

// The current page's row shows • in place of its mark (StackMobile.dc.html; every page, Aswin, 2026-11-26).
const ROWS: { id: NavCurrent | "contact"; label: string; href: string; mark: string }[] = [
  { id: "work", label: "Case studies", href: "/work", mark: "→" },
  { id: "stack", label: "Stack", href: "/stack", mark: "→" }, // design update 11
  { id: "log", label: "Build log", href: "/log", mark: "→" },
  { id: "about", label: "CV", href: "/about", mark: "→" },
  { id: "contact", label: "Contact", href: "#contact", mark: "↓" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The phone header (Mobile.dc.html / MobileNavStates.dc.html, design update 9): a 52px sticky bar with
 * "Menu ☰" / "Close ✕" and the menu panel (#m-menu) with the links and the X-ray switch. Shown below
 * 640px on every page (Aswin, 2026-11-25). The menu traps focus while open and closes on Escape,
 * on any row and on route change (SPEC §5).
 */
export function MobileNav({ current, headerRef }: { current: NavCurrent; headerRef: RefObject<HTMLElement | null> }) {
  const { xray, toggleXray, menuOpen: open, setMenuOpen } = useSite();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The open state lives in the provider (the dock hides while it's open); a route change closes it.
  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !header) return;
      // Focus stays inside the bar and the menu: Menu/Close, the rows, the switch, and the home link.
      const items = Array.from(header.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !header.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !header.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, headerRef]);

  // Resizing across 640px closes the menu (Nav.dc.html, design update 12).
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(width < 640px)");
    const onChange = () => close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, close]);

  const onRow = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    close();
    if (id !== "contact") return;
    const el = document.getElementById("contact");
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
    <header
      ref={headerRef}
      className="sticky top-0 z-30 hidden border-b border-rule bg-bg font-sans text-ink max-[640px]:block"
    >
      <nav aria-label="Main" className="flex h-[52px] items-center justify-between pr-2 pl-5">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-ink no-underline">
          <span className="font-serif text-[21px] tracking-[-0.01em]">Aswin</span>
          <span className="font-mono text-[11px] text-muted">pm · builds for agents</span>
        </Link>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen(!open)}
          aria-expanded={open}
          aria-controls="m-menu"
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-2 border-0 bg-transparent px-3 font-mono text-[13px] text-ink"
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden="true" className="text-[16px]">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </nav>
      {open && (
        <div
          id="m-menu"
          className="absolute top-[52px] right-0 left-0 flex flex-col border-b border-rule bg-bg px-5 pt-1 pb-5 [box-shadow:var(--menu-shadow)]"
        >
          {ROWS.map((r) => {
            const props = {
              onClick: onRow(r.id),
              "aria-current": r.id === current ? ("page" as const) : undefined,
              className:
                "flex min-h-[52px] items-center justify-between border-b border-rule text-[18px] text-ink no-underline",
            };
            const body = (
              <>
                {r.label}
                <span aria-hidden="true" className="font-mono text-[13px] text-muted">
                  {r.id === current ? "•" : r.mark}
                </span>
              </>
            );
            return r.id === "contact" ? (
              <a key={r.id} href={r.href} {...props}>
                {body}
              </a>
            ) : (
              <Link key={r.id} href={r.href} {...props}>
                {body}
              </Link>
            );
          })}
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex flex-col gap-[2px]">
              <span className="text-[16px] font-semibold">X-ray</span>
              <span className="text-[13px] leading-[1.45] text-muted">Shows how the AI works: sources, guardrails, cost.</span>
            </div>
            <button
              type="button"
              onClick={toggleXray}
              role="switch"
              aria-checked={xray}
              aria-label="X-ray"
              className={`relative h-8 w-[52px] flex-none cursor-pointer rounded-full border-0 p-0 ${xray ? "bg-accent" : "bg-rule"}`}
            >
              <span className={`absolute top-[3px] h-[26px] w-[26px] rounded-full bg-paper ${xray ? "left-[23px]" : "left-[3px]"}`} />
            </button>
          </div>
        </div>
      )}
    </header>
    {/* Behind the open menu: a scrim over the page, under the header (design update 10). A tap closes the menu. */}
    {open && (
      <div aria-hidden="true" onClick={close} className="fixed inset-0 z-20 hidden bg-[var(--menu-scrim)] max-[640px]:block" />
    )}
    </>
  );
}
