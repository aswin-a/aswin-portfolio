import { describe, expect, it } from "vitest";
import { headText, pagePlaceholders, payloadStrings, visibleText } from "@/scripts/check-content.mjs";

/** A page shaped like Next's prerendered HTML: head tags, JSON-LD, body text and the RSC payload. */
function page({ title = "Aswin", description = "Platform PM", body = "<p>Hello</p>", payload = "", ld = "{}" } = {}) {
  const push = (s: string) => `<script>self.__next_f.push([1,${JSON.stringify(s)}])</script>`;
  return `<html><head><title>${title}</title><meta name="description" content="${description}"/><meta property="og:description" content="${description}"/><script type="application/ld+json">${ld}</script></head><body>${body}${push(payload)}</body></html>`;
}

describe("check:content --html (SPEC §12)", () => {
  it("a page with nothing to fill passes, Tailwind arbitrary values included", () => {
    const html = page({ body: '<div class="min-h-[170px] p-[18px]">Done</div>', payload: '1:["$","div",null,{"className":"gap-[10px] md:[grid-template-columns:1fr] grid-cols-[repeat(auto-fit,minmax(300px,1fr))]","children":"Shipped"}]' });
    expect(pagePlaceholders(html)).toEqual([]);
  });
  it("finds placeholders in the page text", () => {
    expect(pagePlaceholders(page({ body: "<p>[25] test JDs</p>" }))).toEqual(["[25]"]);
    expect(pagePlaceholders(page({ body: "<p>TODO(aswin)</p>" }))).toEqual(["TODO(aswin)"]);
  });
  it("finds placeholders in <title>, meta and OG tags, and JSON-LD", () => {
    expect(pagePlaceholders(page({ description: "[One-line lede]" }))).toEqual(["[One-line lede]"]);
    expect(pagePlaceholders(page({ title: "[Post title] · Aswin" }))).toEqual(["[Post title]"]);
    expect(pagePlaceholders(page({ ld: '{"jobTitle":"[role]"}' }))).toEqual(["[role]"]);
    expect(headText(page({ description: "A &amp; B" }))).toContain("A & B");
  });
  it("finds placeholders that only render after hydration (the RSC payload)", () => {
    const html = page({ payload: '1:["$","$L2",null,{"meta":{"offlineEval":"[passed]/[total] cases · [date]"}}]' });
    expect(payloadStrings(html)).toContain("[passed]/[total] cases · [date]");
    expect(pagePlaceholders(html).sort()).toEqual(["[date]", "[passed]", "[total]"]);
  });
  it('counts links to "#"', () => {
    expect(pagePlaceholders(page({ body: '<a href="#">GitHub</a><a href="#" class="x">Demo</a><a href="#contact">Contact</a>' }))).toEqual(['2 link(s) to "#"']);
  });
  it("visibleText drops scripts, styles and tags", () => {
    expect(visibleText("<style>.a{}</style><script>[x]</script><b>Hi</b>").trim()).toBe("Hi");
  });
});
