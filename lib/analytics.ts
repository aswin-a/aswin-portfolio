import type { PostHog } from "posthog-js";

/**
 * Product analytics (SPEC §2, §13): PostHog, cookieless. Loaded by instrumentation-client.ts only when
 * NEXT_PUBLIC_POSTHOG_KEY is set, and only once the page is idle: posthog-js is a separate chunk, so it is
 * never in the first-load bundle (Lighthouse, SPEC §14.8). Events tracked before it loads are queued. Every event's props are enums, booleans or nothing,
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

let client: PostHog | null = null;
let loading: Promise<void> | null = null;
const queue: { event: string; props: object }[] = [];
const QUEUE_MAX = 50;

/** Loads and initialises PostHog once (no-op without a key), then sends the queued events. */
export function loadAnalytics(): Promise<void> {
  if (!POSTHOG_KEY || typeof window === "undefined") return Promise.resolve();
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, POSTHOG_OPTIONS);
      client = posthog;
      for (const { event, props } of queue.splice(0)) posthog.capture(event, props);
    })
    .catch(() => {
      // Analytics never breaks the page.
    });
  return loading;
}

export function track<E extends keyof AnalyticsEvents>(event: E, props: AnalyticsEvents[E]): void {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  try {
    if (client) client.capture(event, props);
    else if (queue.length < QUEUE_MAX) queue.push({ event, props });
  } catch {
    // Analytics never breaks the page.
  }
}
