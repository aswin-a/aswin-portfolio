import { describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { cvHeader } from "@/content/cv";
import { siteMeta } from "@/content/site-meta";
import { AI_CRAWLERS, aiCrawlerOf } from "@/lib/ai-crawlers";
import { POSTHOG_OPTIONS, type AnalyticsEvents } from "@/lib/analytics";
import { CASE_STUDY_SLUGS } from "@/lib/case-studies";
import { llmsFullTxt, llmsTxt } from "@/lib/llms";
import { POST_SLUGS } from "@/lib/posts";
import { rssXml } from "@/lib/rss";
import { logCrawl } from "@/lib/server/log-crawl";
import { isoDate, personJsonLd, profilePageJsonLd, SITE_URL } from "@/lib/seo";

// MDX can't be imported by Vitest; the loaders are stubbed with the real slugs.
vi.mock("@/lib/case-studies", () => {
  const CASE_STUDY_SLUGS = ["job-search-agent", "fit-check", "integration-builder", "instagram-agent"];
  return {
    CASE_STUDY_SLUGS,
    caseStudies: async () =>
      CASE_STUDY_SLUGS.map((slug) => ({ slug, title: `Study ${slug}`, lede: "Lede", facts: [{ label: "Built", value: "x" }], repo: "#" })),
  };
});
vi.mock("@/lib/posts", () => {
  const POST_SLUGS = ["a-post", "b-post"];
  return {
    POST_SLUGS,
    posts: async () => [
      { slug: "a-post", title: "A & <post>", tag: "BUILD NOTE", date: "12 Nov 2026", summary: "Summary A" },
      { slug: "b-post", title: "B", tag: "TIL", date: "[date]", summary: "Summary B" },
    ],
  };
});

describe("robots.txt", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  it("allows every listed AI crawler by name and disallows /api/", () => {
    const named = rules.find((x) => Array.isArray(x.userAgent));
    expect(named?.userAgent).toEqual([...AI_CRAWLERS]);
    expect(named?.allow).toBe("/");
    expect(named?.disallow).toBe("/api/");
  });
  it("keeps /api/ out for everyone and links the sitemap", () => {
    expect(rules.find((x) => x.userAgent === "*")?.disallow).toBe("/api/");
    expect(r.sitemap).toBe("https://aswin-a.com/sitemap.xml");
  });
  it("lists the nine crawlers from SPEC §11", () => {
    expect(AI_CRAWLERS).toEqual(["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "GPTBot", "ClaudeBot", "Google-Extended"]);
  });
});

describe("sitemap.xml", () => {
  it("has every page on the production domain", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(SITE_URL).toBe(`https://${siteMeta.domain}`);
    for (const p of ["/", "/work", "/log", "/about", "/about.md"]) expect(urls).toContain(new URL(p, SITE_URL).toString());
    for (const s of CASE_STUDY_SLUGS) expect(urls).toContain(`${SITE_URL}/work/${s}`);
    for (const s of POST_SLUGS) expect(urls).toContain(`${SITE_URL}/log/${s}`);
    expect(urls.every((u) => u.startsWith(SITE_URL))).toBe(true);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
  });
});

describe("llms.txt and llms-full.txt", () => {
  it("llms.txt follows the llmstxt.org shape and links the content", async () => {
    const t = await llmsTxt();
    expect(t.startsWith(`# ${cvHeader.name}\n\n> `)).toBe(true);
    expect(t).toContain(`(${SITE_URL}/about)`);
    expect(t).toContain(`(${SITE_URL}/work/fit-check)`);
    expect(t).toContain(`(${SITE_URL}/log/a-post)`);
    expect(t).toContain(`(${SITE_URL}/llms-full.txt)`);
  });
  it("llms-full.txt carries products, case studies, posts and the whole CV", async () => {
    const t = await llmsFullTxt();
    expect(t).toContain("## Products I've built");
    expect(t).toContain("Study integration-builder");
    expect(t).toContain("Summary A");
    expect(t).toContain(cvHeader.summary);
    expect(t).toContain("## Experience");
  });
});

describe("rss.xml", () => {
  it("is RSS 2.0 with escaped titles and a date only when one is set", async () => {
    const x = await rssXml();
    expect(x).toContain('<rss version="2.0"');
    expect(x).toContain("<title>A &amp; &lt;post&gt;</title>");
    expect(x).toContain(`<link>${SITE_URL}/log/a-post</link>`);
    expect(x).toContain("<pubDate>Thu, 12 Nov 2026 00:00:00 GMT</pubDate>");
    expect(x.match(/<pubDate>/g)).toHaveLength(1);
  });
  it("isoDate skips placeholders", () => {
    expect(isoDate("[date]")).toBeNull();
    expect(isoDate("12 Nov 2026")).toBe("2026-11-12T00:00:00.000Z");
  });
});

describe("JSON-LD", () => {
  it("CV page Person: alumniOf IIT Mandi, occupations from the CV, sameAs LinkedIn and GitHub", () => {
    const p = personJsonLd(true) as Record<string, unknown>;
    expect(p["@type"]).toBe("Person");
    expect(p.name).toBe("Aswin A");
    expect(p.alumniOf).toEqual([{ "@type": "CollegeOrUniversity", name: "IIT Mandi" }]);
    const occ = (p.hasOccupation as { name: string }[]).map((o) => o.name);
    expect(occ).toEqual(["Founder and Product Lead", "Senior Product Manager", "Co-Founder, Product and Technology"]);
    // No CV role is current, so no worksFor.
    expect(p.worksFor).toBeUndefined();
    expect(p.sameAs).toEqual([cvHeader.linkedin.href, siteMeta.github]);
  });
  it("home Person is the short form inside a ProfilePage", () => {
    const pp = profilePageJsonLd("/") as { "@type": string; mainEntity: Record<string, unknown> };
    expect(pp["@type"]).toBe("ProfilePage");
    expect(pp.mainEntity.alumniOf).toBeUndefined();
  });
});

describe("AI crawler logging", () => {
  it.each([
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot", "GPTBot"],
    ["Mozilla/5.0 (compatible; Claude-SearchBot/1.0)", "Claude-SearchBot"],
    ["Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "ClaudeBot"],
    ["Mozilla/5.0 ... compatible; ChatGPT-User/1.0", "ChatGPT-User"],
    ["Mozilla/5.0 (compatible; PerplexityBot/1.0)", "PerplexityBot"],
  ])("recognises %s", (ua, bot) => expect(aiCrawlerOf(ua)).toBe(bot));
  it("ignores browsers and other bots", () => {
    expect(aiCrawlerOf("Mozilla/5.0 (Macintosh) Chrome/140 Safari/537.36")).toBeNull();
    expect(aiCrawlerOf("Googlebot/2.1")).toBeNull();
    expect(aiCrawlerOf(null)).toBeNull();
  });
  it("inserts only bot and path into ai_crawls", async () => {
    const f = vi.fn(async () => new Response(null, { status: 201 }));
    await logCrawl("GPTBot", "/about", { SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" }, f);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/ai_crawls");
    expect(JSON.parse(init.body as string)).toEqual({ bot: "GPTBot", path: "/about" });
  });
  it("does nothing without Supabase env", async () => {
    const f = vi.fn();
    await logCrawl("GPTBot", "/", {}, f);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("analytics", () => {
  it("is cookieless with autocapture and recording off", () => {
    expect(POSTHOG_OPTIONS).toMatchObject({ cookieless_mode: "always", persistence: "memory", autocapture: false, disable_session_recording: true });
  });
  it("events carry no free-text props", () => {
    // Compile-time: every prop is an enum, a boolean or absent. A plain `string` prop fails here.
    type Props = AnalyticsEvents[keyof AnalyticsEvents];
    type Values = Props extends infer P ? (P extends Record<string, infer V> ? V : never) : never;
    type IsFree<V> = string extends V ? true : false;
    const noFreeText: IsFree<Values> = false;
    expect(noFreeText).toBe(false);
  });
});
