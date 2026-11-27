import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cvItems } from "@/content/cv";
import { cvAt, cvHref, cvLineText, formatTarget, isHighlighted, parseCvHash, resolves, toTargets, type CvLocator } from "@/lib/cv-link";
import { ASK_ANSWERS } from "@/lib/ask/fixtures";
import { HERO_BAD, HERO_FIT } from "@/lib/fit-check/fixtures";
import { KB, entryHref, formatEntries, kbEntry } from "@/lib/kb/snapshot";
import { guardCitations, guardHonesty } from "@/lib/run/guards";
import type { EvidenceCard } from "@/lib/ai/schemas";

/** CV_ITEMS from About.dc.html: locators index CV_ITEMS, so the order must match. */
function designItems(): { id: string; highlights?: string[]; groups?: { name: string; items: string[] }[] }[] {
  const html = readFileSync("design/About.dc.html", "utf8");
  const src = html.slice(html.indexOf("var CV_ITEMS"), html.indexOf("var CV_SKILLS"));
  // The design file is our own checked-in prototype; evaluating its data array is safe here.
  return new Function(`${src}; return CV_ITEMS;`)();
}

describe("CV order (locators follow CV_ITEMS)", () => {
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
  "fact-title", // the CV header
  "fact-focus",
  "fact-resume-summary", // the master resume's Summary (content/resume.ts), not on the CV page
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
    const text = formatEntries([kbEntry("zelthy-integrations")!]);
    expect(text).toMatch(/^\[zelthy-integrations\] \(projects\) Zelthy: Identity, Integrations and Data Sync/);
    expect(text).toContain("\n  L2 Built a connector framework");
    expect(text).toContain("\n  L4 Migrated client master data");
  });

  it("labels CV entries 'CV · {org} · {area}' with the CV's own area names", () => {
    expect(kbEntry("zelthy-integrations")?.label).toBe("CV · Zelthy · Identity, Integrations and Data Sync");
    expect(kbEntry("zelthy-leadership")?.label).toBe("CV · Zelthy · Team Leadership");
    expect(kbEntry("integration-builder")?.label).toBe("Case study · Integration builder");
    expect(kbEntry("platform-api")?.label).toBe("CV · Zelthy");
    expect(kbEntry("solar-labs")?.label).toBe("CV · The Solar Labs");
    expect(kbEntry("healthcare-integrations")?.label).toBe("CV · Zelthy · healthcare");
  });
});

describe("#cv= links (the design's format, with stable area ids)", () => {
  it("parses area ids, and falls back to the whole role for an unknown area", () => {
    expect(parseCvHash("#cv=zelthy.integrations.1-2")?.targets).toEqual([{ id: "zelthy", group: 1, items: [1, 2] }]);
    expect(parseCvHash("cv=zelthy.leadership+zelthy.client-ops.1&req=Lead")).toEqual({
      targets: [
        { id: "zelthy", group: 6, items: [] },
        { id: "zelthy", group: 7, items: [1] },
      ],
      req: "Lead",
    });
    // A position is not an area id: the old `zelthy.1.1-2` opens the role, never a wrong area.
    expect(parseCvHash("#cv=zelthy.1.1-2")?.targets).toEqual([{ id: "zelthy", group: null, items: [] }]);
    expect(parseCvHash("#cv=dhees")?.targets).toEqual([{ id: "dhees", group: null, items: [] }]);
    expect(parseCvHash("#cv=dhees..2,4")?.targets).toEqual([{ id: "dhees", group: null, items: [2, 4] }]);
    expect(parseCvHash("#cv=nobody.1")).toBeNull();
    expect(parseCvHash("#contact")).toBeNull();
  });

  it("formats targets with area ids", () => {
    expect(formatTarget({ id: "zelthy", group: 1, items: [1, 2] })).toBe("zelthy.integrations.1-2");
    expect(formatTarget({ id: "zelthy", group: 1, items: [0, 3] })).toBe("zelthy.integrations.0,3");
    expect(formatTarget({ id: "zelthy", group: 6, items: [] })).toBe("zelthy.leadership");
    expect(formatTarget({ id: "dhees", group: null, items: [] })).toBe("dhees");
    expect(formatTarget({ id: "dhees", group: null, items: [3] })).toBe("dhees..3");
    for (const t of [{ id: "zelthy", group: 7, items: [1] }, { id: "site", group: null, items: [0, 2] }]) expect(parseCvHash(`cv=${formatTarget(t)}`)?.targets).toEqual([t]);
  });

  it("builds locators by area id, and refuses ones that don't resolve", () => {
    expect(cvAt("zelthy", "integrations", [1, 2])).toEqual([
      { roleId: "zelthy", group: 1, item: 1 },
      { roleId: "zelthy", group: 1, item: 2 },
    ]);
    expect(cvAt("dhees")).toEqual([{ roleId: "dhees" }]);
    expect(() => cvAt("zelthy", "nope")).toThrow();
    expect(() => cvAt("zelthy", "leadership", [9])).toThrow();
    expect(() => cvAt("nobody")).toThrow();
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
    const integrations = kbEntry("zelthy-integrations")!;
    expect(entryHref(integrations, [2, 3], "Own a public API and partner integrations")).toBe(
      "/about#cv=zelthy.integrations.1-2&req=Own%20a%20public%20API%20and%20partner%20integrations",
    );
    const health = kbEntry("healthcare-integrations")!;
    const nums = health.lines.flatMap((l, i) => (["1.1", "1.2", "4.2", "2.0"].includes(`${l.at.group}.${l.at.item}`) ? [i + 1] : []));
    expect(nums).toHaveLength(4);
    expect(entryHref(health, nums, "What's his healthcare experience?")).toBe(
      "/about#cv=zelthy.integrations.1-2+zelthy.ai-ml.0+zelthy.releases.2&req=What's%20his%20healthcare%20experience%3F",
    );
  });

  it("falls back to the whole entry when no cited line is valid, and leaves case studies alone", () => {
    expect(entryHref(kbEntry("zelthy-core-platform")!, [99, 0])).toBe("/about#cv=zelthy.core");
    expect(entryHref(kbEntry("dhees")!, [])).toBe("/about#cv=dhees");
    expect(entryHref(kbEntry("job-search-agent")!, [1])).toBe("/work/job-search-agent");
    expect(cvHref([])).toBe("/about");
  });
});

