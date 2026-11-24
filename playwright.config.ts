import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100" },
  // Visual baselines (M7): reviewed against the artboards, then committed. `pnpm test:e2e:update` rewrites them.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css", maxDiffPixelRatio: 0.002 } },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: {
    // E2E_PREBUILT=1 (CI): .next was already built with this same env, so only start it.
    command: process.env.E2E_PREBUILT ? "pnpm start -p 3100" : "pnpm build && pnpm start -p 3100",
    // The real /api/run with the deterministic fake model; no keys, no network (lib/ai/fake.ts).
    // Empty values override any .env.local, so the e2e server never calls a real service.
    // webServer.env replaces the environment, so keep the rest of it (PATH, HOME, …).
    env: {
      ...(process.env as Record<string, string>),
      AI_FAKE: "1",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      ANTHROPIC_API_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      VERCEL_ENV: "",
      // The contact config shows the design's placeholders in e2e (design update 7).
      CONTACT_PHONE: "",
      CONTACT_PHONE_DISPLAY: "",
      CONTACT_HOURS: "",
      CONTACT_RESPONSE_TIME: "",
    },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
