import { expect, test, type Page } from "./fixtures";

// The "mobile" Playwright project (390×844): the phone layout of design update 9 (Mobile.dc.html,
// MobileNavStates.dc.html, MobileFitStates.dc.html) and the hood accordion of update 8.

const ACCENT = "rgb(31, 76, 134)";
const INK = "rgb(27, 26, 23)";
const MUTED = "rgb(92, 87, 78)";

const theme = async (page: Page) => ((await page.locator("html").getAttribute("data-xray")) === null ? null : "xray");
const header = (page: Page) => page.locator("header").filter({ has: page.getByRole("navigation", { name: "Main" }) });
const menuButton = (page: Page) => header(page).getByRole("button", { name: /^(Menu|Close)/ });
const menu = (page: Page) => page.locator("#m-menu");
const dockXray = (page: Page) => page.getByRole("button", { name: /^X-ray/ });
const dockAsk = (page: Page) => page.getByRole("button", { name: "Ask my work", exact: true });
const hint = (page: Page) => page.getByRole("status").filter({ hasText: "New: X-ray." });
const hero = (page: Page) => page.locator("section").first();

test.describe("phone header and menu", () => {
  test("a 52px sticky bar; the desktop nav and the intro banner are hidden", async ({ page }) => {
    await page.goto("/");
    await expect(header(page)).toHaveCount(1);
    await expect(header(page).getByRole("navigation", { name: "Main" })).toHaveCSS("height", "52px");
    await expect(header(page).getByRole("link", { name: "Aswin pm · builds for agents" })).toHaveAttribute("href", "/");
    await expect(header(page).getByText("Aswin", { exact: true })).toHaveCSS("font-size", "21px");
    await expect(menuButton(page)).toHaveText("Menu☰");
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton(page)).toHaveAttribute("aria-controls", "m-menu");
    const box = (await menuButton(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("link", { name: "Case studies" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "About X-ray mode" })).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect.poll(async () => (await header(page).boundingBox())!.y).toBe(0);
  });

  test("menu rows, the X-ray switch, Escape and focus trap", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await expect(menuButton(page)).toHaveText("Close✕");
    await expect(menuButton(page)).toHaveAttribute("aria-expanded", "true");
    await expect(menu(page)).toHaveCSS("box-shadow", "rgba(27, 26, 23, 0.12) 0px 16px 32px 0px");
    const rows = menu(page).getByRole("link");
    await expect(rows).toHaveText(["Case studies→", "Build log→", "CV→", "Contact↓"]);
    await expect(rows.first()).toHaveCSS("min-height", "52px");
    await expect(rows.first()).toHaveCSS("font-size", "18px");
    await expect(menu(page).getByText("Shows how the AI works: sources, guardrails, cost.")).toBeVisible();

    const sw = menu(page).getByRole("switch", { name: "X-ray" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(sw).toHaveCSS("width", "52px");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(sw).toHaveCSS("background-color", ACCENT);
    expect(await theme(page)).toBe("xray");
    await sw.click();
    expect(await theme(page)).toBeNull();

    // Focus stays in the header while the menu is open.
    await sw.focus();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("header"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(menuButton(page)).toBeFocused();
  });

  test("Contact scrolls to #contact and closes the menu; a link closes it on route change", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await menu(page).getByRole("link", { name: "Contact" }).click();
    await expect(menu(page)).toHaveCount(0);
    await expect(page.locator("#contact")).toBeInViewport();

    await menuButton(page).click();
    await menu(page).getByRole("link", { name: "CV" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(menu(page)).toHaveCount(0);
    await menuButton(page).click();
    await expect(menu(page).getByRole("link", { name: "CV" })).toHaveAttribute("aria-current", "page");
  });

  test("every page has the phone header and dock (Aswin, 2026-11-25)", async ({ page }) => {
    for (const path of ["/work", "/log", "/about", "/work/integration-builder"]) {
      await page.goto(path);
      await expect(menuButton(page)).toBeVisible();
      await expect(dockAsk(page)).toBeVisible();
      await expect(hint(page)).toHaveCount(0); // the hint is home only
    }
  });
});

test.describe("bottom dock", () => {
  test("X-ray toggle says its state; Ask opens the sheet and the dock hides", async ({ page }) => {
    await page.goto("/");
    const bar = dockAsk(page).locator("xpath=..");
    await expect(dockAsk(page)).toHaveText("Ask my work ↑");
    await expect(bar).toHaveCSS("box-shadow", "rgba(16, 18, 20, 0.28) 0px 10px 28px 0px");
    await expect(bar).toHaveCSS("height", "52px");
    await expect(bar).toHaveCSS("max-width", "340px");
    await expect(bar).toHaveCSS("background-color", "rgb(16, 18, 20)");
    await expect(dockXray(page)).toHaveText("X-ray");
    await expect(dockXray(page)).toHaveAttribute("aria-pressed", "false");
    await dockXray(page).click();
    await expect(dockXray(page)).toHaveText("X-ray on");
    await expect(dockXray(page)).toHaveAttribute("aria-pressed", "true");
    expect(await theme(page)).toBe("xray");
    await dockXray(page).click();
    expect(await theme(page)).toBeNull();

    await dockAsk(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(dockAsk(page)).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dockAsk(page)).toBeVisible();
  });

  test("the dock stays in thumb reach while scrolling and never covers the footer", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(async () => Math.round((await dockAsk(page).boundingBox())!.y + 52)).toBe(844 - 16);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = (await page.getByRole("contentinfo").boundingBox())!;
    await expect.poll(async () => (await dockAsk(page).boundingBox())!.y).toBeGreaterThanOrEqual(footer.y + footer.height - 1);
  });

  test("the X-ray hint: Got it dismisses it for good; turning X-ray on hides it", async ({ page }) => {
    await page.goto("/");
    await expect(hint(page)).toHaveText("New: X-ray. Turn it on to see how the AI works here.Got it");
    await expect(hint(page)).toHaveCSS("border-top-color", ACCENT);
    await hint(page).getByRole("button", { name: "Got it" }).click();
    await expect(hint(page)).toHaveCount(0);
    await page.reload();
    await expect(dockAsk(page)).toBeVisible();
    await expect(hint(page)).toBeHidden();

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(hint(page)).toBeVisible();
    await dockXray(page).click();
    await expect(hint(page)).toHaveCount(0);
  });
});

test.describe("compact fit check", () => {
  test("empty: full-width Check fit, samples in one sideways row", async ({ page }) => {
    await page.goto("/");
    await expect(hero(page)).toHaveCSS("padding", "28px 16px 36px");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "32px");
    const check = hero(page).getByRole("button", { name: "Check fit" });
    await expect(check).toHaveCount(1);
    await expect(page.getByLabel(/^Paste a job description/)).toHaveCSS("height", "96px");
    // Full width: as wide as the textarea above it.
    expect((await check.boundingBox())!.width).toBe((await page.getByLabel(/^Paste a job description/).boundingBox())!.width);
    await expect(hero(page).getByText("No JD handy? Try a sample role:", { exact: true })).toBeVisible();
    const row = hero(page).locator("[data-chip-row]").first();
    const chips = row.getByRole("button");
    await expect(chips).toHaveCount(4);
    const ys = await chips.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ys).size).toBe(1);
    expect(await row.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
    await row.evaluate((e) => e.scrollBy(200, 0));
    expect(await row.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test("running steps are a vertical stepper; the result's CTAs are full width", async ({ page }) => {
    await page.goto("/");
    await hero(page).getByRole("button", { name: "Senior Platform PM", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Strong on 4 of 6 requirements." })).toBeVisible();
    const steps = hero(page).locator("ol").first().locator("li");
    await expect(steps).toHaveCount(7);
    await expect(steps.first()).toContainText("Fetching the job post");
    await expect(steps.first()).toContainText("fetch_url · skipped, text was pasted");
    await expect(steps.first().locator("[aria-hidden]").first()).toHaveText("–");
    await expect(steps.first().locator("[aria-hidden]").first()).toHaveCSS("border-top-style", "dashed");
    await expect(steps.nth(1).locator("[aria-hidden]").first()).toHaveText("✓");
    await expect(steps.nth(1).locator("[aria-hidden]").first()).toHaveCSS("width", "22px");
    await expect(steps.nth(1).locator("[aria-hidden]").first()).toHaveCSS("background-color", "rgb(232, 238, 246)");
    await expect(steps.nth(1)).toContainText("Reading the job description");
    await expect(steps.nth(1)).toContainText("jd.parse · 6 requirements");

    await expect(page.getByRole("heading", { name: "Strong on 4 of 6 requirements." })).toHaveCSS("font-size", "28px");
    const talk = hero(page).getByRole("link", { name: "Talk to Aswin about this role" });
    const cv = hero(page).getByRole("link", { name: "See my CV" });
    await expect(cv).toHaveAttribute("href", "/about");
    const w = (await talk.boundingBox())!.width;
    expect((await hero(page).getByRole("button", { name: /^Ask my work/ }).boundingBox())!.width).toBe(w);
    expect((await cv.boundingBox())!.width).toBe(w);
  });

  test("X-ray on: Break my AI has a full-width Run attack and a sideways row of known attacks", async ({ page }) => {
    await page.goto("/");
    await dockXray(page).click();
    const panel = page.locator("#break-my-ai");
    await expect(panel).toHaveCSS("padding", "16px");
    await expect(panel.getByText("Write an attack, or pick one below.")).toHaveCSS("font-size", "16px");
    await expect(panel.getByRole("button", { name: "Run attack" })).toHaveCount(1);
    await expect(panel.getByText("Or try a known attack:", { exact: true })).toBeVisible();
    const row = panel.locator("[data-chip-row]");
    expect(await row.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
    const ys = await row.getByRole("button").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ys).size).toBe(1);
  });
});

test.describe("hood accordion (updates 8 and 9)", () => {
  test("4 groups, the first open, one at a time, keyboard too", async ({ page }) => {
    await page.goto("/");
    const hood = page.locator("#m-hood");
    await expect(hood).toHaveText("How I build agentic products, with proof");
    await expect(page.getByText("12 parts in 4 groups. Open one to see the proof and where to check it.", { exact: true })).toBeVisible();
    const list = hood.locator("xpath=..");
    const headers = list.locator("button[aria-controls]");
    await expect(headers).toHaveCount(4);
    await expect(headers.locator(":scope > span:first-child > span:first-child")).toHaveText([
      "Agent building blocks", "Running it reliably", "Trust and checking", "Data and context",
    ]);
    await expect(headers.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(headers.nth(0)).toContainText("Collapse ↑");
    await expect(headers.nth(1)).toHaveAttribute("aria-expanded", "false");
    await expect(headers.nth(1)).toContainText("Expand ↓");
    await expect(page.locator("#m-hood-panel-0")).toBeVisible();
    await expect(page.locator("#m-hood-panel-1")).toBeHidden();
    await expect(headers.nth(0).locator("xpath=..")).toHaveCSS("border-top-color", ACCENT);
    const dot = (name: string) => list.locator("button span", { hasText: new RegExp(`^${name}$`) }).locator("span[aria-hidden]");
    await expect(dot("tools")).toHaveCSS("background-color", ACCENT);
    await expect(dot("human in loop")).toHaveCSS("background-color", INK);
    await expect(dot("rag")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    await headers.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(headers.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(headers.nth(0)).toHaveAttribute("aria-expanded", "false");
    const panel1 = page.locator("#m-hood-panel-1");
    await expect(panel1.getByRole("link", { name: "Try Break my AI →" })).toHaveAttribute("href", "#break-my-ai");
    await page.keyboard.press("Space");
    for (let i = 0; i < 4; i++) await expect(headers.nth(i)).toHaveAttribute("aria-expanded", "false");

    await headers.nth(3).click();
    const panel3 = page.locator("#m-hood-panel-3");
    await expect(panel3.getByText("Coming soon", { exact: true })).toHaveCSS("color", MUTED);
    await expect(panel3.getByRole("link")).toHaveCount(0);
    await expect(panel3.getByText("COMING SOON", { exact: true })).toHaveCount(2);
    await expect(panel3.getByText("prototype", { exact: true })).toHaveCSS("border-top-style", "solid");
    await expect(panel3.getByText("shipped", { exact: true })).toHaveCSS("color", INK);

    await headers.nth(0).click();
    await page.locator("#m-hood-panel-0").getByRole("link", { name: "See the calls in X-ray →" }).click();
    await expect(page).toHaveURL(/#top$/);
    expect(await theme(page)).toBe("xray");
  });
});

test.describe("product cards (update 9)", () => {
  test("all closed at first, one open at a time, desktop links with the phone arrow", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#m-work").locator("xpath=..");
    await expect(page.locator("#m-work")).toHaveText("Products I've built");
    const cards = section.locator("article");
    await expect(cards).toHaveCount(4);
    const toggles = cards.getByRole("button");
    for (let i = 0; i < 4; i++) {
      await expect(toggles.nth(i)).toHaveText("Expand ↓");
      await expect(toggles.nth(i)).toHaveAttribute("aria-expanded", "false");
    }
    // Status labels are data only now.
    await expect(section.getByText("LIVE HERE", { exact: true })).toHaveCount(0);

    await expect(cards.nth(0).getByRole("heading", { level: 3 })).toHaveText("AI job search and apply agent");
    await expect(cards.nth(0).getByRole("heading", { level: 3 })).toHaveCSS("font-size", "18px");
    await expect(cards.nth(0)).toContainText("Finds roles that fit, tailors my resume to each, and applies only after I say yes.");
    await expect(cards.nth(0).getByRole("link", { name: "Add to Claude/ChatGPT →" })).toHaveAttribute(
      "href",
      "https://github.com/aswin-a/linkedin-job-search-agent",
    );
    await expect(cards.nth(0).getByText("COMING SOON", { exact: true })).toBeVisible();
    await expect(cards.nth(1).getByRole("link", { name: "Try it above ↑" })).toHaveAttribute("href", "#fit-h");
    await expect(cards.nth(2).getByRole("heading", { level: 3 })).toHaveText("AI integration builder");
    await expect(cards.nth(2).getByRole("link", { name: "Run it locally →" })).toBeVisible();

    await toggles.nth(0).click();
    await expect(toggles.nth(0)).toHaveText("Collapse ↑");
    await expect(cards.nth(0)).toHaveCSS("border-top-color", ACCENT);
    await expect(cards.nth(0).getByText("HOW IT WORKS", { exact: true })).toBeVisible();
    await expect(cards.nth(0).locator("ol > li")).toHaveCount(5);
    await expect(cards.nth(0).getByText("Wait for my approval")).toHaveCSS("color", "rgb(138, 85, 16)");
    await expect(cards.nth(0).getByText("WHAT I BUILT", { exact: true })).toBeVisible();

    await toggles.nth(2).click();
    await expect(toggles.nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(cards.nth(0).getByText("HOW IT WORKS", { exact: true })).toBeHidden();
    await expect(toggles.nth(2)).toHaveAttribute("aria-expanded", "true");
    await toggles.nth(2).click();
    await expect(toggles.nth(2)).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Ask sheet and menu scrim (update 10)", () => {
  const sheet = (page: Page) => page.getByRole("dialog", { name: "Ask my work" });
  const handle = (page: Page) => sheet(page).locator("> span[aria-hidden]").first();

  test("the menu dims the page behind it; a tap on the scrim closes it; the dock hides meanwhile", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    const scrim = page.locator("div[aria-hidden].fixed.inset-0");
    await expect(scrim).toBeVisible();
    await expect(scrim).toHaveCSS("background-color", "rgba(27, 26, 23, 0.4)");
    await expect(scrim).toHaveCSS("z-index", "20");
    await expect(dockAsk(page)).toHaveCount(0);
    await page.mouse.click(200, 700);
    await expect(menu(page)).toHaveCount(0);
    await expect(dockAsk(page)).toBeVisible();
  });

  test("the dock opens a bottom sheet: 85dvh, grab handle, scrolls inside, closes on a scrim tap", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
    await dockAsk(page).click();
    const box = (await sheet(page).boundingBox())!;
    expect(Math.round(box.height)).toBe(Math.round(844 * 0.85));
    expect(Math.round(box.y + box.height)).toBe(844);
    await expect(sheet(page)).toHaveCSS("border-top-left-radius", "18px");
    await expect(handle(page)).toHaveCSS("width", "36px");
    await expect(handle(page)).toHaveCSS("height", "4px");
    await expect(handle(page)).toHaveCSS("background-color", "rgb(226, 220, 208)");
    const scroller = sheet(page).locator("[data-ask-scroll]");
    await expect(scroller).toHaveCSS("overflow-y", "auto");
    // The page behind stays where it was.
    expect(await page.evaluate(() => document.body.style.position)).toBe("fixed");
    await page.mouse.click(200, 40);
    await expect(sheet(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
    await expect(dockAsk(page)).toBeFocused();
  });

  test("swipe down closes the sheet; a short drag springs back (Aswin, 2026-11-25)", async ({ page }) => {
    await page.goto("/");
    await dockAsk(page).click();
    const h = (await handle(page).boundingBox())!;
    const x = h.x + h.width / 2, y = h.y + h.height / 2;
    // Short and slow: stays open, back in place.
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x, y + i * 4);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await expect(sheet(page)).toBeVisible();
    await expect.poll(async () => Math.round((await sheet(page).boundingBox())!.y + (await sheet(page).boundingBox())!.height)).toBe(844);
    // Past 25% of its height: closes.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 120, { steps: 6 });
    await page.waitForTimeout(200);
    await page.mouse.move(x, y + 300, { steps: 6 });
    await page.mouse.up();
    await expect(sheet(page)).toHaveCount(0);
  });
});
