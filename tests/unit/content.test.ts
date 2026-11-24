import { evalMeta } from "@/lib/eval-results";
import { describe, expect, it } from "vitest";
import { containsTodo, hrefOf, isTodo, todo, withTodo } from "@/lib/content";

describe("content placeholders", () => {
  const link = todo("[link]");
  const n = todo("[N]");

  it("recognises placeholders, including inside composed strings and nested objects", () => {
    expect(isTodo(link)).toBe(true);
    expect(isTodo("https://example.com")).toBe(false);
    expect(containsTodo(`${n} test JDs`)).toBe(true);
    expect(containsTodo({ a: [{ b: "fine" }, { c: n }] })).toBe(true);
    expect(containsTodo({ a: ["fine"], b: 3, c: true })).toBe(false);
  });

  it("shows the placeholder next to a label only while the URL is missing", () => {
    expect(withTodo("LinkedIn", link)).toBe("LinkedIn [link]");
    expect(withTodo("LinkedIn", "https://linkedin.com/in/x")).toBe("LinkedIn");
    expect(withTodo("GitHub", link, " · ")).toBe("GitHub · [link]");
    expect(hrefOf(link)).toBe("#");
    expect(hrefOf("/about")).toBe("/about");
  });
});

describe("design update 4 content", async () => {
  const { hood } = await import("@/content/hood");
  const { products } = await import("@/content/products");
  const { CASE_STUDY_SLUGS } = await import("@/lib/case-studies");

  it("hood: the 12 parts in order; live parts jump to #top or #break-my-ai; planned has no link", () => {
    expect(hood.map((h) => h.name)).toEqual([
      "agents", "skills", "tools", "orchestration", "memory", "production",
      "guardrails", "evals", "human in loop", "data privacy", "rag", "mcp server",
    ]);
    for (const h of hood.filter((x) => x.live)) {
      expect(h.status).toBe("live here");
      expect(["#top", "#break-my-ai"]).toContain(h.href);
    }
    expect(hood.find((h) => h.status === "planned")?.href).toBeUndefined();
    // Placeholder links render as "#", as in the design.
    expect(hood.filter((h) => h.href && hrefOf(h.href) === "#").map((h) => h.name)).toEqual(["skills", "human in loop", "data privacy", "rag"]);
    expect(hood.find((h) => h.name === "evals")?.href).toBe("https://github.com/aswin-a/aswin-portfolio/tree/main/evals");
    expect(hood.find((h) => h.name === "evals")?.proof).toBe(`${evalMeta().evalCaseCount} test JDs and red-team cases, run before every change.`);
  });

  it("case studies are exactly the 4 products, in their order", () => {
    expect([...CASE_STUDY_SLUGS]).toEqual(products.map((p) => p.slug));
  });

  it("products: 4 products, each with its own case study and five steps", () => {
    expect(products.map((p) => p.num)).toEqual(["01", "02", "03", "04"]);
    for (const p of products) {
      expect(CASE_STUDY_SLUGS).toContain(p.slug);
      expect(p.flow).toHaveLength(5);
      expect(p.secondary).toEqual({ label: "Read the case study →", href: `/work/${p.slug}` });
    }
    expect(products.map((p) => p.flow.filter((f) => f.human).map((f) => f.text))).toEqual([
      ["Wait for my approval"], [], ["A person approves the diff"], [],
    ]);
  });
});
