"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AskDialog, type AskOpenOptions } from "@/components/ask/ask-dialog";
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
};

const SiteContext = createContext<SiteState | null>(null);

export function XrayProvider({ children }: { children: ReactNode }) {
  const xray = useSyncExternalStore(xrayStore.subscribe, xrayStore.get, () => false);
  // Server snapshot is "seen", so the banner never renders on the server or during hydration.
  const introSeen = useSyncExternalStore(introStore.subscribe, introStore.get, () => true);

  const setXray = useCallback((on: boolean) => {
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
  const openAsk = useCallback((options: AskOpenOptions = {}) => setAsk({ path: pathname, options }), [pathname]);
  const closeAsk = useCallback(() => setAsk(null), []);

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

  const value = useMemo(
    () => ({ xray, introSeen, setXray, toggleXray, dismissIntro, openAsk }),
    [xray, introSeen, setXray, toggleXray, dismissIntro, openAsk],
  );
  return (
    <SiteContext.Provider value={value}>
      {children}
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
