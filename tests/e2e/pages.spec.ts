import { expect, test } from "@playwright/test";
import { JD_LABEL } from "./fixtures";

const theme = async (page: import("@playwright/test").Page) =>
  (await page.locator("html").getAttribute("data-xray")) === null ? null : "xray";

const hoodGrid = (page: import("@playwright/test").Page) => page.locator("#uh-h").locator("xpath=../..");

test("home: live 'How I build' card turns X-ray on and jumps to the hero", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await hoodGrid(page).getByRole("link", { name: /^tools/ }).click();
  await expect(page).toHaveURL(/#top$/);
  expect(await theme(page)).toBe("xray");
});

test("home: the production card turns X-ray on first, then scrolls to Break my AI (update 4)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#break-my-ai")).toHaveCount(0);
  await expect(hoodGrid(page).getByRole("link", { name: /^production/ })).toContainText("Try Break my AI →");
  await hoodGrid(page).getByRole("link", { name: /^production/ }).click();
  await expect(page).toHaveURL(/#break-my-ai$/);
  expect(await theme(page)).toBe("xray");
  await expect(page.locator("#break-my-ai")).toBeInViewport();
});

test("home: 12 proof cards in the design's order, pills and CTAs (update 4)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const grid = hoodGrid(page).locator("div.grid");
  await expect(grid).toHaveCSS("grid-template-columns", /px/);
  await expect(grid).toHaveCSS("row-gap", "14px");
  const names = grid.locator(":scope > * > span:first-child > span:first-child");
  await expect(names).toHaveText(["agents", "skills", "tools", "orchestration", "memory", "production", "guardrails", "evals", "human in loop", "data privacy", "rag", "mcp server"]);
  await expect(grid.getByText("[25] test JDs and red-team cases, run before every change.")).toBeVisible();
  await expect(grid.getByRole("link", { name: /^agents/ })).toHaveAttribute("href", "/work/job-search-agent");
  await expect(grid.getByRole("link", { name: /^skills/ })).toHaveAttribute("href", "#");
  await expect(grid.getByRole("link", { name: /^evals/ })).toHaveAttribute("href", "https://github.com/aswin-a/aswin-portfolio/tree/main/evals");
  await expect(grid.getByRole("link", { name: /^guardrails/ })).toHaveAttribute("href", "#break-my-ai");
  // The arrow is part of the CTA; the planned card is not a link and its CTA is muted.
  await expect(grid.getByText("Read the job-search study →", { exact: true })).toBeVisible();
  await expect(grid.getByRole("link", { name: /^mcp server/ })).toHaveCount(0);
  await expect(grid.getByText("Coming soon", { exact: true })).toHaveCSS("color", "rgb(92, 87, 78)");
  await expect(grid.getByText("View the skill →", { exact: true })).toHaveCSS("color", "rgb(31, 76, 134)");
  // shipped: ink border and text; prototype and planned: dashed rule border.
  const pill = (status: string) => grid.getByText(status, { exact: true }).first();
  await expect(pill("shipped")).toHaveCSS("border-top-color", "rgb(27, 26, 23)");
  await expect(pill("shipped")).toHaveCSS("color", "rgb(27, 26, 23)");
  await expect(pill("prototype")).toHaveCSS("border-top-style", "dashed");
  await expect(pill("planned")).toHaveCSS("border-top-style", "dashed");
  await expect(pill("GitHub")).toHaveCSS("border-top-style", "solid");
  await expect(pill("live here")).toHaveCSS("background-color", "rgb(232, 238, 246)");
});

