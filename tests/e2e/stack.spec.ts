import { expect, test, type Page } from "./fixtures";

// /stack (design update 11, STACK-HANDOFF.md §2.3, §4–6): accordion keyboard use, several layers open,
// #layer-N deep links, no horizontal scroll down to 320px, and the homepage strip link.
const layer = (page: Page, n: number) => page.locator(`#pg-layer-${n}`);
const panel = (page: Page, n: number) => page.locator(`#pg-layer-${n}-panel`);

for (const width of [1440, 390]) {
  test.describe(`/stack at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("all layers start closed; Enter and Space toggle; several stay open", async ({ page }) => {
      await page.goto("/stack");
      for (const n of [1, 2, 3, 4]) {
        await expect(layer(page, n)).toHaveAttribute("aria-expanded", "false");
        await expect(panel(page, n)).toBeHidden();
      }
      await layer(page, 1).focus();
      await page.keyboard.press("Enter");
      await expect(layer(page, 1)).toHaveAttribute("aria-expanded", "true");
      await expect(panel(page, 1)).toBeVisible();
      await expect(layer(page, 1)).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(layer(page, 2)).toBeFocused();
      await page.keyboard.press("Space");
      await expect(layer(page, 2)).toHaveAttribute("aria-expanded", "true");
      // Not a strict accordion: layer 1 stays open.
      await expect(layer(page, 1)).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Space");
      await expect(layer(page, 2)).toHaveAttribute("aria-expanded", "false");
      await expect(panel(page, 2)).toBeHidden();
    });

    test("each panel is a region labelled by its button, inside an h3", async ({ page }) => {
      await page.goto("/stack");
      await layer(page, 3).click();
      const region = page.getByRole("region", { name: /Building & communicating/ });
      await expect(region).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: /Building & communicating/ })).toBeVisible();
      await expect(region.getByRole("link", { name: /Try the fit check →/ })).toHaveAttribute("href", "/#fit-h");
    });

    test("placeholder links never render", async ({ page }) => {
      await page.goto("/stack");
      for (const n of [1, 2, 3, 4]) await layer(page, n).click();
      // The Footer keeps its own contact placeholders in e2e (playwright.config.ts); /stack's own content has none.
      await expect(page.locator("main").getByText(/\[[^\]]*\]/)).toHaveCount(0);
      await expect(page.locator('main a[href="#"]')).toHaveCount(0);
      // Layers 01 and 02 have no real proof link yet: plain boxes with no CTA line.
      await expect(panel(page, 1).getByRole("link")).toHaveCount(0);
      await expect(panel(page, 1).getByText("See the example →")).toHaveCount(0);
      // For now the LinkedIn button goes to the profile (Aswin, 2026-11-26).
      await expect(page.getByRole("link", { name: "Read the LinkedIn post" })).toHaveAttribute("href", /linkedin\.com\/in\//);
    });

    test("/stack#layer-3 opens layer 3 and scrolls to it", async ({ page }) => {
      await page.goto("/stack#layer-3");
      await expect(layer(page, 3)).toHaveAttribute("aria-expanded", "true");
      await expect(layer(page, 1)).toHaveAttribute("aria-expanded", "false");
      await expect(layer(page, 3)).toBeInViewport();
    });
  });
}

for (const width of [1440, 1024, 768, 640, 390, 320]) {
  test(`/stack has no horizontal scroll at ${width}px, all layers open`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/stack");
    for (const n of [1, 2, 3, 4]) await layer(page, n).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}

test("the Stack nav item marks /stack as current", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/stack");
  const nav = page.getByRole("navigation", { name: "Main" }).first();
  await expect(nav.getByRole("link", { name: "Stack" })).toHaveAttribute("aria-current", "page");
  await expect(page).toHaveTitle("My AI-powered operating stack — Aswin");
});

for (const width of [1440, 390]) {
  test(`the homepage strip at ${width}px is one link to /stack`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const strip = page.getByRole("region", { name: "Operating stack" });
    await expect(strip.getByRole("link")).toHaveCount(1);
    const link = strip.getByRole("link");
    await expect(link).toHaveAccessibleName(/I run on an AI-powered operating stack\. See how I work, layer by layer/);
    if (width === 390) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(76);
    await link.click();
    await expect(page).toHaveURL(/\/stack$/);
  });
}

test("/stack.md is the page as markdown", async ({ request }) => {
  const res = await request.get("/stack.md");
  expect(res.headers()["content-type"]).toContain("text/markdown");
  const md = await res.text();
  expect(md).toContain("# My AI-powered operating stack");
  expect(md).toContain("### 04 · Automation");
  expect(md).not.toMatch(/\[link/);
});
