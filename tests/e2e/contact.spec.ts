import { CONTACT_COPY } from "@/lib/contact/copy";
import { expect, FAKE, test, type Page } from "./fixtures";

/**
 * The shared Footer's contact area (Footer.dc.html, FooterStates.dc.html, design update 7; SPEC §9)
 * against the real /api/contact under AI_FAKE. Error and 429 are mocked, as the spec asks.
 */
const contact = (page: Page) => page.locator("section#contact");
const form = (page: Page) => contact(page).locator("form");
const button = (page: Page) => form(page).getByRole("button");
const line = (page: Page) => contact(page).getByTestId("contact-line");
const SAMPLE = { name: "Priya Raman", email: "priya@acme.com", msg: "We’re hiring a Senior Platform PM for our integrations team. Open to a call this week?" };

async function fill(page: Page, f: Partial<typeof SAMPLE> = SAMPLE) {
  if (f.name !== undefined) await contact(page).getByLabel("Name").fill(f.name);
  if (f.email !== undefined) await contact(page).getByLabel("Work email").fill(f.email);
  if (f.msg !== undefined) await contact(page).getByLabel("Message").fill(f.msg);
}
const mock = (page: Page, status: number, body: unknown) =>
  page.route("**/api/contact", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));

test.describe("contact form: the 6 states (FooterStates.dc.html)", () => {
  test("01 Ready: empty form, WhatsApp and call beside it", async ({ page }) => {
    await page.goto("/about");
    for (const label of ["Name", "Work email", "Role", "Message"]) await expect(contact(page).getByLabel(label, { exact: true })).toHaveValue("");
    await expect(button(page)).toHaveText("Send to Aswin");
    await expect(button(page)).toBeEnabled();
    await expect(form(page)).toHaveAttribute("novalidate", "");
    await expect(form(page)).toHaveAttribute("aria-busy", "false");
    await expect(line(page)).toHaveCount(0);
    const wa = contact(page).getByRole("link", { name: "WhatsApp me" });
    await expect(wa).toHaveAttribute("target", "_blank");
    await expect(wa).toHaveAttribute("rel", "noopener");
    await expect(contact(page).getByRole("link", { name: "Call me" })).toBeVisible();
    // Config unset in e2e: the design's placeholders.
    await expect(contact(page).getByText("+91 [number] · calls [Mon–Fri, 10am–7pm IST] · WhatsApp anytime", { exact: true })).toBeVisible();
    await expect(contact(page).getByLabel("Name")).toHaveAttribute("maxlength", "120");
    await expect(contact(page).getByLabel("Message")).toHaveAttribute("maxlength", "5000");
  });

  test("02 Invalid: checked on send, each fix clears as it's made", async ({ page }) => {
    await page.goto("/about");
    let posted = 0;
    page.on("request", (r) => void (r.url().endsWith("/api/contact") && posted++));
    // Typing doesn't check.
    await fill(page, { name: "Priya Raman", email: "priya@acme" });
    await expect(contact(page).getByLabel("Work email")).not.toHaveAttribute("aria-invalid", "true");
    await button(page).click();
    await expect(line(page)).toHaveAttribute("role", "alert");
    await expect(line(page)).toContainText("CHECK");
    await expect(line(page)).toContainText("2 fields need a fix before this can go.");
    const email = contact(page).getByLabel("Work email");
    const msg = contact(page).getByLabel("Message");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "c-email-err");
    await expect(page.locator("#c-email-err")).toHaveText("Enter an email like name@company.com.");
    await expect(page.locator("#c-msg-err")).toHaveText("Add a line or two about the role.");
    await expect(email).toHaveClass(/border-amber-border/);
    await expect(contact(page).getByLabel("Name")).not.toHaveAttribute("aria-invalid", "true");
    // Role is optional.
    await expect(contact(page).getByLabel("Role", { exact: true })).not.toHaveAttribute("aria-invalid", "true");
    await email.fill("priya@acme.com");
    await expect(line(page)).toContainText("One field needs a fix before this can go.");
    await expect(page.locator("#c-email-err")).toHaveCount(0);
    await msg.fill("Hi");
    await expect(line(page)).toHaveCount(0);
    await expect(page.locator("#c-msg-err")).toHaveCount(0);
    // Name cleared: "Add your name."
    await contact(page).getByLabel("Name").fill("");
    await button(page).click();
    await expect(page.locator("#c-name-err")).toHaveText("Add your name.");
    expect(posted).toBe(0);
  });

  test("03 Sending: only while the request is in flight", async ({ page }) => {
    await page.goto("/");
    await fill(page);
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/contact", async (route) => {
      await held;
      await route.continue();
    });
    await button(page).click();
    await expect(button(page)).toHaveText("Sending…");
    await expect(button(page)).toBeDisabled();
    await expect(button(page)).toHaveClass(/cursor-not-allowed/);
    await expect(form(page)).toHaveAttribute("aria-busy", "true");
    for (const label of ["Name", "Work email", "Role", "Message"]) {
      await expect(contact(page).getByLabel(label, { exact: true })).toBeDisabled();
      await expect(contact(page).getByLabel(label, { exact: true })).toHaveCSS("opacity", "0.6");
    }
    await expect(form(page).getByRole("status")).toHaveText(CONTACT_COPY.sendingStatus);
    release();
    await expect(contact(page).getByText("Thanks. Your note is with Aswin.")).toBeVisible();
  });

  test("04 Sent: the confirmation, from the real endpoint", async ({ page }) => {
    await page.goto("/about");
    await contact(page).getByLabel("Role", { exact: true }).fill("Senior Platform PM");
    await fill(page);
    const req = page.waitForRequest("**/api/contact");
    await button(page).click();
    expect((await req).postDataJSON()).toMatchObject({ name: SAMPLE.name, email: SAMPLE.email, role: "Senior Platform PM", msg: SAMPLE.msg });
    const sent = contact(page).getByRole("status");
    await expect(sent.getByText("✓ SENT")).toBeVisible();
    await expect(sent.getByText("Thanks. Your note is with Aswin.")).toBeVisible();
    await expect(sent.getByText("He replies from his own inbox, usually within [response time].")).toBeVisible();
    await expect(form(page)).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("contact-draft"))).toBeNull();
  });

  test("05 Error: message kept (also across a reload), Try again, WhatsApp offered", async ({ page }) => {
    await page.goto("/log");
    await mock(page, 502, { ok: false, code: "error" });
    await fill(page);
    await button(page).click();
    await expect(line(page)).toHaveAttribute("role", "alert");
    await expect(line(page)).toContainText("NOT SENT");
    await expect(line(page)).toContainText("That didn’t go through, but your message is still here. Try again, or reach me another way.");
    await expect(line(page).getByRole("link", { name: "Send it on WhatsApp instead →" })).toHaveAttribute("target", "_blank");
    await expect(button(page)).toHaveText("Try again");
    await expect(button(page)).toBeEnabled();
    await expect(contact(page).getByLabel("Message")).toHaveValue(SAMPLE.msg);
    await page.reload();
    await expect(contact(page).getByLabel("Message")).toHaveValue(SAMPLE.msg);
    await expect(contact(page).getByLabel("Name")).toHaveValue(SAMPLE.name);
  });

  test("05 Error: a Turnstile failure is an error, never invalid", async ({ page }) => {
    await page.goto("/");
    await mock(page, 403, { ok: false, code: "error" });
    await fill(page);
    await button(page).click();
    await expect(line(page)).toContainText("NOT SENT");
  });

  test("06 Rate-limited: says why and when, keeps the message, points to WhatsApp", async ({ page }) => {
    await page.goto("/");
    await mock(page, 429, { ok: false, code: "rate_limited", retryAfterSec: 1380 });
    await fill(page);
    await button(page).click();
    await expect(line(page)).toHaveAttribute("role", "status");
    await expect(line(page)).toContainText("PAUSED");
    await expect(line(page)).toContainText(
      "This form takes 3 messages an hour from one connection, to keep spam out. Your message is saved here; send it again in 23 minutes, or right now on WhatsApp.",
    );
    await expect(line(page)).toHaveClass(/border-dashed/);
    await expect(line(page).getByRole("link", { name: "Send it on WhatsApp instead →" })).toBeVisible();
    await expect(button(page)).toHaveText("Send to Aswin");
    await expect(button(page)).toBeDisabled();
    await expect(contact(page).getByLabel("Message")).toHaveValue(SAMPLE.msg);
  });

  test("06 Rate-limited: reopens when the window ends", async ({ page }) => {
    await page.goto("/");
    await mock(page, 429, { ok: false, code: "rate_limited", retryAfterSec: 1 });
    await fill(page);
    await button(page).click();
    await expect(line(page)).toContainText("send it again in 1 minute,");
    await expect(button(page)).toBeDisabled();
    await expect(button(page)).toBeEnabled({ timeout: 5000 });
    await expect(line(page)).toHaveCount(0);
    await expect(contact(page).getByLabel("Message")).toHaveValue(SAMPLE.msg);
  });

  test("06 Rate-limited: the 4th message in an hour, from the real bucket", async ({ page }) => {
    await page.goto("/");
    // From the page, so the requests carry this test's visitor header (fixtures.ts).
    const codes = await page.evaluate(async () => {
      const out: number[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Sam", email: "sam@company.example", msg: "hi", turnstileToken: "" }),
        });
        out.push(res.status);
      }
      return out;
    });
    expect(codes).toEqual([200, 200, 200]);
    await fill(page);
    await button(page).click();
    await expect(line(page)).toContainText(/send it again in (59|60) minutes/);
  });

  test("fake marker: the server's own 429 reaches the PAUSED line", async ({ page }) => {
    await page.goto("/");
    await fill(page, { ...SAMPLE, msg: `Hello ${FAKE.limited}` });
    await button(page).click();
    await expect(line(page)).toContainText("send it again in 23 minutes");
  });
});