test("home: Products I've built, with How it works and the human step in amber (update 4)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Before / after AI" })).toHaveCount(0);
  const h2 = page.locator("#work-h");
  await expect(h2).toHaveText("Products I've built");
  await expect(h2).toHaveCSS("font-size", "40px");
  const section = page.getByRole("region", { name: "Products I've built" });
  await expect(section.getByText("CASE STUDIES", { exact: true })).toBeVisible();
  await expect(section.getByText("Four AI products, each with a case study written like a PRD: the problem, the trade-offs, the safeguards and what's next.")).toBeVisible();
  const cards = section.getByRole("article");
  await expect(cards).toHaveCount(4);
  await expect(cards.getByRole("heading", { level: 3 })).toHaveText([
    "AI job search and apply agent",
    "Job-fit AI on this site",
    "AI integration builder",
    "Instagram content intelligence agent",
  ]);
  const first = cards.first();
  await expect(first).toHaveCSS("border-radius", "16px");
  await expect(first).toHaveCSS("padding-top", "28px");
  // No status pill on the desktop cards.
  await expect(first.getByText("IN USE · RECORDED RUN")).toHaveCount(0);
  await expect(first.getByRole("listitem")).toHaveText([
    "1Search LinkedIn and save matches",
    "2Write the ideal resume for the JD",
    "3Tailor mine with a three-way map",
    "4Wait for my approval  · person decides",
    "5Apply",
  ]);
  await expect(first.getByText("Wait for my approval", { exact: false })).toHaveCSS("color", "rgb(138, 85, 16)");
  await expect(first.getByText("4", { exact: true })).toHaveCSS("border-top-style", "dashed");
  await expect(first.getByText("4", { exact: true })).toHaveCSS("background-color", "rgb(251, 242, 226)");
  await expect(first.getByRole("link", { name: "Watch the recorded run" })).toHaveAttribute("href", "/work/job-search-agent");
  await expect(first.getByRole("link", { name: "Watch the recorded run" })).toHaveCSS("background-color", "rgb(27, 26, 23)");
  await expect(cards.nth(1).getByRole("link", { name: "Try it above ↑" })).toHaveAttribute("href", "#fit-h");
  await expect(cards.nth(1).getByRole("link", { name: "Read the case study →" })).toHaveAttribute("href", "/work/fit-check");
  await expect(cards.nth(2).getByText("[e.g. the spec, Figma flows and the clickable prototype]")).toBeVisible();
  await expect(cards.nth(2).getByRole("link", { name: "Run it locally" })).toHaveAttribute("href", "#");
  await expect(cards.nth(2).getByRole("link", { name: "Read the case study →" })).toHaveAttribute("href", "/work/integration-builder");
});

test("shared Footer: contact and the footer bar on every page, phones included (update 6)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/", "/work", "/work/integration-builder", "/log", "/log/integrations-experience-is-agent-experience", "/about"]) {
    await page.goto(path);
    await expect(page.locator("section#contact")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2, name: "Talk to Aswin." })).toBeVisible();
    await expect(page.locator("#contact").getByRole("link", { name: "CV", exact: true })).toHaveAttribute("href", "/about");
    await expect(page.locator("#contact").getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/aswin-a");
    await expect(page.getByRole("contentinfo")).toContainText(/Updated \d{1,2} [A-Z][a-z]{2} \d{4} · © 2026 Aswin · aswin-a\.com/);
  }
  await expect(page.locator("#contact")).toHaveCSS("padding", "72px 24px 88px");
  await expect(page.getByRole("heading", { level: 2, name: "Talk to Aswin." })).toHaveCSS("font-size", "48px");
  await expect(page.getByRole("contentinfo").locator("div")).toHaveCSS("max-width", "1040px");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#contact")).toHaveCSS("padding", "48px 20px 56px");
  await expect(page.getByRole("heading", { level: 2, name: "Talk to Aswin." })).toHaveCSS("font-size", "36px");
  await expect(page.getByRole("contentinfo")).toContainText("This site is an AI product. Turn on X-ray to see how it works.");
  await expect(page.getByRole("contentinfo")).toContainText(/· © 2026 Aswin · aswin-a\.com$/);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
});

test("home: Check fit is disabled until there is a job description", async ({ page }) => {
  await page.goto("/");
  const check = page.getByRole("button", { name: "Check fit" });
  await expect(check).toBeDisabled();
  await page.getByLabel(JD_LABEL).fill("Senior PM, APIs");
  await expect(check).toBeEnabled();
});