/** A design `#cv=` hash (area positions) as locators, so the design's targets can be checked against content/cv.ts. */
function designLocators(hash: string): CvLocator[] {
  const m = /cv=([^&'"]+)/.exec(hash);
  if (!m) return [];
  return m[1].split("+").flatMap((part) => {
    const [roleId, g = "", list = ""] = part.split(".");
    const group = g === "" ? undefined : Number(g);
    const items = list.split(",").filter(Boolean).flatMap((seg) => {
      const [a, b = a] = seg.split("-").map(Number);
      return Array.from({ length: b - a + 1 }, (_, k) => a + k);
    });
    return items.length ? items.map((item) => ({ roleId, group, item })) : [{ roleId, group }];
  });
}

describe("every #cv= link resolves (design update 15)", () => {
  it("every deep link in the design files points at a real CV line or area", () => {
    for (const file of ["Hero", "Ask", "CVFromProof"]) {
      const src = readFileSync(`design/${file}.dc.html`, "utf8");
      const hashes = src.match(/cv=[a-z]+[^&'"\s]*/g) ?? [];
      expect(hashes.length, file).toBeGreaterThan(0);
      for (const h of hashes) for (const l of designLocators(h)) expect(resolves(l), `${file}: ${h} → ${JSON.stringify(l)}`).toBe(true);
    }
  });

  it("the fixtures link to the same CV lines as the design, by area id", () => {
    const hero = readFileSync("design/Hero.dc.html", "utf8");
    const ask = readFileSync("design/Ask.dc.html", "utf8");
    const designHref = (src: string, near: string) => {
      const at = src.indexOf(near);
      return src.slice(at, src.indexOf("}", at));
    };
    const same = (ours: string, design: string) => expect(parseCvHash(ours.slice(ours.indexOf("#") + 1))?.targets).toEqual(toTargets(designLocators(design)));
    same(HERO_FIT.matches[0].href, designHref(hero, "req: 'Own a public API"));
    same(HERO_BAD.matches[0].href, designHref(hero, "req: 'Lead cross-functional"));
    for (const id of ["apis", "win", "conflict", "health"] as const) same(ASK_ANSWERS[id].sources[0].href, designHref(ask, `  ${id}: {`));
  });

  it("every link the site builds from the KB resolves", () => {
    for (const e of KB) {
      const href = entryHref(e, e.lines.map((_, i) => i + 1));
      if (!href.startsWith("/about#")) continue;
      for (const t of parseCvHash(href.slice(href.indexOf("#") + 1))?.targets ?? []) {
        const item = cvItems.find((x) => x.id === t.id);
        expect(item, href).toBeDefined();
        if (t.group !== null) expect(item?.groups?.[t.group], href).toBeDefined();
      }
    }
  });
});

describe("guard.citations · cited lines", () => {
  it("drops line numbers the source doesn't have and links the rest", () => {
    const src = kbEntry("zelthy-integrations")!;
    const req = "Own a public API and partner integrations";
    const cards: EvidenceCard[] = [{ type: "match", req, evidence: "Ran API design reviews.", sourceId: src.id, lines: [2, 2, 42] }];
    const g1 = guardCitations([req], cards, [src]);
    expect(g1.droppedLines).toBe(2);
    expect(g1[0]).toMatchObject({ lines: [2] });
    const g2 = guardHonesty(g1, []);
    expect(g2.matches[0].href).toBe("/about#cv=zelthy.integrations.1&req=Own%20a%20public%20API%20and%20partner%20integrations");
    expect(g2.matches[0].source).toBe("CV · Zelthy · Identity, Integrations and Data Sync");
  });
});
