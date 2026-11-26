import { test as base, type Page, type Response } from "@playwright/test";
import { createHash } from "node:crypto";

/**
 * Waits until React has hydrated an HTML page (XrayProvider sets html[data-hydrated] once every
 * component's effects have run). page.goto resolves on "load", which can come before hydration, and a
 * key press or click in that gap hits a page with no listeners yet (the ⌘K tests failed this way in CI).
 */
async function waitForHydration(page: Page, res: Response | null) {
  if (!res || !(res.headers()["content-type"] ?? "").includes("text/html")) return;
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/**
 * Every test is its own visitor: /api/run rate-limits by hashed IP (SPEC §10), so each test sends a
 * distinct X-Forwarded-For. The e2e server runs the real endpoint under AI_FAKE (playwright.config.ts).
 * Every full navigation (goto, reload) also waits for hydration, so no test acts on a dead page.
 */
export const test = base.extend({
  page: async ({ page }, provide, testInfo) => {
    const h = createHash("sha256").update(testInfo.testId + testInfo.retry).digest();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.18.${h[0]}.${h[1]}` });
    const goto = page.goto.bind(page);
    page.goto = async (...args: Parameters<Page["goto"]>) => {
      const res = await goto(...args);
      await waitForHydration(page, res);
      return res;
    };
    const reload = page.reload.bind(page);
    page.reload = async (...args: Parameters<Page["reload"]>) => {
      const res = await reload(...args);
      await waitForHydration(page, res);
      return res;
    };
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
  blocked: "[[fake:blocked]]",
} as const;

/** The JD textarea's label (Hero.dc.html, 2026-11-18). */
export const JD_LABEL = "Paste a job description. This site will tell you honestly where I fit and where I don't.";