test("home: 'How I built this' has no toggle and shows only in X-ray, as plain-language lists (update 5)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /How I built this/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 3, name: "How I built this" })).toBeHidden();
  await page.goto("/?xray=1");
  const h = page.getByRole("heading", { level: 3, name: "How I built this" });
  await expect(h).toBeVisible();
  await expect(h).toHaveCSS("font-size", "18px");
  const panel = page.locator("#how-built");
  await expect(panel).toHaveCSS("background-color", "rgb(16, 18, 20)");
  await expect(panel).toHaveCSS("display", "flex");
  await expect(panel).toHaveCSS("padding", "20px 22px");
  await expect(panel.getByText("X-RAY", { exact: true })).toBeVisible();
  await expect(page.getByText("Honest note:")).toHaveCount(0);
  await expect(panel.getByText("The design behind the fit check. Numbers for a run and the current build appear in Build details after a check.")).toBeVisible();
  const chips = ["JD or link", "fetch_url · links only", "jd.parse", "kb.search", "evidence.map", "guard.citations", "guard.honesty", "verdict.compose"];
  for (const c of chips) await expect(panel.locator("span.rounded-md").getByText(c, { exact: true })).toBeVisible();
  await expect(panel.getByText("fetch_url · links only", { exact: true })).toHaveCSS("border-top-style", "dashed");
  await expect(panel.getByRole("heading", { level: 4 })).toHaveText(["Architecture", "Guardrails", "Evals", "Memory and production", "Trade-offs and what’s next"]);
  await expect(panel.getByText("[25] test JDs and questions, including bad-fit roles and red-team cases")).toBeVisible();
  await expect(panel.getByText("What failed first: [what broke, and the fix]")).toBeVisible();
  await expect(panel.getByText("No vector DB in v1, on purpose: [your reason]")).toBeVisible();
  await expect(panel.getByText("as an MCP server you can add to Claude")).toBeVisible();
  await expect(panel.getByText(/live usage/)).toHaveCount(0);
});

test("home: the hood header (update 3)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByText("ACROSS ALL MY WORK", { exact: true }).first()).toBeVisible();
  const h2 = page.locator("#uh-h");
  await expect(h2).toHaveText("How I build agentic products, with proof");
  await expect(h2).toHaveCSS("font-size", "36px");
  await expect(page.getByText("Each part links to where you can see it working: live on this site, in a case study, or on GitHub.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Under the hood" })).toHaveCount(0);
});

test("removed X-ray-only lines stay gone in X-ray; the page never re-themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/log?xray=1");
  await expect(page.getByText("written by Aswin · AI used for editing only · cross-posted to LinkedIn")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 243, 236)");
  await page.goto("/about?xray=1");
  await expect(page.getByText(/^knowledge base: /)).toHaveCount(0);
});

test("log: filters show counts, filter posts and the empty state (TIL stays upper-case)", async ({ page }) => {
  await page.goto("/log");
  await expect(page.getByRole("button", { name: "All 3" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Essays 1" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Teardowns 0" }).click();
  await expect(page.getByText("No teardowns yet. The first one is in the works.")).toBeVisible();
  await page.getByRole("button", { name: "TIL 0" }).click();
  await expect(page.getByText("No TIL yet. The first one is in the works.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read a case study →" })).toHaveAttribute("href", "/work");
});

test("CV: header, stats, timeline lanes and links (update 6)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await expect(page).toHaveTitle("CV — Aswin A");
  await expect(page.getByText("CURRICULUM VITAE", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Aswin A" })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn", exact: true }).first()).toHaveAttribute("href", "https://linkedin.com/in/aswin-a-pm");
  await expect(page.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", "#");
  await expect(page.getByText("Synced from my master resume · 13 Nov 2026")).toBeVisible();
  await expect(page.getByText("125% growth", { exact: true })).toHaveCSS("font-size", "26px");
  const items = page.getByRole("main").locator("ol > li");
  await expect(items).toHaveCount(8);
  await expect(items.nth(0).getByRole("heading", { level: 3 })).toHaveText("Job-fit AI on this site");
  await expect(items.nth(0).getByRole("link", { name: "Try it on the home page →" })).toHaveAttribute("href", "/");
  await expect(items.nth(0).locator("article")).toHaveClass(/border-dashed/);
  await expect(items.nth(0).getByText("Side project", { exact: true })).toBeVisible();
  await expect(items.nth(3).getByRole("link", { name: "Visit dhees.com ↗" })).toHaveAttribute("href", "https://dhees.com");
  await expect(items.nth(3).getByRole("link", { name: "View the code on GitHub ↗" })).toHaveAttribute("href", "https://github.com/aswin-dhees/dpc-website");
  await expect(items.nth(5).getByRole("heading", { level: 3 })).toHaveCSS("font-size", "20px");
  await expect(items.nth(5).locator("article")).toHaveCSS("background-color", "rgb(255, 253, 248)");
  await expect(items.nth(5).getByText("Senior PM, Oct 2022 – Sep 2024 · PM, Dec 2020 – Sep 2022 · Associate PM, Sep – Nov 2020")).toBeVisible();
  await expect(items.nth(7).getByRole("heading", { level: 3 })).toHaveCSS("font-size", "17px");
  // Desktop shows the dates column; the in-card dates are phone only.
  await expect(items.nth(5).getByText("Sep 2020 – Sep 2024")).toHaveCount(2);
  await expect(items.nth(5).locator("article").getByText("Sep 2020 – Sep 2024")).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(items.nth(5).locator("article").getByText("Sep 2020 – Sep 2024")).toBeVisible();
  await expect(items.nth(5).locator("> div").first()).toBeHidden();
  await expect(page.getByText("[Professional AI certificate · once earned]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Skills" })).toBeVisible();
});

