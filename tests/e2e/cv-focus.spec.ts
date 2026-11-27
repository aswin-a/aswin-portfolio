import { expect as baseExpect, test, type Page } from "./fixtures";

/**
 * The CV focus mode (About.dc.html, CVFromProof.dc.html, design update 14; SPEC §6.1) and the
 * proof and source links that open it.
 */
const expect = baseExpect.configure({ timeout: 15_000 });

const PROOF = "/about#cv=zelthy.integrations.1-2&req=Own%20a%20public%20API%20and%20partner%20integrations";
const card = (page: Page, id: string) => page.locator(`#cv-${id}`);
const note = (page: Page, id: string) => card(page, id).getByRole("status");
const highlighted = (page: Page, scope: string) =>
  page.locator(`${scope} li`).evaluateAll((lis) => lis.filter((li) => getComputedStyle(li).boxShadow.includes("inset")).map((li) => li.textContent ?? ""));

test("CV opened from a proof: area open, outlined, two points highlighted, the note with Clear (CVFromProof)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PROOF);
  const zelthy = card(page, "zelthy");
  const area = page.locator("#cv-zelthy-g1");

  await expect(note(page, "zelthy")).toContainText("FROM YOUR FIT CHECK");
  await expect(note(page, "zelthy")).toContainText("Own a public API and partner integrations");
  await expect(note(page, "zelthy")).toContainText("The points that back it up are highlighted below.");
  await expect(area.getByRole("button", { expanded: true })).toBeVisible();
  await expect(area).toBeInViewport();

  await expect(zelthy).toHaveCSS("border-top-width", "2px");
  await expect(zelthy).toHaveCSS("border-top-color", "rgb(31, 76, 134)");
  await expect(area).toHaveCSS("border-top-width", "2px");
  await expect(page.locator("#cv-zelthy-g0")).toHaveCSS("border-top-width", "1px");
  // Only Zelthy carries the note and the outline.
  await expect(page.getByRole("status").filter({ hasText: "FROM YOUR FIT CHECK" })).toHaveCount(1);
  await expect(card(page, "dhees")).toHaveCSS("border-top-width", "1px");

  const lines = await highlighted(page, "#cv-zelthy-g1");
  expect(lines).toHaveLength(2);
  expect(lines[0]).toMatch(/^Built a connector framework/);
  expect(lines[1]).toMatch(/^Led a daily two-way batch sync/);
  const li = area.locator("li").filter({ hasText: "Built a connector framework" });
  await expect(li).toHaveCSS("background-color", "rgb(232, 238, 246)");
  await expect(li).toHaveCSS("padding-left", "10px");
  await expect(li).toHaveCSS("margin-left", "-10px");

  const clear = page.getByRole("button", { name: "Clear highlight" });
  await expect(clear).toHaveText("Clear ✕");
  await expect(clear).toHaveCSS("min-height", "36px");
  await clear.click();
  await expect(page.getByRole("status").filter({ hasText: "FROM YOUR FIT CHECK" })).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe("");
  expect(await highlighted(page, "#cv-zelthy-g1")).toEqual([]);
  await expect(zelthy).toHaveCSS("border-top-width", "1px");
  // Opened areas stay open.
  await expect(area.getByRole("button", { expanded: true })).toBeVisible();
});

test("CV focus follows hashchange: a whole area, a role's highlights, a whole role", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await expect(page.getByRole("status").filter({ hasText: "FROM YOUR FIT CHECK" })).toHaveCount(0);

  // A group with no item list highlights every point in it; an empty req shows the fallback line.
  await page.evaluate(() => (window.location.hash = "#cv=zelthy.leadership+zelthy.releases.2"));
  await expect(note(page, "zelthy")).toContainText("Evidence for this requirement");
  expect(await highlighted(page, "#cv-zelthy-g6")).toHaveLength(2);
  expect(await highlighted(page, "#cv-zelthy-g4")).toHaveLength(1);
  await expect(page.locator("#cv-zelthy-g6")).toBeInViewport();

  await page.evaluate(() => (window.location.hash = "#cv=dhees..1,4&req=Market%20sizing"));
  await expect(note(page, "dhees")).toContainText("Market sizing");
  expect(await highlighted(page, "#cv-dhees")).toEqual(["Sized the Chennai market and wrote the market requirements document", "Generated production plans from sales orders automatically, saving about 1 hour a day"]);

  await page.evaluate(() => (window.location.hash = "#cv=solar"));
  await expect(note(page, "solar")).toBeVisible();
  await expect(card(page, "solar")).toHaveCSS("border-top-width", "2px");
  expect(await highlighted(page, "#cv-solar")).toEqual([]);

  // Unknown ids are ignored.
  await page.evaluate(() => (window.location.hash = "#cv=nobody.1"));
  await expect(note(page, "solar")).toBeVisible();
});

test("fit-check proof links open the exact CV lines", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("section").first().getByRole("button", { name: "Senior Platform PM", exact: true }).click();
  const proof = page.getByRole("link", { name: "CV · Zelthy · Identity, Integrations and Data Sync" }).first();
  await expect(proof).toHaveAttribute("href", PROOF);
  await proof.click();
  await expect(page).toHaveURL(/\/about#cv=zelthy\.integrations\.1-2&req=/);
  await expect(note(page, "zelthy")).toContainText("Own a public API and partner integrations");
  expect(await highlighted(page, "#cv-zelthy-g1")).toHaveLength(2);
});

test("an Ask source on the CV page re-highlights in place", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await page.getByLabel("Ask your own question about Aswin's experience").fill("Has he worked on APIs?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  const src = page.getByRole("dialog").getByRole("link", { name: "CV · Zelthy · Identity, Integrations and Data Sync" });
  await expect(src).toHaveAttribute("href", "/about#cv=zelthy.integrations.1-2&req=Has%20he%20worked%20on%20APIs%3F");
  await src.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(note(page, "zelthy")).toContainText("Has he worked on APIs?");
  expect(await highlighted(page, "#cv-zelthy-g1")).toHaveLength(2);
});

test("footer: real LinkedIn and GitHub links; and the site-repo link", async ({ page }) => {
  await page.goto("/about");
  const contact = page.locator("#contact");
  await expect(contact.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute("href", "https://linkedin.com/in/aswin-a-pm");
  await expect(contact.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/aswin-a");
  await expect(page.getByRole("link", { name: "This site’s code on GitHub →" })).toHaveAttribute("href", "https://github.com/aswin-a/aswin-portfolio");
});
