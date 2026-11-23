"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useShowIntro, useSite } from "@/components/xray-provider";

export type NavCurrent = "home" | "work" | "log" | "about";

const LINKS: { id: NavCurrent; label: string; href: string }[] = [
  { id: "work", label: "Case studies", href: "/work" },
  { id: "log", label: "Build log", href: "/log" },
  { id: "about", label: "CV", href: "/about" },
];

/**
 * "Contact" (Nav.dc.html, design update 7): smooth-scrolls to the shared Footer's #contact on the
 * current page; a jump under prefers-reduced-motion. Without the element it falls back to the link.
 */
function scrollToContact(e: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById("contact");
  if (!el) return;
  e.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** Header from Nav.dc.html. */
export function Nav({ current }: { current: NavCurrent }) {
  const { xray, toggleXray, openAsk } = useSite();
  // The design passes isNew only on the home page.
  const introShowing = useShowIntro();
  const showNew = current === "home" && introShowing;

  // The header is sticky (Aswin's request). Its height changes as it wraps, so publish it
  // as --nav-h for scroll-padding-top and the case-study rail's sticky offset.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--nav-h", `${el.getBoundingClientRect().height}px`);
    set();
    // A direct load of /#contact jumps before --nav-h exists; align it again now that it does.
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ block: "start" });
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-h");
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 box-border w-full border-b border-rule bg-bg font-sans text-ink">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-6 py-[14px]"
      >
        <Link href="/" className="flex min-h-11 items-center gap-[10px] text-ink no-underline">
          <span className="font-serif text-[24px] tracking-[-0.01em]">Aswin</span>
          <span className="font-mono text-[12px] text-muted">pm · builds for agents</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1">
          {LINKS.map((l) => {
            const on = l.id === current;
            return (
              <Link
                key={l.id}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-[15px] no-underline ${
                  on ? "border-ink text-ink" : "border-transparent text-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <a
            href="#contact"
            onClick={scrollToContact}
            className="inline-flex min-h-11 items-center border-b-2 border-transparent text-[15px] text-muted no-underline"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={toggleXray}
            aria-pressed={xray}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-[10px] rounded-full border px-3 py-[6px] font-mono text-[13px] ${
              xray ? "border-xr-bg bg-xr-bg text-xr-ink" : "border-rule bg-paper text-ink"
            }`}
          >
            <span
              className={`relative inline-block h-[18px] w-[30px] rounded-full ${xray ? "bg-xr-accent" : "bg-rule"}`}
            >
              <span
                className={`absolute top-[2px] h-[14px] w-[14px] rounded-full ${
                  xray ? "left-[14px] bg-bg" : "left-[2px] bg-paper"
                }`}
              />
            </span>
            X-ray
            {showNew && (
              <span className="rounded-full bg-accent px-[6px] py-px text-[10px] tracking-[0.06em] text-paper">
                NEW
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => openAsk()}
            className="inline-flex min-h-11 cursor-pointer items-center gap-[10px] rounded-[10px] border-0 bg-btn-bg px-[14px] py-[6px] font-sans text-[14px] font-semibold text-btn-ink"
          >
            Ask my work <span className="font-mono text-[12px] font-normal opacity-75">⌘K</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