test("CV: Zelthy's area cards open on their own and span the row (update 6)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const cards = page.getByRole("button", { name: /points ↓|points ↑/ });
  await expect(cards).toHaveCount(7);
  const core = page.getByRole("button", { name: /^Core platform and integrations/ });
  await expect(core).toHaveAttribute("aria-expanded", "false");
  await expect(core).toContainText("See all 12 points ↓");
  await core.click();
  await expect(core).toHaveAttribute("aria-expanded", "true");
  await expect(core).toContainText("Hide 12 points ↑");
  await expect(core.locator("xpath=..")).toHaveCSS("grid-column-start", "1");
  await expect(core.locator("xpath=..")).toHaveCSS("border-top-color", "rgb(31, 76, 134)");
  await expect(page.getByText("Evaluated HL7 and FHIR for interoperability and chose a FHIR converter per package (design stage).")).toBeVisible();
  const team = page.getByRole("button", { name: /^Team leadership/ });
  await team.click();
  await expect(core).toHaveAttribute("aria-expanded", "true");
  await expect(team).toContainText("Hide 2 points ↑");
  await core.click();
  await expect(page.getByText("Evaluated HL7 and FHIR for interoperability and chose a FHIR converter per package (design stage).")).toHaveCount(0);
});

test("CV: Copy as plain text shows Copied ✓ for 2 s (update 6)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/about");
  await page.getByRole("button", { name: "Copy as plain text" }).click();
  await expect(page.getByRole("button", { name: "Copied ✓" })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.startsWith("Aswin A\nSenior Product Manager · Platforms, integrations and agentic AI products\nChennai, India · linkedin.com/in/aswin-a-pm\n\nEXPERIENCE\n")).toBe(true);
  await expect(page.getByRole("button", { name: "Copy as plain text" })).toBeVisible({ timeout: 4000 });
});

test("CV: /about.md is the markdown twin", async ({ request }) => {
  const res = await request.get("/about.md");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/markdown");
  const md = await res.text();
  expect(md.startsWith("# Aswin A\n")).toBe(true);
  expect(md).toContain("### Senior Product Manager");
});

test("CV: JSON-LD Person with alumniOf and sameAs", async ({ page }) => {
  await page.goto("/about");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld.mainEntity["@type"]).toBe("Person");
  expect(ld.mainEntity.alumniOf[0].name).toBe("IIT Mandi");
  expect(ld.mainEntity.sameAs).toContain("https://linkedin.com/in/aswin-a-pm");
  expect(ld.mainEntity.sameAs).toContain("https://github.com/aswin-a");
});

test("case study: before/after tabs and the X-ray link button", async ({ page }) => {
  await page.goto("/work/integration-builder");
  const manual = page.getByRole("button", { name: "Manual", exact: true });
  await manual.click();
  await expect(manual).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Both" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "How I built this (X-ray)" }).click();
  expect(await theme(page)).toBe("xray");
  await expect(page.getByRole("button", { name: "Close How I built this" })).toBeVisible();
  const trace = page.getByText(/^LOGGED TRACE · run .+ · real run, never a simulation$/);
  await expect(trace).toBeVisible();
  await expect(trace.locator("xpath=..")).toHaveCSS("background-color", "rgb(16, 18, 20)");
  await expect(trace.locator("xpath=..").getByText("X-RAY", { exact: true })).toBeVisible();
  const evals = page.getByText(/^OFFLINE EVAL SET · .+ cases incl\. red-team$/);
  await expect(evals).toBeVisible();
  await expect(evals.locator("xpath=..").getByText("X-RAY", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 243, 236)");
});

test("case study: rail is sticky from 900px only", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/work/integration-builder");
  const rail = page.getByRole("navigation", { name: "Case study sections" });
  await expect(rail).toHaveCSS("position", "sticky");
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(rail).toHaveCSS("position", "static");
});

