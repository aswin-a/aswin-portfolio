import { ASK_ATTACKS, ASK_QUESTIONS } from "@/lib/ask/copy";
import { KB } from "@/lib/kb/snapshot";
import { expect, FAKE, test, type Page } from "./fixtures";

// Session memory in the shape the hero writes (Milestone 4). Uses the design's HERO_BAD sample.
const MEMORY = {
  role: "Head of Hardware Product · consumer electronics",
  matchCount: 1,
  gaps: [
    { req: "Hardware roadmaps from prototype to mass production", closest: "Not something Aswin has done.", close: "" },
    { req: "Retail channel P&L", closest: "Ran Dhee's, a direct-to-consumer brand. Not retail, not hardware.", close: "" },
  ],
};

// The desktop Nav's button, or below 640px the phone dock's "Ask my work ↑" (design update 9).
const askButton = (page: Page) => page.getByRole("button", { name: /^Ask my work/ }).first();
const dialog = (page: Page) => page.getByRole("dialog", { name: "Ask my work" });
const input = (page: Page) => page.getByRole("textbox", { name: "Ask a question about Aswin's work" });
const status = (page: Page) => dialog(page).getByRole("status");

async function open(page: Page, path = "/") {
  await page.goto(path);
  await askButton(page).click();
  await expect(dialog(page)).toBeVisible();
}

