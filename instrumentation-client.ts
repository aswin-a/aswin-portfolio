import posthog from "posthog-js";
import { POSTHOG_KEY, POSTHOG_OPTIONS } from "@/lib/analytics";

// PostHog, cookieless (SPEC §2). Without a key (local dev, e2e) nothing loads or is sent.
if (POSTHOG_KEY) posthog.init(POSTHOG_KEY, POSTHOG_OPTIONS);
