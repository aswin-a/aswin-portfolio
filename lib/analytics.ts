import posthog from "posthog-js";

/**
 * Product analytics (SPEC §2, §13): PostHog, cookieless. Initialised in instrumentation-client.ts
 * only when NEXT_PUBLIC_POSTHOG_KEY is set. Every event's props are enums, booleans or nothing,
 * so a pasted JD, a question or a contact message can never be sent (CLAUDE.md: never stored or logged).
 */
export type AnalyticsEvents = {
  fit_check_run: { branch: "link" | "text"; outcome: "result" | "badfit" | "error" | "limited" | "budget" };
  ask_opened: { page: "home" | "work" | "log" | "about" };
  ask_question_sent: Record<string, never>;
  xray_toggled: { on: boolean };
  contact_whatsapp_click: Record<string, never>;
  contact_call_click: Record<string, never>;
  contact_submit: { outcome: "sent" | "invalid" | "error" | "limited"; contact_prefilled_role: boolean };
};

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";

/** The init options: no cookies or storage, no autocapture, no recordings, no surveys or flags. */
export const POSTHOG_OPTIONS = {
  api_host: POSTHOG_HOST,
  cookieless_mode: "always",
  persistence: "memory",
  autocapture: false,
  capture_pageview: "history_change",
  capture_pageleave: true,
  capture_heatmaps: false,
  capture_dead_clicks: false,
  capture_exceptions: false,
  rageclick: false,
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  person_profiles: "never",
  mask_all_text: true,
  mask_all_element_attributes: true,
} as const;

export function track<E extends keyof AnalyticsEvents>(event: E, props: AnalyticsEvents[E]): void {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics never breaks the page.
  }
}
