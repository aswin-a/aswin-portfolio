import { expect, FAKE, JD_LABEL, test, type Locator, type Page } from "./fixtures";

/** A state's own h2, not the fit-check panel's "Will I fit your role?" (Hero.dc.html update 2). */
const stateHeading = (page: Page) => page.locator("section").first().getByRole("heading", { level: 2 }).filter({ hasNotText: /^Will I fit your role\?$/ });
import { ASK_ATTACKS, ASK_QUESTIONS } from "@/lib/ask/copy";
import { HERO_SAMPLES } from "@/lib/fit-check/copy";

/**
 * Visual baselines (M7, SPEC §14): the views below that match an artboard and render the same every
 * run were reviewed against /design, then committed under tests/e2e/__screenshots__. Any change to
 * them fails until the baseline is updated on purpose (`pnpm test:e2e:update`). Everything else, and
 * views with measured durations (running, thinking, sending, X-ray traces), is captured to
 * test-results/screens for side-by-side checks only.
 */
const BASELINES = new Set([
  ...["home", "work_integration-builder", "log", "about"].flatMap((p) => [`${p}-1440`, `${p}-390`]),
  "home-1440-xray",
  "home-390-xray",
  ...["empty", "result", "badfit", "error", "limited", "budget"].flatMap((s) => [`hero-${s}-1440`, `hero-${s}-390`]),
  ...["start", "answer", "todo", "refuse", "none", "clarify"].flatMap((s) => [`ask-${s}-1440`, `ask-${s}-390`]),
  ...["idle", "invalid", "sent", "error", "limited"].flatMap((s) => [`contact-${s}-1440`, `contact-${s}-390`]),
  "about-group-open-1440",
  "about-group-open-390",
  "ask-topic-1440",
  "ask-topic-390",
]);

async function snap(page: Page, file: string, target: Page | Locator = page, fullPage = false) {
  await page.evaluate(() => document.fonts.ready);
  // Element crops scroll the page; hide the sticky nav so it isn't drawn over the element.
  if (!("goto" in target)) await page.addStyleTag({ content: "header { visibility: hidden !important; }" });
  if (!BASELINES.has(file)) {
    await target.screenshot({ path: `test-results/screens/${file}.png`, fullPage });
    return;
  }
  // Masked: the footer's deploy date (changes every build) and the eval case count, which comes
  // from content/eval-results.json and changes with each real eval run (checked by pages.spec).
  const mask = [page.getByText(/^Updated \d{1,2} \w+ \d{4}\b/), page.getByText(/test JDs and (red-team cases|questions)/)];
  if ("goto" in target) await expect(target).toHaveScreenshot(`${file}.png`, { fullPage, mask });
  else await expect(target).toHaveScreenshot(`${file}.png`, { mask });
}

const PAGES = ["/", "/work", "/work/integration-builder", "/work/job-search-agent", "/work/fit-check", "/log", "/log/integrations-experience-is-agent-experience", "/about"];
const SIZES = [
  ["1440", 1440, 900],
  ["390", 390, 844],
] as const;

for (const path of PAGES) {
  for (const [name, width, height] of SIZES) {
    for (const xray of [false, true]) {
      const file = `${path === "/" ? "home" : path.slice(1).replace(/\//g, "_")}-${name}${xray ? "-xray" : ""}`;
      test(`screen ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? `${path}?xray=1` : path);
        await snap(page, file, page, true);
      });
    }
  }
}

// Ask my work, for the side-by-side check against the Ask and MobileAsk artboards.
const ASK_STATES: [string, string | null][] = [
  ["start", null],
  ["thinking", null],
  ["answer", "Has he worked on APIs?"],
  ["todo", "What's his biggest platform win?"],
  ["refuse", "prompt injection"],
  ["none", "something he hasn't done"],
  ["clarify", "ambiguous ask"],
];
for (const [name, width, height] of SIZES) {
  for (const xray of [false, true]) {
    for (const [state, pick] of ASK_STATES) {
      const file = `ask-${state}-${name}${xray ? "-xray" : ""}`;
      test(`screen ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? "/?xray=1" : "/");
        // The desktop Nav's button, or below 640px the phone dock's (design update 9).
        await page.getByRole("button", { name: /^Ask my work/ }).first().click();
        const dialog = page.getByRole("dialog", { name: "Ask my work" });
        if (state === "thinking") {
          // Held in compose (real kb.search done, model call running).
          await dialog.getByRole("textbox").fill(`Has he worked on APIs? ${FAKE.hold}`);
          await page.keyboard.press("Enter");
          await dialog.getByText("› compose · writing the answer…").waitFor();
        } else if (pick) {
          // Ask has no Break my AI chips (Aswin, 2026-11-23), so attacks are typed.
          const attack = ASK_ATTACKS.find(([, chip]) => chip === pick);
          if (attack) {
            await dialog.getByRole("textbox").fill(ASK_QUESTIONS[attack[0]]);
            await page.keyboard.press("Enter");
          } else {
            await dialog.getByRole("button", { name: pick }).first().click();
          }
          await dialog.getByRole("button", { name: "← Ask another" }).waitFor();
        }
        await snap(page, file);
      });
    }
  }
}

