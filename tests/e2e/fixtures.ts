import { test as base } from "@playwright/test";
import { createHash } from "node:crypto";

/**
 * Every test is its own visitor: /api/run rate-limits by hashed IP (SPEC §10), so each test sends a
 * distinct X-Forwarded-For. The e2e server runs the real endpoint under AI_FAKE (playwright.config.ts).
 */
export const test = base.extend({
  page: async ({ page }, provide, testInfo) => {
    const h = createHash("sha256").update(testInfo.testId + testInfo.retry).digest();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.18.${h[0]}.${h[1]}` });
    await provide(page);
  },
});

export { expect, type Locator, type Page } from "@playwright/test";

/** Markers the AI_FAKE server honours (lib/ai/fake.ts, lib/run/hooks.ts). */
export const FAKE = {
  error: "[[fake:error]]",
  limited: "[[fake:limited]]",
  budget: "[[fake:budget]]",
  hold: "[[fake:hold]]",
} as const;

/** The JD textarea's label (Hero.dc.html, 2026-11-18). */
export const JD_LABEL = "Paste a job description. This site will tell you honestly where I fit and where I don't.";
