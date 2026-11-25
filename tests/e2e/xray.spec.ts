import { expect, test } from "@playwright/test";

const toggle = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^X-ray/ });
/** "xray" while X-ray is on (the head script and the toggle set `data-xray`), else null. */
const theme = async (page: import("@playwright/test").Page) =>
  (await page.locator("html").getAttribute("data-xray")) === null ? null : "xray";
const LIGHT_BG = "rgb(246, 243, 236)";

test("toggles X-ray and aria-pressed; the page stays light and the toggle shows the state (update 3)", async ({ page }) => {
  await page.goto("/about");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(toggle(page)).toHaveCSS("background-color", "rgb(255, 253, 248)");
  expect(await theme(page)).toBeNull();
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  expect(await theme(page)).toBe("xray");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /./);
  await expect(page.locator("body")).toHaveCSS("background-color", LIGHT_BG);
  await expect(page.locator("header").first()).toHaveCSS("background-color", LIGHT_BG);
  await expect(toggle(page)).toHaveCSS("background-color", "rgb(16, 18, 20)");
  await expect(toggle(page)).toHaveCSS("color", "rgb(233, 230, 223)");
  await expect(toggle(page)).toHaveCSS("border-top-color", "rgb(16, 18, 20)");
  const track = toggle(page).locator("span").first();
  await expect(track).toHaveCSS("background-color", "rgb(141, 187, 242)");
  await expect(track.locator("span")).toHaveCSS("left", "14px");
  await expect(track.locator("span")).toHaveCSS("background-color", LIGHT_BG);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  expect(await theme(page)).toBeNull();
});

test("X-ray persists across navigation and reloads", async ({ page }) => {
  await page.goto("/");
  await toggle(page).click();
  await page.getByRole("link", { name: "Build log" }).click();
  await expect(page).toHaveURL(/\/log$/);
  expect(await theme(page)).toBe("xray");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  expect(await theme(page)).toBe("xray");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("?xray=1 turns X-ray on before first paint and sticks", async ({ page }) => {
  await page.goto("/about?xray=1");
  expect(await theme(page)).toBe("xray");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.goto("/log");
  expect(await theme(page)).toBe("xray");
});

test("current page link is marked, including case studies", async ({ page }) => {
  await page.goto("/work/integration-builder");
  const main = page.getByRole("navigation", { name: "Main" });
  await expect(main.getByRole("link", { name: "Case studies" })).toHaveAttribute("aria-current", "page");
  await expect(main.getByRole("link", { name: "CV", exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("unknown case study slug is a 404", async ({ page }) => {
  const res = await page.goto("/work/nope");
  expect(res?.status()).toBe(404);
});

test.describe("intro banner", () => {
  const banner = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "About X-ray mode" });

  test("shows with a NEW pill on home only, and 'Got it' dismisses it for good", async ({ page }) => {
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    await expect(toggle(page)).toContainText("NEW");
    await page.goto("/about");
    await expect(banner(page)).toHaveCount(0);
    await expect(toggle(page)).not.toContainText("NEW");
    await page.goto("/");
    await banner(page).getByRole("button", { name: "Got it" }).click();
    await expect(banner(page)).toHaveCount(0);
    await expect(toggle(page)).not.toContainText("NEW");
    await page.reload();
    await expect(page.locator("main")).toBeAttached();
    await expect(banner(page)).toHaveCount(0);
  });

  test("'Turn on X-ray' turns X-ray on and hides the banner", async ({ page }) => {
    await page.goto("/");
    await banner(page).getByRole("button", { name: "Turn on X-ray" }).click();
    expect(await theme(page)).toBe("xray");
    await expect(banner(page)).toHaveCount(0);
    // Turning X-ray off again does not bring the banner back (it was seen).
    await toggle(page).click();
    await expect(banner(page)).toHaveCount(0);
  });

  test("is desktop only: below 640px the dock hint replaces it (design update 9)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(banner(page)).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "New: X-ray." })).toBeVisible();
  });

  test("uses the desktop copy at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(
      banner(page).getByText(
        "It shows how the AI works in the fit check, Ask my work and the case studies: the sources, guardrails, live traces, cost and eval results behind each answer.",
      ),
    ).toBeVisible();
  });
});

test("footer line is on every page", async ({ page }) => {
  for (const path of ["/", "/work", "/work/integration-builder", "/log", "/about"]) {
    await page.goto(path);
    await expect(page.getByText("This site is an AI product. Turn on X-ray to see how it works.")).toBeVisible();
  }
});