// Fit-check hero, for the side-by-side check against HeroStates and Mobile.
// [state, pasted JD with an AI_FAKE marker, chip]: the real /api/run under AI_FAKE.
const HERO_STATES: [string, string | null, string | null][] = [
  ["empty", null, null],
  ["running", `${HERO_SAMPLES[0].jd} ${FAKE.hold}`, null],
  ["result", null, "Senior Platform PM"],
  ["badfit", null, "A bad fit, on purpose"],
  ["break", null, "conflicting info"],
  ["error", `${HERO_SAMPLES[0].jd} ${FAKE.error}`, null],
  ["limited", `${HERO_SAMPLES[0].jd} ${FAKE.limited}`, null],
  ["budget", `${HERO_SAMPLES[0].jd} ${FAKE.budget}`, null],
];
for (const [name, width, height] of SIZES) {
  for (const xray of [false, true]) {
    for (const [state, jd, pick] of HERO_STATES) {
      // Update 3: Break my AI lives in the X-ray panel, so it needs X-ray on. Update 5 hid the drill buttons.
      if (!xray && state === "break") continue;
      const file = `hero-${state}-${name}${xray ? "-xray" : ""}`;
      test(`screen ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? "/?xray=1" : "/");
        const hero = page.locator("section").first();
        if (jd) {
          await page.getByLabel(JD_LABEL).fill(jd);
          await page.getByRole("button", { name: "Check fit" }).click();
          if (state === "running") await hero.getByRole("status").getByText(/evidence\.map/).filter({ visible: true }).waitFor();
          else await stateHeading(page).waitFor();
        } else if (pick) {
          await hero.getByRole("button", { name: pick, exact: true }).click();
          if (state === "break") {
            await hero.getByText("FLAGGED", { exact: true }).waitFor();
            await hero.getByRole("button", { name: "prompt injection" }).click();
            await hero.getByText("2 of 2", { exact: true }).waitFor();
          } else if (state === "running") {
            await hero.getByText("running…").waitFor();
            await hero.getByRole("status").getByText(/evidence\.map/).waitFor();
          } else {
            await stateHeading(page).waitFor();
          }
        }
        await snap(page, file, hero);
      });
    }
  }
}

// Design update 6: the CV page with an area card open, and Ask in topic mode.
for (const [name, width, height] of SIZES) {
  test(`screen about-group-open-${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/about");
    await page.getByRole("button", { name: /^Core platform and integrations/ }).click();
    await snap(page, `about-group-open-${name}`, page, true);
  });
  test(`screen ask-topic-${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/about");
    await page.getByRole("main").locator("ol > li").nth(5).getByRole("button", { name: "Ask about this role →" }).click();
    await page.getByRole("dialog", { name: "Ask my work" }).getByText(/^ASKING ABOUT/).waitFor();
    await snap(page, `ask-topic-${name}`);
  });
}

// Contact (FooterStates.dc.html, design update 7): the 6 states. Error and 429 are mocked; sending is held.
for (const [name, width, height] of SIZES) {
  for (const state of ["idle", "invalid", "sending", "sent", "error", "limited"] as const) {
    test(`screen contact-${state}-${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/about");
      const section = page.locator("section#contact");
      if (state === "error") await page.route("**/api/contact", (r) => r.fulfill({ status: 502, contentType: "application/json", body: '{"ok":false,"code":"error"}' }));
      if (state === "limited")
        await page.route("**/api/contact", (r) => r.fulfill({ status: 429, contentType: "application/json", body: '{"ok":false,"code":"rate_limited","retryAfterSec":1380}' }));
      if (state === "sending") await page.route("**/api/contact", () => new Promise(() => {}));
      if (state !== "idle") {
        // FooterStates' sample: invalid has a bad email and no message.
        await section.getByLabel("Name").fill("Priya Raman");
        await section.getByLabel("Work email").fill(state === "invalid" ? "priya@acme" : "priya@acme.com");
        await section.getByLabel("Role", { exact: true }).fill("Senior Platform PM");
        if (state !== "invalid") await section.getByLabel("Message").fill("We’re hiring a Senior Platform PM for our integrations team. Open to a call this week?");
        await section.getByRole("button", { name: "Send to Aswin" }).click();
        if (state === "sent") await section.getByText("✓ SENT").waitFor();
        else if (state === "sending") await section.getByText("Sending to Aswin’s inbox").waitFor();
        else await section.getByTestId("contact-line").waitFor();
      }
      await snap(page, `contact-${state}-${name}`, section);
    });
  }
}
