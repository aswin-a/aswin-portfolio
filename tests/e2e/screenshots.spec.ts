import { FAKE, JD_LABEL, test, type Page } from "./fixtures";

/** A state's own h2, not the fit-check panel's "Will I fit your role?" (Hero.dc.html update 2). */
const stateHeading = (page: Page) => page.locator("section").first().getByRole("heading", { level: 2 }).filter({ hasNotText: /^Will I fit your role\?$/ });
import { ASK_ATTACKS, ASK_QUESTIONS } from "@/lib/ask/copy";
import { HERO_SAMPLES } from "@/lib/fit-check/copy";

// Not assertions: full-page captures for the side-by-side check against /design/screenshots.
const PAGES = ["/", "/work", "/work/integration-builder", "/work/job-search-agent", "/work/fit-check", "/log", "/log/integrations-experience-is-agent-experience", "/about"];
const SIZES = [
  ["1440", 1440, 900],
  ["390", 390, 844],
] as const;

for (const path of PAGES) {
  for (const [name, width, height] of SIZES) {
    for (const xray of [false, true]) {
      const file = `${path === "/" ? "home" : path.slice(1).replace(/\//g, "_")}-${name}${xray ? "-xray" : ""}`;
      test(`capture ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? `${path}?xray=1` : path);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `test-results/screens/${file}.png`, fullPage: true });
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
      test(`capture ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? "/?xray=1" : "/");
        await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /^Ask my work/ }).click();
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
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `test-results/screens/${file}.png` });
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
      test(`capture ${file}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(xray ? "/?xray=1" : "/");
        const hero = page.locator("section").first();
        if (jd) {
          await page.getByLabel(JD_LABEL).fill(jd);
          await page.getByRole("button", { name: "Check fit" }).click();
          if (state === "running") await hero.getByRole("status").getByText(/evidence\.map/).waitFor();
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
        await page.evaluate(() => document.fonts.ready);
        await hero.screenshot({ path: `test-results/screens/${file}.png` });
      });
    }
  }
}

// Design update 6: the CV page with an area card open, and Ask in topic mode.
for (const [name, width, height] of SIZES) {
  test(`capture about-group-open-${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/about");
    await page.getByRole("button", { name: /^Core platform and integrations/ }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `test-results/screens/about-group-open-${name}.png`, fullPage: true });
  });
  test(`capture ask-topic-${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/about");
    await page.getByRole("main").locator("ol > li").nth(5).getByRole("button", { name: "Ask about this role →" }).click();
    await page.getByRole("dialog", { name: "Ask my work" }).getByText(/^ASKING ABOUT/).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `test-results/screens/ask-topic-${name}.png` });
  });
}

// Contact (FooterStates.dc.html, design update 7): the 6 states. Error and 429 are mocked; sending is held.
for (const [name, width, height] of SIZES) {
  for (const state of ["idle", "invalid", "sending", "sent", "error", "limited"] as const) {
    test(`capture contact-${state}-${name}`, async ({ page }) => {
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
      await page.evaluate(() => document.fonts.ready);
      // Hide the sticky nav so it doesn't sit over the section in the crop.
      await page.addStyleTag({ content: "header { visibility: hidden !important; }" });
      await section.screenshot({ path: `test-results/screens/contact-${state}-${name}.png` });
    });
  }
}