test.describe("open, close and focus", () => {
  test("Nav button opens it with the input focused; Esc closes and focus returns", async ({ page }) => {
    await open(page);
    await expect(input(page)).toBeFocused();
    await expect(input(page)).toHaveAttribute("maxlength", "1000");
    await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(askButton(page)).toBeFocused();
  });

  for (const combo of ["Meta+k", "Control+k"]) {
    test(`${combo} opens it from anywhere; ✕ closes it`, async ({ page }) => {
      await page.goto("/about");
      await page.getByRole("link", { name: "Build log" }).first().focus();
      await page.keyboard.press(combo);
      await expect(dialog(page)).toBeVisible();
      await expect(input(page)).toBeFocused();
      await dialog(page).getByRole("button", { name: "Close" }).click();
      await expect(dialog(page)).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Build log" }).first()).toBeFocused();
    });
  }

  test("clicking the scrim closes it and focus returns (design update 10)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    await expect(page.locator("[data-ask-root]")).toHaveCSS("background-color", "rgba(27, 26, 23, 0.4)");
    // A click inside the dialog doesn't close it.
    await dialog(page).click({ position: { x: 300, y: 5 } });
    await expect(dialog(page)).toBeVisible();
    await page.mouse.click(20, 400);
    await expect(dialog(page)).toHaveCount(0);
    await expect(askButton(page)).toBeFocused();
  });

  test("desktop: at most 80vh tall; the conversation scrolls inside; the page keeps its place (update 10)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 400 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(700);
    // The shortcut, not a click: Playwright scrolls a sticky button "into view" before clicking it.
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
    expect((await dialog(page).boundingBox())!.height).toBeLessThanOrEqual(320);
    const scroller = dialog(page).locator("[data-ask-scroll]");
    await expect(scroller).toHaveCSS("overflow-y", "auto");
    await expect(scroller).toHaveCSS("overscroll-behavior-y", "contain");
    expect(await scroller.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
    await scroller.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => scroller.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
    // The input row stays put.
    await expect(input(page)).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(700);
  });

  test("page behind is inert and doesn't scroll; Tab stays in the dialog", async ({ page }) => {
    await open(page);
    expect(await page.locator("main").evaluate((el) => el.closest("[inert]") !== null)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
    // Shift+Tab from the input wraps to the last control, Tab from there back to the first.
    await page.keyboard.press("Shift+Tab");
    await expect(dialog(page).getByRole("button", { name: "Has he led a hardware launch?" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(input(page)).toBeFocused();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    expect(await page.locator("main").evaluate((el) => el.closest("[inert]") !== null)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });
});

test.describe("before a question", () => {
  const SUGGESTIONS: [string, string[]][] = [
    ["/", ["Has he worked on APIs?", "What's his biggest platform win?", "Has he shipped LLM features at a company?", "Has he led a hardware launch?"]],
    ["/work/integration-builder", ["Why are safeguards the centrepiece?", "What failed first?", "Is this CloudEagle's product?", "Has he shipped LLM features at a company?"]],
    ["/work", ["Why are safeguards the centrepiece?", "What failed first?", "Is this CloudEagle's product?", "Has he shipped LLM features at a company?"]],
    ["/log/integrations-experience-is-agent-experience", ["What's he building now?", "Has he worked on APIs?", "Has he shipped LLM features at a company?"]],
    ["/about", ["Has he worked on APIs?", "What's his healthcare experience?", "What's his biggest platform win?", "Has he led a hardware launch?"]],
  ];
  for (const [path, qs] of SUGGESTIONS) {
    test(`suggestions on ${path}`, async ({ page }) => {
      await open(page, path);
      const section = dialog(page).locator("div", { has: page.getByText("Suggested for this page", { exact: true }) }).last();
      await expect(section.getByRole("button")).toHaveText(qs.map((q) => `${q}ask ↵`));
    });
  }

  test("no Break my AI in Ask, even in X-ray (Aswin, 2026-11-23); no Jump to (Aswin, 2026-11-26)", async ({ page }) => {
    await open(page, "/?xray=1");
    await expect(dialog(page).getByText("Break my AI", { exact: true })).toHaveCount(0);
    for (const chip of ["prompt injection", "something he hasn't done", "conflicting info", "ambiguous ask"]) {
      await expect(dialog(page).getByRole("button", { name: chip, exact: true })).toHaveCount(0);
    }
    // The dialog itself stays light; only the scrim darkens.
    await expect(dialog(page)).toHaveCSS("background-color", "rgb(255, 253, 248)");
    await expect(dialog(page).getByText("Jump to", { exact: true })).toHaveCount(0);
    await expect(dialog(page).getByRole("link")).toHaveCount(0);
  });

  test("no session memory box without a fit check", async ({ page }) => {
    await open(page);
    await expect(dialog(page).getByText("CONTINUING FROM YOUR FIT CHECK · SESSION MEMORY")).toHaveCount(0);
    await expect(dialog(page).getByRole("button", { name: "Forget this" })).toHaveCount(0);
  });
});

test.describe("session memory", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((m) => {
      if (!sessionStorage.getItem("memory-set")) {
        sessionStorage.setItem("fit-memory", JSON.stringify(m));
        sessionStorage.setItem("memory-set", "1");
      }
    }, MEMORY);
  });

  test("shows the fit check's role and gaps, answers from it, and Forget this clears it", async ({ page }) => {
    await open(page);
    const box = dialog(page).locator("div", { has: page.getByText("CONTINUING FROM YOUR FIT CHECK · SESSION MEMORY") }).first();
    await expect(box).toContainText("Head of Hardware Product · consumer electronics · 1 matches · 2 gaps");
    await expect(box).toContainText("Held for this session only. Pasted job descriptions are not stored.");
    await expect(box.getByRole("button", { name: /^About the gap: / })).toHaveCount(2);

    await box.getByRole("button", { name: /About the gap: Hardware roadmaps/ }).click();
    await expect(status(page)).toContainText("› About the gap: Hardware roadmaps from prototype to mass production");
    await expect(status(page)).toContainText("NOT SOMETHING ASWIN HAS DONE");
    await expect(status(page)).toContainText("Not something Aswin has done.");
    await expect(status(page).getByRole("link", { name: "Your fit check →" })).toBeVisible();

    await status(page).getByRole("button", { name: "← Ask another" }).click();
    await dialog(page).getByRole("button", { name: /What should I ask him about these gaps\?/ }).click();
    await expect(status(page)).toContainText(
      "Ask how he would ramp up on: Hardware roadmaps from prototype to mass production; Retail channel P&L. Each case study also ends with questions to ask him.",
    );

    await status(page).getByRole("button", { name: "← Ask another" }).click();
    await dialog(page).getByRole("button", { name: "Forget this" }).click();
    await expect(dialog(page).getByText("CONTINUING FROM YOUR FIT CHECK · SESSION MEMORY")).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("fit-memory"))).toBeNull();
  });

  test("a non-not-done gap is PARTIAL", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: /About the gap: Retail channel P&L/ }).click();
    await expect(status(page)).toContainText("PARTIAL · STATED PLAINLY");
  });
});