test.describe("nav Contact link (Nav.dc.html update 7)", () => {
  test("is the 5th link (Stack added in update 11) and scrolls to #contact on the current page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/log");
    const nav = page.getByRole("navigation", { name: "Main" });
    const links = nav.getByRole("link");
    await expect(links).toHaveText(["Aswinpm · builds for agents", "Case studies", "Stack", "Build log", "CV", "Contact"]);
    await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");
    await nav.getByRole("link", { name: "Contact" }).click();
    await expect(page.locator("#contact")).toBeInViewport();
    expect(new URL(page.url()).pathname).toBe("/log");
  });
});

test.describe("SEO and GEO routes", () => {
  test("robots.txt allows the AI crawlers and disallows /api/", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const t = await res.text();
    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "GPTBot", "ClaudeBot", "Google-Extended"])
      expect(t).toContain(`User-Agent: ${bot}`);
    expect(t).toContain("Disallow: /api/");
    expect(t).toContain("Sitemap: https://aswin-a.com/sitemap.xml");
  });

  test("sitemap.xml lists the pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.headers()["content-type"]).toContain("xml");
    const t = await res.text();
    for (const p of ["/about", "/work", "/log/integrations-experience-is-agent-experience"]) expect(t).toContain(`https://aswin-a.com${p}`);
    // Hidden case studies stay out of the sitemap (content/case-studies/visibility.ts).
    expect(t).not.toContain("https://aswin-a.com/work/integration-builder");
  });

  for (const [path, type, needle] of [
    ["/llms.txt", "text/plain", "# Aswin A"],
    ["/llms-full.txt", "text/plain", "## Experience"],
    ["/rss.xml", "application/rss+xml", '<rss version="2.0"'],
  ] as const) {
    test(`${path} is served from /content`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain(type);
      expect(await res.text()).toContain(needle);
    });
  }

  test("pages carry canonical, OG image and JSON-LD", async ({ page, request }) => {
    await page.goto("/about");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aswin-a.com/about");
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.mainEntity.alumniOf[0].name).toBe("IIT Mandi");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    const img = await request.get(new URL(og!).pathname + new URL(og!).search);
    expect(img.headers()["content-type"]).toBe("image/png");

    await page.goto("/work/integration-builder");
    expect(JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)["@type"]).toBe("CreativeWork");
    await page.goto("/log/integrations-experience-is-agent-experience");
    expect(JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)["@type"]).toBe("Article");
    await page.goto("/");
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", /\/rss\.xml$/);
  });

  test("AI crawlers get the page as usual", async ({ request }) => {
    const res = await request.get("/about", { headers: { "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2)" } });
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("Talk to Aswin.");
  });
});
