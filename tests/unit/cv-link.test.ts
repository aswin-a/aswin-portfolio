import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cvItems } from "@/content/cv";
import { cvHref, cvLineText, formatTarget, isHighlighted, parseCvHash, resolves, toTargets } from "@/lib/cv-link";
import { KB, entryHref, formatEntries, kbEntry } from "@/lib/kb/snapshot";
import { guardCitations, guardHonesty } from "@/lib/run/guards";
import type { EvidenceCard } from "@/lib/ai/schemas";
import { siteRepoUrl } from "@/components/footer";

/** CV_ITEMS from About.dc.html: the `#cv=` indices are the design's, so the order must match. */
function designItems(): { id: string; highlights?: string[]; groups?: { name: string; items: string[] }[] }[] {
  const html = readFileSync("design/About.dc.html", "utf8");
  const src = html.slice(html.indexOf("var CV_ITEMS"), html.indexOf("var CV_SKILLS"));
  // The design file is our own checked-in prototype; evaluating its data array is safe here.
  return new Function(`${src}; return CV_ITEMS;`)();
}

describe("CV order (design update 14: link indices follow CV_ITEMS)", () => {
  it("matches About.dc.html item for item, area for area, line for line", () => {
    const d = designItems();
    expect(cvItems.map((it) => it.id)).toEqual(d.map((it) => it.id));
    for (const it of cvItems) {
      const di = d.find((x) => x.id === it.id);
      expect(it.highlights).toEqual(di?.highlights ?? []);
      expect((it.groups ?? []).map((g) => [g.name, g.items])).toEqual((di?.groups ?? []).map((g) => [g.name, g.items]));
    }
  });
});

/** Entries with nothing on the CV to point at (SPEC §6.1). Every other entry must have a locator. */
const NOT_ON_CV = new Set([
  "integration-builder", // a take-home concept, from content/products.ts
  "fact-title", // the CV header
  "fact-focus",
  "fact-location",
  "fact-years", // the stats
  "fact-stats",
  "fact-ai-work", // spans every side project; labelled "Case studies"
  "fact-career-total", // spans every role
]);