test.describe("answers", () => {
  test("thinking: the real steps stream in, input and Ask disabled; reopening resets (Ask.dc.html update 2)", async ({ page }) => {
    await open(page);
    // Held in compose: kb.search is done, the model call is running.
    await input(page).fill(`Has he worked on APIs? ${FAKE.hold}`);
    await page.keyboard.press("Enter");
    const thinking = status(page);
    await expect(thinking).toHaveAttribute("aria-live", "polite");
    await expect(thinking.getByText(`› Has he worked on APIs? ${FAKE.hold}`, { exact: true })).toBeVisible();
    const done = thinking.getByText("✓ kb.search · searching the knowledge base", { exact: true });
    const current = thinking.getByText("› compose · writing the answer…", { exact: true });
    await expect(done).toHaveCSS("color", "rgb(31, 76, 134)");
    await expect(current).toHaveCSS("color", "rgb(27, 26, 23)");
    // guardrails hasn't started, so it isn't shown.
    await expect(thinking.getByText(/guardrails/)).toHaveCount(0);
    await expect(thinking).toHaveCSS("padding-top", "18px");
    await expect(thinking).toHaveCSS("row-gap", "10px");
    await expect(thinking).toHaveCSS("font-size", "13px");
    const track = thinking.locator('span[aria-hidden="true"]');
    await expect(track).toHaveCSS("height", "3px");
    await expect(track).toHaveCSS("background-color", "rgb(232, 238, 246)");
    await expect(track.locator("[data-progress]")).toHaveAttribute("style", "width: 67%;");

    await expect(input(page)).toBeDisabled();
    await expect(input(page)).toHaveAttribute("aria-busy", "true");
    await expect(input(page)).toHaveAttribute("placeholder", "Answering from the knowledge base…");
    await expect(input(page)).toHaveCSS("opacity", "0.5");
    const submit = dialog(page).getByRole("button", { name: "Thinking…", exact: true });
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveCSS("opacity", "0.5");
    await expect(dialog(page).getByText("Suggested for this page")).toHaveCount(0);
    await expect(thinking).toBeFocused();

    await page.keyboard.press("Escape");
    await askButton(page).click();
    await expect(dialog(page).getByText("Suggested for this page")).toBeVisible();
    await expect(input(page)).toBeEnabled();
    await expect(input(page)).toHaveAttribute("aria-busy", "false");
    await expect(input(page)).toHaveAttribute("placeholder", "Ask about Aswin's work, or jump to a page…");
    await expect(dialog(page).getByRole("button", { name: "Ask", exact: true })).toBeEnabled();
  });

  test("a question, then a plain answer with sources; Ask another goes back", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: /Has he worked on APIs\?/ }).click();
    await expect(status(page)).toHaveAttribute("aria-live", "polite");
    await expect(status(page)).toContainText("› Has he worked on APIs?");
    await expect(status(page)).toContainText("Yes. His platform PM work is APIs and integrations");
    await expect(status(page)).not.toContainText("compose · writing the answer");
    await expect(dialog(page).getByRole("button", { name: "Ask", exact: true })).toBeEnabled();
    await expect(input(page)).toBeFocused();
    await expect(status(page).getByRole("link", { name: "CV · My experience →" })).toHaveAttribute("href", "/about");
    await expect(status(page).getByRole("link", { name: /Platform & API work/ })).toHaveCount(0);
    await status(page).getByRole("button", { name: "← Ask another" }).click();
    await expect(dialog(page).getByText("Suggested for this page")).toBeVisible();
    await expect(input(page)).toBeFocused();
  });

  test("todo box for content Aswin still has to supply", async ({ page }) => {
    // The box lists placeholders in the cited KB entry. The CloudEagle entry's evidence was filled
    // (content sheet D26, 2026-11-24), and no design answer cites the one KB entry that still has one.
    const cited = KB.find((e) => e.id === "cloudeagle")!;
    test.skip(cited.todos.length === 0, "No KB entry cited by a design Ask answer still has a placeholder");
    await open(page, "/work/integration-builder");
    await dialog(page).getByRole("button", { name: /Is this CloudEagle's product\?/ }).click();
    const todoBox = status(page).getByText(cited.todos[0], { exact: true });
    await expect(todoBox).toBeVisible();
    await expect(todoBox).toHaveCSS("border-top-style", "dotted");
  });

  test("no todo box once the cited content is supplied", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: /What's his biggest platform win\?/ }).click();
    await expect(status(page).getByRole("link", { name: "CV · My experience →" })).toBeVisible();
    await expect(status(page).getByText(/^\[.*\]$/)).toHaveCount(0);
  });

  const TONES: [string, string, string, string][] = [
    ["prompt injection", "REFUSED · PROMPT INJECTION", "solid", "1px"],
    ["something he hasn't done", "NOT SOMETHING ASWIN HAS DONE", "dashed", "1.5px"],
    ["conflicting info", "CONFLICT FLAGGED · GOING WITH THE RECORD", "dashed", "1.5px"],
    ["ambiguous ask", "NEEDS CLARIFYING", "solid", "1px"],
  ];
  for (const [chip, label, style, width] of TONES) {
    test(`a typed attack still gets its guarded answer: ${chip}`, async ({ page }) => {
      await open(page, "/?xray=1");
      const attack = ASK_ATTACKS.find(([, c]) => c === chip)!;
      await input(page).fill(ASK_QUESTIONS[attack[0]]);
      await page.keyboard.press("Enter");
      const labelEl = status(page).getByText(label, { exact: true });
      await expect(labelEl).toBeVisible();
      const card = labelEl.locator("..");
      await expect(card).toHaveCSS("border-top-style", style);
      // Chrome draws 1.5px borders as 1px at DPR 1, so check the declared width.
      if (width === "1.5px") await expect(card).toHaveClass(/border-\[1\.5px\]/);
      else await expect(card).toHaveCSS("border-top-width", "1px");
    });
  }

  test("free text gets unknown with a Contact chip", async ({ page }) => {
    await open(page);
    await input(page).fill("Does he speak Klingon?");
    await page.keyboard.press("Enter");
    await expect(status(page)).toContainText("› Does he speak Klingon?");
    await expect(status(page)).toContainText(
      "The knowledge base doesn't cover that, so there's no answer to give. Try a suggested question, or ask Aswin directly.",
    );
    await expect(status(page).getByRole("link", { name: "Contact →" })).toHaveAttribute("href", "/#contact");
    await expect(input(page)).toHaveValue("");
  });

  test("empty input asks nothing", async ({ page }) => {
    await open(page);
    await input(page).fill("   ");
    await page.keyboard.press("Enter");
    await expect(status(page)).toHaveCount(0);
  });

  for (const [mode, copy] of [
    ["error", "Ask my work couldn't answer this time. Try again, or ask Aswin directly."],
    ["limited", "That's the limit for questions this hour. Aswin is one message away."],
    ["budget", "Ask my work is paused for this month: the AI budget is spent. Aswin is one message away."],
  ] as const) {
    test(`${mode} state`, async ({ page }) => {
      await open(page);
      await input(page).fill(`Has he worked on APIs? ${FAKE[mode]}`);
      await page.keyboard.press("Enter");
      await expect(status(page)).toContainText(copy);
      await expect(status(page).getByRole("link", { name: "Contact →" })).toHaveAttribute("href", "/#contact");
      await expect(status(page).getByText(/^kb\.search/)).toHaveCount(0);
    });
  }

  test("X-ray trace panel shows only in X-ray", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: /Has he worked on APIs\?/ }).click();
    const line = status(page).getByText(/^kb\.search → 1 source · guardrail fired:/);
    await expect(line).toBeHidden();
    await page.keyboard.press("Escape");
    await page.goto("/?xray=1");
    await askButton(page).click();
    await dialog(page).getByRole("button", { name: /Has he worked on APIs\?/ }).click();
    await expect(
      status(page).getByText(
        /^kb\.search → 1 source · guardrail fired: none · answered from the knowledge base · trace run_[0-9a-f]{12} · live usage: cost \$0\.0000 · \d+ ms$/,
      ),
    ).toBeVisible();
    const trace = status(page).getByText(/^kb\.search → 1 source/);
    await expect(trace).toHaveCSS("padding-right", "76px");
    await expect(trace).toHaveCSS("border-top-left-radius", "8px");
    await expect(trace).toHaveCSS("background-color", "rgb(16, 18, 20)");
    await expect(trace.locator("xpath=..").getByText("X-RAY", { exact: true })).toBeVisible();
  });
});

