import { CASE_STUDY_SLUGS } from "@/lib/case-studies";
import { POST_SLUGS } from "@/lib/posts";
import { expect as baseExpect, test, type Locator, type Page } from "./fixtures";

/**
 * Accessibility pass (SPEC §14.8): keyboard reach and the focus style, Ask's focus trap and focus
 * return for every trigger, live regions on streamed output, reduced motion. No axe dependency
 * (not in SPEC §2); Lighthouse's axe-based audit is run by hand against the production build.
 */
const expect = baseExpect.configure({ timeout: 15_000 });

const ROUTES = ["/", "/work", ...CASE_STUDY_SLUGS.map((s) => `/work/${s}`), "/log", ...POST_SLUGS.map((s) => `/log/${s}`), "/about"];

/**
 * Text fields the design draws without an outline (`outline: none` in Hero.dc.html, Ask.dc.html and
 * About.dc.html): the caret and their bordered box mark focus. Everything else shows the design's ring.
 */
const NO_RING_BY_DESIGN = ["jd-input", "break-input", "Ask a question about Aswin's work", "Ask your own question about Aswin's experience"];

const dialog = (page: Page) => page.getByRole("dialog", { name: "Ask my work" });
const hero = (page: Page) => page.locator("section").first();

/** Every element Tab should reach: visible, enabled, not inert, not tabindex=-1. */
async function tabbables(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
      if (el.closest("[inert]")) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === "hidden") return;
      el.dataset.a11yId = String(i);
      out.push(String(i));
    });
    return out;
  });
}

