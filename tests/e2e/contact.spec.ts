import { CONTACT_COPY } from "@/lib/contact/copy";
import { expect, FAKE, test, type Page } from "./fixtures";

/** The shared Footer's contact form (Footer.dc.html, SPEC §9) against the real /api/contact under AI_FAKE. */
const contact = (page: Page) => page.locator("section#contact");

async function fill(page: Page, msg = "Hi Aswin, can we talk about a platform PM role?") {
  await contact(page).getByLabel("Name").fill("Sam Doe");
  await contact(page).getByLabel("Work email").fill("sam@company.example");
  await contact(page).getByLabel("Message").fill(msg);
}

test.describe("contact form", () => {
  test("sends and shows the designed success state", async ({ page }) => {
    await page.goto("/about");
    await fill(page);
    const req = page.waitForRequest("**/api/contact");
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    const body = (await req).postDataJSON() as Record<string, string>;
    expect(body).toMatchObject({ name: "Sam Doe", email: "sam@company.example", role: "" });
    const sent = contact(page).getByRole("status");
    await expect(sent.getByText("✓ SENT")).toBeVisible();
    await expect(sent.getByText("Thanks. Your note is with Aswin.")).toBeVisible();
    await expect(sent.getByText(/^He replies from his own inbox, usually within /)).toBeVisible();
    await expect(contact(page).locator("form")).toHaveCount(0);
  });

  test("shows Sending… while the request runs", async ({ page }) => {
    await page.goto("/");
    await fill(page);
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/contact", async (route) => {
      await held;
      await route.continue();
    });
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    await expect(contact(page).getByRole("button", { name: CONTACT_COPY.sending })).toBeDisabled();
    release();
    await expect(contact(page).getByText("Thanks. Your note is with Aswin.")).toBeVisible();
  });

  test("a failed send shows the inline error with a mailto link and keeps the form", async ({ page }) => {
    await page.goto("/log");
    await fill(page, `Hello ${FAKE.error}`);
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    const line = contact(page).getByTestId("contact-line");
    await expect(line).toContainText(CONTACT_COPY.error.before.trim());
    await expect(line).toContainText(CONTACT_COPY.error.after.trim());
    await expect(line.getByRole("link")).toBeVisible();
    await expect(line).toHaveAttribute("aria-live", "polite");
    await expect(contact(page).getByLabel("Message")).toHaveValue(`Hello ${FAKE.error}`);
    await expect(contact(page).getByRole("button", { name: "Send to Aswin" })).toBeEnabled();
  });

  test("over the limit shows the limit line", async ({ page }) => {
    await page.goto("/");
    await fill(page, `Hello ${FAKE.limited}`);
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    await expect(contact(page).getByTestId("contact-line")).toContainText(CONTACT_COPY.limited.before.trim());
  });

  test("the 4th message in an hour is limited by the real bucket", async ({ page }) => {
    await page.goto("/");
    // From the page, so the requests carry this test's visitor header (fixtures.ts).
    const statuses = await page.evaluate(async () => {
      const out: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Sam", email: "sam@company.example", msg: "hi", turnstileToken: "" }),
        });
        out.push(((await res.json()) as { status: string }).status);
      }
      return out;
    });
    expect(statuses).toEqual(["sent", "sent", "sent"]);
    await fill(page);
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    await expect(contact(page).getByTestId("contact-line")).toContainText(CONTACT_COPY.limited.before.trim());
  });

  test("an invalid email is refused with the invalid line", async ({ page }) => {
    await page.goto("/");
    const res = await page.request.post("/api/contact", { data: { name: "Sam", email: "nope", msg: "hi" } });
    expect(res.status()).toBe(400);
    expect((await res.json()).status).toBe("invalid");
    // The form's own type="email" would block "nope" in the browser, so test an empty message instead.
    await contact(page).getByLabel("Name").fill("Sam");
    await contact(page).getByLabel("Work email").fill("sam@company.example");
    await contact(page).getByRole("button", { name: "Send to Aswin" }).click();
    await expect(contact(page).getByTestId("contact-line")).toHaveText(CONTACT_COPY.invalid);
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
    for (const p of ["/about", "/work/integration-builder", "/log/integrations-experience-is-agent-experience"]) expect(t).toContain(`https://aswin-a.com${p}`);
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
