import { loadAnalytics, POSTHOG_KEY } from "@/lib/analytics";

// PostHog, cookieless (SPEC §2). Without a key (local dev, e2e) nothing loads or is sent.
// With a key it loads after the page has loaded and gone idle, so it never delays the first paint.
if (POSTHOG_KEY) {
  const start = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => void loadAnalytics(), { timeout: 4000 });
    else setTimeout(() => void loadAnalytics(), 1500);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
