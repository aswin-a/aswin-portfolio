import { describe, expect, it } from "vitest";
import { KB, kbEntry, type KbEntry } from "@/lib/kb/snapshot";
import { FIT_SCOPES, kbSearch, score, tokens } from "@/lib/kb/search";
import { notDone } from "@/content/kb/not-done";

describe("KB snapshot", () => {
  it("has unique ids, a label and an href on every entry", () => {
    expect(new Set(KB.map((e) => e.id)).size).toBe(KB.length);
    for (const e of KB) {
      expect(e.label).not.toBe("");
      expect(e.href).not.toBe("");
    }
  });

  it("always includes the whole not-done list", () => {
    for (const n of notDone) expect(kbEntry(n.id)?.scope).toBe("not_done");
  });

  it("is frozen", () => {
    expect(Object.isFrozen(KB)).toBe(true);
    expect(Object.isFrozen(KB[0])).toBe(true);
  });
});

describe("kb.search", () => {
  it("normalises synonyms and drops stopwords", () => {
    expect([...tokens("Own the public APIs and partner integrations")]).toEqual(["public", "api", "integrations"]);
  });

  it("is deterministic", () => {
    const reqs = ["Own a public API and partner integrations", "Hardware roadmaps from prototype to mass production"];
    expect(kbSearch(reqs).map((e) => e.id)).toEqual(kbSearch(reqs).map((e) => e.id));
  });

  it("finds the not-done entry for a hardware requirement", () => {
    const ids = kbSearch(["Hardware roadmaps from prototype to mass production"]).map((e) => e.id);
    expect(ids).toContain("hardware-roadmaps");
  });

  it("finds an agent project for an agent requirement", () => {
    const hits = kbSearch(["Ship AI agent features with clear guardrails"]);
    expect(hits.some((e) => e.scope === "projects")).toBe(true);
  });

  it("only returns the requested scopes and never facts for the fit check", () => {
    const hits = kbSearch(["platform APIs integrations agents healthcare"]);
    for (const e of hits) expect(FIT_SCOPES).toContain(e.scope);
    expect(kbSearch(["platform"], ["not_done"]).every((e) => e.scope === "not_done")).toBe(true);
  });

  it("returns nothing for text with no overlap", () => {
    expect(kbSearch(["zzzz qqqq"])).toEqual([]);
    expect(score("zzzz", KB[0])).toBe(0);
  });
});

// ---------- Milestone 7: kb.search gaps ----------

const entry = (id: string, scope: KbEntry["scope"], text: string): KbEntry => ({ id, scope, label: id, href: `/${id}`, text, head: text, lines: [], cv: [], tags: [], todos: [] });

describe("kb.search · ranking and caps (M7)", () => {
  const kb = [
    entry("p-a", "projects", "api integrations platform"),
    entry("p-b", "projects", "api integrations"),
    entry("r-c", "roles", "api"),
    entry("n-a", "not_done", "NOT DONE: api hardware. Closest: x"),
    entry("n-b", "not_done", "NOT DONE: api. Closest: y"),
    entry("f-a", "facts", "api integrations platform"),
  ];

  it("returns at most two evidence entries and one not-done entry per requirement, best first", () => {
    const ids = kbSearch(["api integrations platform hardware"], FIT_SCOPES, kb).map((e) => e.id);
    expect(ids).toEqual(["p-a", "p-b", "n-a"]);
  });

  it("breaks score ties by id, so the output never depends on KB order", () => {
    const tied = [entry("z", "projects", "api"), entry("a", "projects", "api"), entry("m", "projects", "api")];
    expect(kbSearch(["api"], ["projects"], tied).map((e) => e.id)).toEqual(["a", "m"]);
    expect(kbSearch(["api"], ["projects"], [...tied].reverse()).map((e) => e.id)).toEqual(["a", "m"]);
  });

  it("unions entries across requirements without duplicates, ordered by requested scope then id", () => {
    const ids = kbSearch(["api", "api integrations platform"], ["roles", "projects", "not_done"], kb).map((e) => e.id);
    expect(ids).toEqual(["p-a", "p-b", "n-a"]);
    expect(kbSearch(["api"], ["not_done", "roles", "projects"], [entry("r-a", "roles", "api"), ...kb.slice(3, 4)]).map((e) => e.id)).toEqual(["n-a", "r-a"]);
  });

  it("each scope alone returns only that scope; facts only when asked", () => {
    for (const s of ["roles", "projects", "not_done", "facts"] as const) {
      const hits = kbSearch(["api integrations platform"], [s], kb);
      expect(hits.length, s).toBeGreaterThan(0);
      expect(hits.every((e) => e.scope === s), s).toBe(true);
    }
    expect(kbSearch(["api integrations platform"], FIT_SCOPES, kb).some((e) => e.scope === "facts")).toBe(false);
  });

  it("no requirements, no results", () => {
    expect(kbSearch([], FIT_SCOPES, kb)).toEqual([]);
  });

  it("score counts distinct overlapping tokens, synonyms included", () => {
    const e = entry("s", "projects", "Built API integrations with guardrails");
    expect(score("APIs", e)).toBe(1);
    expect(score("APIs and connectors", e)).toBe(2);
    expect(score("APIs, connectors and safety", e)).toBe(3);
    expect(score("API API API", e)).toBe(1);
  });
});
