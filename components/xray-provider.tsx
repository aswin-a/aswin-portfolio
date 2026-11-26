"use client";

import { track } from "@/lib/analytics";
import { askPageFor } from "@/lib/ask/copy";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AskDialog, type AskOpenOptions } from "@/components/ask/ask-dialog";
import { MobileDock } from "@/components/mobile-dock";
import { makeFlagStore } from "@/lib/flag-store";
import { applyXray, INTRO_KEY, XRAY_KEY } from "@/lib/xray";

// X-ray lives in sessionStorage; the intro banner's dismissal in localStorage (SPEC §5).
const xrayStore = makeFlagStore(() => window.sessionStorage, XRAY_KEY);
const introStore = makeFlagStore(() => window.localStorage, INTRO_KEY);

type SiteState = {
  xray: boolean;
  /** True once the banner was dismissed or X-ray was turned on. */
  introSeen: boolean;
  setXray: (on: boolean) => void;
  toggleXray: () => void;
  dismissIntro: () => void;
  /**
   * Opens "Ask my work", optionally on a session-memory question (`focus`: gap index, or "q"),
   * or with a topic and a question to ask straight away (the CV page, design update 6).
   */
  openAsk: (options?: AskOpenOptions) => void;
  /** The phone menu (design updates 9 and 10). Open on the page it was opened on, so a route change closes it. */
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

const SiteContext = createContext<SiteState | null>(null);

export function XrayProvider({ children }: { children: ReactNode }) {
  const xray = useSyncExternalStore(xrayStore.subscribe, xrayStore.get, () => false);
  // Server snapshot is "not seen": the banner and the Nav's "NEW" pill are in the server HTML, so a first
  // visit has no layout shift. For a returning visitor THEME_INIT_SCRIPT sets data-intro-seen before first
  // paint and the .intro-only CSS hides them until hydration removes them.
  const introSeen = useSyncExternalStore(introStore.subscribe, introStore.get, () => false);

  const setXray = useCallback((on: boolean) => {
    if (on !== xrayStore.get()) track("xray_toggled", { on });
    xrayStore.set(on);
    introStore.set(true);
    applyXray(on);
  }, []);
  const toggleXray = useCallback(() => setXray(!xrayStore.get()), [setXray]);
  const dismissIntro = useCallback(() => introStore.set(true), []);

  // Ask stays open only on the page it was opened on, so navigating away closes it.
  const pathname = usePathname();
  const [ask, setAsk] = useState<{ path: string; options: AskOpenOptions } | null>(null);
  const askOpen = ask !== null && ask.path === pathname;
  const openAsk = useCallback(
    (options: AskOpenOptions = {}) => {
      track("ask_opened", { page: askPageFor(pathname) });
      setAsk({ path: pathname, options });
    },
    [pathname],
  );
  const closeAsk = useCallback(() => setAsk(null), []);

  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = useCallback((open: boolean) => setMenuPath(open ? pathname : null), [pathname]);

  // ⌘K / Ctrl+K opens Ask from anywhere; Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!askOpen) openAsk();
      } else if (e.key === "Escape" && askOpen) {
        e.preventDefault();
        closeAsk();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [askOpen, openAsk, closeAsk]);

  // Marks the page interactive. This provider wraps the whole app and React runs a parent's effects after
  // its children's, so by now every component's listeners (⌘K above included) are attached. The e2e
  // tests wait for it after each navigation (tests/e2e/fixtures.ts); nothing on the page reads it.
  useEffect(() => {
    document.documentElement.setAttribute("data-hydrated", "");
  }, []);

  const value = useMemo(
    () => ({ xray, introSeen, setXray, toggleXray, dismissIntro, openAsk, menuOpen, setMenuOpen }),
    [xray, introSeen, setXray, toggleXray, dismissIntro, openAsk, menuOpen, setMenuOpen],
  );
  return (
    <SiteContext.Provider value={value}>
      {children}
      {/* Phone dock (design update 9): the hint shows on home only, like the Nav's "NEW" pill.
          Hidden while Ask or the menu is open (design update 10). */}
      {/* Kept mounted while hidden, so focus can return to "Ask my work ↑" when Ask closes. */}
      <MobileDock
          hidden={askOpen || menuOpen}
          xray={xray}
          showHint={pathname === "/" && !introSeen && !xray}
          onToggleXray={toggleXray}
          onDismissHint={dismissIntro}
          onAsk={() => openAsk()}
        />
      {askOpen && <AskDialog {...ask.options} onClose={closeAsk} />}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteState {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <XrayProvider>");
  return ctx;
}

/** The intro banner and the Nav's "NEW" pill share this rule. */
export function useShowIntro(): boolean {
  const { introSeen, xray } = useSite();
  return !introSeen && !xray;
}
