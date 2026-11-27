import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cvGeneral, cvItems, cvSkills, cvStats } from "@/content/cv";
import { products } from "@/content/products";
import { cvMarkdown, cvPlainText, cvStrings, topicFor, cvItem } from "@/lib/cv";
import { KB, kbEntry } from "@/lib/kb/snapshot";

/** Fields Aswin filled in or changed after the design (2026-11-24); everything else is word for word. */
const ASWIN_FILLED: Record<string, Record<string, string>> = {
  jsa: { link: "Add to Claude/ChatGPT →", href: "https://github.com/aswin-a/linkedin-job-search-agent" },
  web: { dates: "Feb 2026" },
};

/** The CV arrays as the design has them, evaluated from design/About.dc.html. */
function designCv() {
  const src = readFileSync("design/About.dc.html", "utf8");
  const code = src.slice(src.indexOf("var CV_STATS"), src.indexOf("function cvPlainText"));
  return new Function(`${code}; return { CV_STATS, CV_GENERAL, CV_ITEMS, CV_SKILLS };`)() as {
    CV_STATS: [string, string][];
    CV_GENERAL: { label: string; qa: { q: string }[] };
    CV_ITEMS: Record<string, unknown>[];
    CV_SKILLS: [string, string][];
  };
}

/** Words the KB generators put between CV strings. They join CV text; they never add a claim. */
const CONNECTORS = /^(Evidence|Projects|Skills|Location)$/;

/** What's left of `text` once every CV string (and product status chip) is taken out. */
function untraced(text: string, known: string[]): string[] {
  let rest = text;
  for (const s of [...known].sort((a, b) => b.length - a.length)) if (s.length > 1) rest = rest.split(s).join(" ");
  return rest
    .split(/[\s.,;:()·—–\-]+/)
    .filter(Boolean)
    .filter((w) => !CONNECTORS.test(w));
}

describe("content/cv.ts", () => {
  it("is the design's CV word for word", () => {
    const d = designCv();
    expect(cvStats).toEqual(d.CV_STATS);
    expect(cvSkills).toEqual(d.CV_SKILLS);
    expect(cvGeneral).toEqual({ label: d.CV_GENERAL.label, qa: d.CV_GENERAL.qa.map(({ q }) => ({ q })) });
    expect(cvItems.length).toBe(d.CV_ITEMS.length);
    cvItems.forEach((it, i) => {
      const di = d.CV_ITEMS[i] as Record<string, unknown> & { qa?: { q: string }[]; href?: string };
      const expected = {
        ...di,
        ...(ASWIN_FILLED[it.id] ?? {}),
        ...(di.qa ? { qa: di.qa.map(({ q }) => ({ q })) } : {}),
        ...(di.href === "Main.dc.html" ? { href: "/" } : {}),
      };
      expect(it).toEqual(expected);
    });
  });

  it("copies as plain text in the design's format", () => {
    const text = cvPlainText();
    expect(text.split("\n").slice(0, 5)).toEqual([
      "Aswin A",
      "Senior Product Manager · Platforms, integrations and agentic AI products",
      "Chennai, India · linkedin.com/in/aswin-a-pm",
      "",
      "EXPERIENCE",
    ]);
    expect(text).toContain("\nSenior Product Manager — Zelthy · Bangalore (remote) (Sep 2020 – Sep 2024)\n");
    // Zelthy prints its group items, not its (empty) highlights.
    for (const g of cvItem("zelthy").groups ?? []) for (const x of g.items) expect(text).toContain(`- ${x}`);
    expect(text.endsWith(`Tools: ${cvSkills[6][1]}`)).toBe(true);
  });

  it("has a markdown twin with every item", () => {
    const md = cvMarkdown();
    for (const it of cvItems) expect(md).toContain(`### ${it.title}`);
  });

  it("labels a role's Ask topic as title · company", () => {
    expect(topicFor(cvItem("zelthy")).label).toBe("Senior Product Manager · Zelthy");
    expect(topicFor(cvItem("dhees")).label).toBe("Founder and Product Lead · Dhee’s Pet Company");
  });
});

describe("the knowledge base is generated from the CV", () => {
  // CV strings, their sentences, the org names ("Zelthy") and the product status chips.
  const known = [
    ...cvStrings(),
    ...cvStrings().flatMap((s) => s.split(/(?<=\.) /)),
    ...cvItems.map((it) => it.org.split(" · ")[0]),
    ...products.map((p) => p.status),
  ];

  it("traces every role, project and fact back to a CV line", () => {
    // `integration-builder` is the one non-CV entry (the take-home concept from content/products.ts); not-done is hand-written.
    for (const e of KB.filter((x) => x.scope !== "not_done" && x.id !== "integration-builder")) {
      expect({ id: e.id, untraced: untraced(e.text, known) }).toEqual({ id: e.id, untraced: [] });
    }
  });

  it("keeps every CV item in the KB", () => {
    const text = KB.map((e) => e.text).join("\n");
    for (const it of cvItems) expect(text).toContain(it.title);
    for (const g of cvItem("zelthy").groups ?? []) for (const x of g.items) expect(text).toContain(x);
  });

  it("keeps the stable ids that fixtures, case studies and tests cite", () => {
    for (const id of ["platform-api", "dhees", "integration-builder", "job-search-agent", "dhees-instagram-agent", "healthcare-integrations", "fact-focus", "fact-ai-work", "fact-platform-win", "fact-llm-experience"]) {
      expect(kbEntry(id), id).toBeDefined();
    }
    expect(kbEntry("job-search-agent")?.href).toBe("/work/job-search-agent");
    expect(kbEntry("dhees-instagram-agent")?.href).toBe("/work/instagram-agent");
  });
});