test("case study: only CloudEagle has 'Try to break it'", async ({ page }) => {
  await page.goto("/work/integration-builder");
  await expect(page.getByRole("heading", { name: "Try to break it" })).toBeVisible();
  await page.goto("/work/job-search-agent");
  await expect(page.getByRole("heading", { name: "Try to break it" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "AI job search and apply agent", level: 1 })).toBeVisible();
});

test("case study: CASE STUDIES breadcrumb, LAST UPDATED and the counter before and after an attempt (update 4)", async ({ page }) => {
  await page.goto("/work/integration-builder");
  await expect(page.getByText("CASE STUDIES / 03 · CLOUDEAGLE.AI")).toBeVisible();
  // Numbering and order follow the home products 01–04 (Aswin, 2026-11-20).
  await expect(page.getByRole("link", { name: /^NEXT · 04 · IN USE · RECORDED RUN/ })).toHaveAttribute("href", "/work/instagram-agent");
  await expect(page.getByRole("link", { name: "CASE STUDIES", exact: true })).toHaveAttribute("href", "/work");
  await expect(page.getByText("LAST UPDATED", { exact: true })).toBeVisible();
  const counter = page.locator("#s-break").getByRole("status");
  await expect(counter).toHaveText("No attempts yet");
  await expect(counter.getByText("No attempts yet")).toHaveCSS("font-size", "14px");
  for (const gone of ["/work/cloudeagle", "/work/dhees-instagram-agent", "/work/platform-api-work"]) {
    expect((await page.goto(gone))?.status()).toBe(404);
  }
  await page.goto("/work/instagram-agent");
  await expect(page.getByText("STATUS · IN USE · RECORDED RUN")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Instagram content intelligence agent", level: 1 })).toBeVisible();
  await page.goto("/work/instagram-agent");
  await expect(page.getByRole("link", { name: /^NEXT · 01 · IN USE · RECORDED RUN/ })).toHaveAttribute("href", "/work/job-search-agent");
  expect((await page.goto("/work/fit-check"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Job-fit AI on this site", level: 1 })).toBeVisible();
});

test("phone home: compact hood list and Products I've built (update 4)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const hood = page.locator("#m-hood");
  await expect(hood).toHaveText("How I build agentic products, with proof");
  await expect(hood).toHaveCSS("font-size", "28px");
  await expect(page.getByText("Each part links to where you can see it working.", { exact: true })).toBeVisible();
  const list = hood.locator("xpath=..");
  await expect(list.locator(":scope > a, :scope > div")).toHaveCount(12);
  await expect(list.getByRole("link", { name: /^production/ })).toHaveAttribute("href", "#break-my-ai");
  await expect(list.getByRole("link", { name: /^mcp server/ })).toHaveCount(0);
  // Phone pills are never dashed; shipped is ink.
  await expect(list.getByText("prototype", { exact: true })).toHaveCSS("border-top-style", "solid");
  await expect(list.getByText("shipped", { exact: true }).first()).toHaveCSS("color", "rgb(27, 26, 23)");

  const work = page.locator("#m-work").locator("xpath=..");
  await expect(page.locator("#m-work")).toHaveText("Products I've built");
  await expect(work.getByText("CASE STUDIES", { exact: true })).toBeVisible();
  await expect(work.getByRole("link")).toHaveCount(4);
  await expect(work.getByRole("link").nth(0)).toHaveText("IN USE · RECORDED RUNAI job search and apply agentsearch → tailor → wait for my approval → apply");
  await expect(work.getByText("wait for my approval", { exact: true })).toHaveCSS("color", "rgb(138, 85, 16)");
  await expect(work.getByRole("link").nth(1)).toHaveAttribute("href", "#fit-h");
  await expect(work.getByRole("link").nth(1)).toHaveText("LIVE HEREJob-fit AI on this siteTry it above ↑");
  await expect(work.getByText("CONCEPT", { exact: true })).toHaveCSS("color", "rgb(92, 87, 78)");
  await expect(work.getByRole("link").nth(3)).toHaveText("IN USE · RECORDED RUNInstagram content intelligence agent");
  await expect(page.locator("#work-h")).toBeHidden();
});

test("unknown post slug is a 404", async ({ page }) => {
  expect((await page.goto("/log/nope"))?.status()).toBe(404);
});

test("CV: highlight lists keep their bullets", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("main").locator("ol > li").nth(4).locator("article ul")).toHaveCSS("list-style-type", "disc");
});