describe("KB CV locators", () => {
  it("every locator and every line locator resolves to the CV", () => {
    for (const e of KB) {
      for (const at of e.cv) expect(resolves(at), `${e.id} → ${JSON.stringify(at)}`).toBe(true);
      for (const l of e.lines) expect(resolves(l.at), `${e.id} line → ${JSON.stringify(l.at)}`).toBe(true);
    }
  });

  it("each numbered line is exactly the CV text at its locator, so the highlight is what the claim was grounded on", () => {
    for (const e of KB) for (const l of e.lines) expect(cvLineText(l.at), e.id).toBe(l.text);
  });

  it("every entry built from the CV has a locator", () => {
    const missing = KB.filter((e) => e.cv.length === 0 && e.scope !== "not_done" && !NOT_ON_CV.has(e.id) && !e.id.startsWith("fact-skills-"));
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it("every line sits inside its entry's locator", () => {
    for (const e of KB) {
      for (const l of e.lines) {
        const inside = e.cv.some((c) => c.roleId === l.at.roleId && (c.group === undefined || c.group === l.at.group) && (c.item === undefined || c.item === l.at.item));
        expect(inside, `${e.id} ${JSON.stringify(l.at)}`).toBe(true);
      }
    }
  });

  it("shows the model numbered lines it can cite", () => {
    const text = formatEntries([kbEntry("zelthy-core-platform")!]);
    expect(text).toMatch(/^\[zelthy-core-platform\] \(projects\) Zelthy: Core platform and integrations/);
    expect(text).toContain("\n  L7 Ran API design reviews");
    expect(text).toContain("\n  L12 Migrated client master data");
  });

  it("labels CV entries 'CV · {org} · {area}' with the CV's own area names", () => {
    expect(kbEntry("zelthy-core-platform")?.label).toBe("CV · Zelthy · Core platform and integrations");
    expect(kbEntry("zelthy-leadership")?.label).toBe("CV · Zelthy · Team leadership");
    expect(kbEntry("platform-api")?.label).toBe("CV · Zelthy");
    expect(kbEntry("solar-labs")?.label).toBe("CV · The Solar Labs");
    expect(kbEntry("healthcare-integrations")?.label).toBe("CV · Zelthy · healthcare");
  });
});

describe("#cv= links (the design's format)", () => {
  it("parses the design's examples", () => {
    expect(parseCvHash("#cv=zelthy.0.6-9")?.targets).toEqual([{ id: "zelthy", group: 0, items: [6, 7, 8, 9] }]);
    expect(parseCvHash("cv=zelthy.6+zelthy.5.2&req=Lead")).toEqual({
      targets: [
        { id: "zelthy", group: 6, items: [] },
        { id: "zelthy", group: 5, items: [2] },
      ],
      req: "Lead",
    });
    expect(parseCvHash("#cv=dhees")?.targets).toEqual([{ id: "dhees", group: null, items: [] }]);
    expect(parseCvHash("#cv=dhees..2,4")?.targets).toEqual([{ id: "dhees", group: null, items: [2, 4] }]);
    expect(parseCvHash("#cv=nobody.1")).toBeNull();
    expect(parseCvHash("#contact")).toBeNull();
  });

  it("formats targets the way the design writes them", () => {
    expect(formatTarget({ id: "zelthy", group: 0, items: [6, 7, 8, 9] })).toBe("zelthy.0.6-9");
    expect(formatTarget({ id: "zelthy", group: 0, items: [7, 10] })).toBe("zelthy.0.7,10");
    expect(formatTarget({ id: "zelthy", group: 1, items: [0, 1] })).toBe("zelthy.1.0-1");
    expect(formatTarget({ id: "dhees", group: null, items: [] })).toBe("dhees");
    expect(formatTarget({ id: "dhees", group: null, items: [3] })).toBe("dhees..3");
  });

  it("a whole area wins over single lines in it", () => {
    expect(toTargets([{ roleId: "zelthy", group: 3, item: 1 }, { roleId: "zelthy", group: 3 }])).toEqual([{ id: "zelthy", group: 3, items: [] }]);
  });

  it("highlights every point of a whole-area target, and none for a whole-role target", () => {
    const area = [{ id: "zelthy", group: 6, items: [] }];
    expect(isHighlighted(area, 6, 0)).toBe(true);
    expect(isHighlighted([{ id: "dhees", group: null, items: [] }], null, 0)).toBe(false);
  });

  it("rebuilds the design's proof and source links from cited lines", () => {
    const core = kbEntry("zelthy-core-platform")!;
    expect(entryHref(core, [7, 8, 9, 10], "Own a public API and partner integrations")).toBe(
      "/about#cv=zelthy.0.6-9&req=Own%20a%20public%20API%20and%20partner%20integrations",
    );
    const health = kbEntry("healthcare-integrations")!;
    const nums = health.lines.flatMap((l, i) => (["0.7", "0.10", "2.3", "3.0"].includes(`${l.at.group}.${l.at.item}`) ? [i + 1] : []));
    expect(entryHref(health, nums, "What's his healthcare experience?")).toBe("/about#cv=zelthy.0.7,10+zelthy.2.3+zelthy.3.0&req=What's%20his%20healthcare%20experience%3F");
  });

  it("falls back to the whole entry when no cited line is valid, and leaves case studies alone", () => {
    const core = kbEntry("zelthy-core-platform")!;
    expect(entryHref(core, [99, 0])).toBe("/about#cv=zelthy.0");
    expect(entryHref(kbEntry("dhees")!, [])).toBe("/about#cv=dhees");
    expect(entryHref(kbEntry("job-search-agent")!, [1])).toBe("/work/job-search-agent");
    expect(cvHref([])).toBe("/about");
  });
});

describe("guard.citations · cited lines", () => {
  it("drops line numbers the source doesn't have and links the rest", () => {
    const src = kbEntry("zelthy-core-platform")!;
    const req = "Own a public API and partner integrations";
    const cards: EvidenceCard[] = [{ type: "match", req, evidence: "Ran API design reviews.", sourceId: src.id, lines: [7, 7, 42] }];
    const g1 = guardCitations([req], cards, [src]);
    expect(g1.droppedLines).toBe(2);
    expect(g1[0]).toMatchObject({ lines: [7] });
    const g2 = guardHonesty(g1, []);
    expect(g2.matches[0].href).toBe("/about#cv=zelthy.0.6&req=Own%20a%20public%20API%20and%20partner%20integrations");
    expect(g2.matches[0].source).toBe("CV · Zelthy · Core platform and integrations");
  });
});

describe("footer · site-repo link (design update 14)", () => {
  it("is hidden while SITE_REPO_URL is unset or not an https URL", () => {
    expect(siteRepoUrl({})).toBeNull();
    expect(siteRepoUrl({ SITE_REPO_URL: "" })).toBeNull();
    expect(siteRepoUrl({ SITE_REPO_URL: "https://github.com/aswin-a/[portfolio-repo] " })).toBeNull();
    expect(siteRepoUrl({ SITE_REPO_URL: "javascript:alert(1)" })).toBeNull();
    expect(siteRepoUrl({ SITE_REPO_URL: "https://github.com/aswin-a/aswin-portfolio" })).toBe("https://github.com/aswin-a/aswin-portfolio");
  });
});