test.describe("layout", () => {
  test("desktop: modal 680 wide, 10vh from the top, 14px radius", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const box = (await dialog(page).boundingBox())!;
    expect(box.width).toBe(680);
    expect(box.y).toBe(90);
    expect(box.x).toBe((1440 - 680) / 2);
    await expect(dialog(page)).toHaveCSS("border-top-left-radius", "14px");
  });

  test("390px: bottom sheet, full width, 18px top radius", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const box = (await dialog(page).boundingBox())!;
    expect(box.width).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    await expect(dialog(page)).toHaveCSS("border-top-left-radius", "18px");
    await expect(dialog(page)).toHaveCSS("border-bottom-left-radius", "0px");
    // The dock hides while Ask is open and comes back on close (design update 9).
    await expect(page.getByRole("button", { name: "Ask my work", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Ask my work", exact: true })).toBeVisible();
  });
});

test.describe("topic mode on the CV page (update 6)", () => {
  const topicBox = (page: Page) => dialog(page).getByText(/^ASKING ABOUT · /).locator("xpath=..");

  test("the Nav button opens on the general topic; other pages have none", async ({ page }) => {
    await open(page, "/about");
    await expect(dialog(page).getByText("ASKING ABOUT · My experience", { exact: true })).toBeVisible();
    await expect(topicBox(page).getByRole("button")).toHaveText([
      "What did he own at Zelthy?ask ↵",
      "Has he managed integrations at scale?ask ↵",
      "Has he led a team?ask ↵",
    ]);
    await expect(topicBox(page)).toHaveCSS("border-top-color", "rgb(31, 76, 134)");
    await expect(topicBox(page).getByRole("button").first()).toHaveCSS("min-height", "44px");
    await page.keyboard.press("Escape");
    await open(page, "/");
    await expect(dialog(page).getByText(/^ASKING ABOUT/)).toHaveCount(0);
  });

  test("'Ask about this role →' opens the role's questions, which go to the live endpoint", async ({ page }) => {
    await page.goto("/about");
    const zelthy = page.getByRole("main").locator("ol > li").nth(5);
    await zelthy.getByRole("button", { name: "Ask about this role →" }).click();
    await expect(dialog(page).getByText("ASKING ABOUT · Senior Product Manager · Zelthy", { exact: true })).toBeVisible();
    await dialog(page).getByRole("button", { name: /^What did he ship with ML or AI\?/ }).click();
    await expect(status(page)).toContainText("› What did he ship with ML or AI?");
    // Not the prototype's canned answer: the fake model doesn't know this question, so the live path says so.
    await expect(status(page)).not.toContainText("ML-based OCR for prescriptions and bills, in production");
    await expect(status(page)).toContainText("The knowledge base doesn't cover that");
  });

  test("the Ask box asks its own question, or a chip, as soon as Ask opens", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("textbox", { name: "Ask your own question about Aswin's experience" }).fill("Has he worked on APIs?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(status(page)).toContainText("› Has he worked on APIs?");
    await expect(status(page)).toContainText("Yes.");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Has he led a team?", exact: true }).click();
    await expect(status(page)).toContainText("› Has he led a team?");
    await dialog(page).getByRole("button", { name: "← Ask another" }).click();
    await expect(dialog(page).getByText("ASKING ABOUT · My experience", { exact: true })).toBeVisible();
  });
});