/** The focused element's id (from tabbables) and its outline. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      id: el.dataset.a11yId ?? null,
      name: el.id || el.getAttribute("aria-label") || (el.textContent ?? "").trim().slice(0, 60),
      ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`,
    };
  });
}

test.describe("keyboard", () => {
  for (const path of ROUTES) {
    test(`Tab reaches every control on ${path}, each with the 2px #4F7FC0 ring`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      // Hydrated: the X-ray toggle responds.
      await page.waitForLoadState("networkidle");
      const all = await tabbables(page);
      expect(all.length).toBeGreaterThan(5);
      const reached = new Set<string>();
      const noRing: string[] = [];
      for (let i = 0; i < all.length + 10; i++) {
        await page.keyboard.press("Tab");
        const f = await focused(page);
        if (!f) continue;
        if (f.id) reached.add(f.id);
        if (f.ring !== "solid 2px rgb(79, 127, 192) 2px" && !NO_RING_BY_DESIGN.includes(f.name)) noRing.push(`${f.name}: ${f.ring}`);
      }
      const missed = all.filter((id) => !reached.has(id));
      const missedNames = await Promise.all(
        missed.map((id) => page.locator(`[data-a11y-id="${id}"]`).evaluate((el) => el.outerHTML.slice(0, 120))),
      );
      expect(missedNames).toEqual([]);
      expect(noRing).toEqual([]);
    });
  }

  test("X-ray toggle, filters and the CV cards work from the keyboard", async ({ page }) => {
    await page.goto("/log");
    const toggle = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /^X-ray/ });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-xray", "");
    await page.keyboard.press("Space");
    await expect(page.locator("html")).not.toHaveAttribute("data-xray", "");

    const filter = page.getByRole("button", { name: /^Teardowns/ });
    await filter.focus();
    await page.keyboard.press("Enter");
    await expect(filter).toHaveAttribute("aria-pressed", "true");

    await page.goto("/about");
    const card = page.locator("[aria-expanded]").first();
    await card.focus();
    await expect(card).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(card).toHaveAttribute("aria-expanded", "false");
  });

  test("the before/after toggle switches with the keyboard", async ({ page }) => {
    await page.goto(`/work/${CASE_STUDY_SLUGS[0]}`);
    const group = page.getByRole("group", { name: "Compare" });
    const manual = group.getByRole("button", { name: "Manual" });
    await manual.focus();
    await page.keyboard.press("Enter");
    await expect(manual).toHaveAttribute("aria-pressed", "true");
    const both = group.getByRole("button", { name: "Both" });
    await both.focus();
    await page.keyboard.press("Space");
    await expect(both).toHaveAttribute("aria-pressed", "true");
  });

  test("the contact form can be filled and sent from the keyboard", async ({ page }) => {
    await page.goto("/log");
    const name = page.getByLabel("Name");
    await name.focus();
    await page.keyboard.type("Sam");
    await page.keyboard.press("Tab");
    await page.keyboard.type("sam@example.com");
    // Role, then Message.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Hello from the keyboard.");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText(/Send/);
    await page.keyboard.press("Enter");
    await expect(page.locator("#contact").getByRole("status").first()).toBeVisible();
  });
});

test.describe("Ask: focus trap and focus return for every trigger", () => {
  async function expectTrapAndReturn(page: Page, trigger: Locator, { answers = false } = {}) {
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeVisible();
    // A trigger that asks a question right away (a gap card): wait for the answer, which hands focus back to the input.
    if (answers) await expect(page.getByRole("textbox", { name: "Ask a question about Aswin's work" })).toBeFocused();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press(i % 3 === 0 ? "Shift+Tab" : "Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }

  test("Nav button", async ({ page }) => {
    await page.goto("/work");
    await expectTrapAndReturn(page, page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /^Ask my work/ }));
  });

  test("hero 'Ask my work' and a gap card", async ({ page }) => {
    await page.goto("/");
    await hero(page).getByRole("button", { name: "Senior Platform PM", exact: true }).click();
    const gap = hero(page).getByRole("button", { name: "Ask about this gap →" }).first();
    await expect(gap).toBeVisible();
    await expectTrapAndReturn(page, gap, { answers: true });
    await expectTrapAndReturn(page, hero(page).getByRole("button", { name: /^Ask my work/ }).first());
  });

  test("CV 'Ask about this role →'", async ({ page }) => {
    await page.goto("/about");
    await expectTrapAndReturn(page, page.getByRole("main").getByRole("button", { name: "Ask about this role →" }).first());
  });
});

test.describe("live regions on streamed output", () => {
  test("fit check: the streamed steps and progress are polite status regions; the result heading takes focus", async ({ page }) => {
    await page.goto("/");
    await hero(page).getByRole("button", { name: "Senior Platform PM", exact: true }).click();
    const steps = hero(page).getByRole("status").filter({ hasText: /Agent · (streaming from|done ·)/ });
    await expect(steps).toHaveAttribute("aria-live", "polite");
    await expect(hero(page).getByRole("status").filter({ hasText: "Agent · done · 7 steps from the live run" })).toBeVisible();
    // Live regions are never nested (double announcements).
    expect(await page.locator("[aria-live] [aria-live]").count()).toBe(0);
    await expect(hero(page).getByRole("heading", { level: 2, name: "Strong on 4 of 6 requirements." })).toBeFocused();
  });

  test("Ask: thinking and the answer are polite status regions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /^Ask my work/ }).click();
    await page.getByRole("textbox", { name: "Ask a question about Aswin's work" }).fill("Has he worked on APIs?");
    await page.keyboard.press("Enter");
    const answer = dialog(page).getByRole("status").last();
    await expect(answer).toHaveAttribute("aria-live", "polite");
    await expect(dialog(page).getByRole("button", { name: /Ask another/ })).toBeVisible();
    expect(await page.locator("[aria-live] [aria-live]").count()).toBe(0);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no transitions or animations anywhere", async ({ page }) => {
    for (const path of ["/", "/about", `/work/${CASE_STUDY_SLUGS[0]}`]) {
      await page.goto(path);
      const moving = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("*")]
          .map((el) => getComputedStyle(el))
          .filter((cs) => cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0) || cs.animationName !== "none").length,
      );
      expect(moving, path).toBe(0);
    }
  });

  test("the case study doesn't smooth-scroll; Nav 'Contact' jumps", async ({ page }) => {
    await page.goto(`/work/${CASE_STUDY_SLUGS[0]}`);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }).click();
    // A jump lands in the same frame; a smooth scroll would still be near the top.
    const { y, offset } = await page.evaluate(() => ({
      y: window.scrollY,
      offset:
        document.getElementById("contact")!.getBoundingClientRect().top -
        (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0),
    }));
    expect(y).toBeGreaterThan(500);
    expect(Math.abs(offset)).toBeLessThan(4);
  });
});

test.describe("without reduced motion", () => {
  test("the case study smooth-scrolls (Work.dc.html)", async ({ page }) => {
    await page.goto(`/work/${CASE_STUDY_SLUGS[0]}`);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("smooth");
  });
});

// Every aria-label, aria-labelledby, role and live region the artboards set (go-through of /design, M8).
test.describe("artboard a11y attributes", () => {
  const BY_PAGE: Record<string, string[]> = {
    "/": [
      'nav[aria-label="Main"]',
      '[role="region"][aria-label="About X-ray mode"]',
      '[aria-labelledby="fit-h"]',
      '[aria-labelledby="uh-h"]',
      '[aria-labelledby="work-h"]',
      '[aria-labelledby="log-h"]',
      '[aria-labelledby="contact-h"]',
    ],
    "/log": ['[role="group"][aria-label="Filter posts"]', '[aria-labelledby="contact-h"]'],
    "/about": ['[aria-labelledby="exp-h"]', '[aria-labelledby="skills-h"]', '[aria-labelledby="cert-h"]', 'input[aria-label="Ask your own question about Aswin\'s experience"]'],
    [`/work/${CASE_STUDY_SLUGS[2]}`]: [
      '[aria-label="Case study sections"]',
      '[role="group"][aria-label="Compare"]',
      '[aria-labelledby="h-ba"]',
      '[aria-labelledby="h-decisions"]',
      '[aria-labelledby="h-safe"]',
      '[aria-labelledby="h-lessons"]',
    ],
  };
  for (const [path, selectors] of Object.entries(BY_PAGE)) {
    test(`present on ${path}`, async ({ page }) => {
      await page.goto(path);
      for (const sel of selectors) await expect(page.locator(sel).first(), sel).toBeAttached();
      // Every aria-labelledby points at an element that exists.
      const dangling = await page.evaluate(() =>
        [...document.querySelectorAll("[aria-labelledby]")]
          .flatMap((el) => el.getAttribute("aria-labelledby")!.split(" "))
          .filter((id) => !document.getElementById(id)),
      );
      expect(dangling).toEqual([]);
      // One h1 per page; headings never skip a level.
      const levels = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main h4")].map((h) => Number(h.tagName[1])));
      expect(levels.filter((l) => l === 1)).toHaveLength(1);
      levels.forEach((l, i) => i > 0 && expect(l - levels[i - 1], `heading ${i}`).toBeLessThanOrEqual(1));
    });
  }

  test("contact errors are tied to their fields", async ({ page }) => {
    await page.goto("/log");
    await page.locator("#contact").getByRole("button", { name: /Send/ }).click();
    for (const f of ["name", "email", "msg"]) {
      const input = page.locator(`#contact [aria-describedby="c-${f}-err"]`);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator(`#c-${f}-err`)).toBeVisible();
    }
  });
});
