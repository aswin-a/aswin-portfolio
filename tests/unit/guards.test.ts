import { describe, expect, it } from "vitest";
import { costUsd, tokensOf } from "@/lib/ai/cost";
import type { EvidenceCard } from "@/lib/ai/schemas";
import { KB, kbEntry } from "@/lib/kb/snapshot";
import { assertPublicUrl, htmlToText, isPrivateAddress } from "@/lib/run/fetch-url";
import { ASK_UNKNOWN_TEXT, NO_SOURCE_CLOSEST, guardAsk, guardCitations, guardHonesty, hasScore, notDoneTopicFor, sandboxConsistent } from "@/lib/run/guards";
import { composeVerdict } from "@/lib/run/verdict";

const notDone = KB.filter((e) => e.scope === "not_done");
const cloudeagle = kbEntry("cloudeagle")!;

describe("verdict.compose", () => {
  it("is strong at m/n ≥ 0.5 and not strong below", () => {
    expect(composeVerdict(3, 3).verdict).toBe("Strong on 3 of 6 requirements.");
    expect(composeVerdict(2, 3).verdict).toBe("Not a strong fit: 2 of 5 requirements.");
    expect(composeVerdict(0, 0).verdict).toBe("Not a strong fit: 0 of 0 requirements.");
  });
});

describe("guard.citations", () => {
  const reqs = ["Ship AI agent features", "Own a public API"];
  it("keeps a match citing a source kb.search returned", () => {
    const cards: EvidenceCard[] = [{ type: "match", req: reqs[0], evidence: "Designed it.", sourceId: "cloudeagle" }];
    const out = guardCitations(reqs.slice(0, 1), cards, [cloudeagle]);
    expect(out[0].type).toBe("match");
    expect(out.fired).toEqual([]);
  });
  it("turns a match with an unknown or unsearched source into a gap", () => {
    const cards: EvidenceCard[] = [
      { type: "match", req: reqs[0], evidence: "Made up.", sourceId: "nope" },
      { type: "match", req: reqs[1], evidence: "Not searched.", sourceId: "job-search-agent" },
    ];
    const out = guardCitations(reqs, cards, [cloudeagle]);
    expect(out.map((c) => c.type)).toEqual(["gap", "gap"]);
    expect(out[0]).toMatchObject({ closest: NO_SOURCE_CLOSEST });
    expect(out.fired).toHaveLength(2);
  });
  it("adds a gap for a requirement the model skipped", () => {
    expect(guardCitations(reqs, [], [cloudeagle]).map((c) => c.req)).toEqual(reqs);
  });
});

describe("guard.honesty", () => {
  it("never lets a not-done topic be a match", () => {
    const cards: EvidenceCard[] = [{ type: "match", req: "Consumer hardware launches at scale", evidence: "Ran Dhee's.", sourceId: "dhees" }];
    const out = guardHonesty(cards, notDone);
    expect(out.matches).toEqual([]);
    expect(out.gaps[0]).toEqual({ req: "Consumer hardware launches at scale", closest: "Not something Aswin has done.", close: "" });
  });
  it("uses the not-done entry's own closest line", () => {
    const cards: EvidenceCard[] = [{ type: "gap", req: "Retail channel P&L", closest: "x", close: "y", notDoneId: "retail-channel-pl" }];
    expect(guardHonesty(cards, notDone).gaps[0]).toEqual({ req: "Retail channel P&L", closest: "Ran Dhee's, a direct-to-consumer brand. Not retail, not hardware.", close: "" });
  });
  it("rejects percentages and scores", () => {
    expect(hasScore("a 92% match")).toBe(true);
    expect(hasScore("scored 8/10")).toBe(true);
    expect(hasScore("Built an integration builder")).toBe(false);
    const out = guardHonesty([{ type: "match", req: "Agents", evidence: "A 90% fit.", sourceId: "cloudeagle" }], notDone);
    expect(out.matches).toEqual([]);
  });
  it("maps a match to the KB label and href", () => {
    const out = guardHonesty([{ type: "match", req: "Agents", evidence: "Designed it.", sourceId: "cloudeagle" }], notDone);
    expect(out.matches[0]).toEqual({ req: "Agents", evidence: "Designed it.", source: "Case study · CloudEagle concept", href: "/work/integration-builder" });
  });
});

describe("Ask guard", () => {
  it("drops an uncited factual answer to unknown", () => {
    const a = guardAsk({ kind: "fit", text: "Yes.", sourceIds: ["made-up"], guard: "none" }, false);
    expect(a).toMatchObject({ kind: "unknown", text: ASK_UNKNOWN_TEXT, sources: [{ label: "Contact", href: "/#contact" }] });
  });
  it("derives the guard from the kind", () => {
    expect(guardAsk({ kind: "none", text: "Not something Aswin has done.", sourceIds: ["hardware-roadmaps"], guard: "none" }, false).guard).toBe("guard.not_done");
    expect(guardAsk({ kind: "refuse", text: "I only answer from the record.", sourceIds: [], guard: "none" }, false).guard).toBe("guard.prompt_injection");
  });
  it("cites the visitor's fit check only when memory was sent", () => {
    expect(guardAsk({ kind: "fit", text: "Ask about X.", sourceIds: ["memory"], guard: "none" }, true).sources).toEqual([{ label: "Your fit check", href: "/#top" }]);
    expect(guardAsk({ kind: "fit", text: "Ask about X.", sourceIds: ["memory"], guard: "none" }, false).kind).toBe("unknown");
  });
});

describe("sandbox guard", () => {
  it("requires the verdict and guard to agree", () => {
    expect(sandboxConsistent({ verdict: "BLOCKED", reason: "No.", guard: "guard.secrets" })).toBe(true);
    expect(sandboxConsistent({ verdict: "DRAFTED", reason: "Ok.", guard: "guard.secrets" })).toBe(false);
  });
});

describe("cost", () => {
  it("prices uncached input, output and cache reads separately", () => {
    const t = tokensOf({
      inputTokens: 1_100_000,
      inputTokenDetails: { noCacheTokens: 1_000_000, cacheReadTokens: 100_000, cacheWriteTokens: 0 },
      outputTokens: 100_000,
      outputTokenDetails: { textTokens: 100_000, reasoningTokens: 0 },
      totalTokens: 1_200_000,
    });
    expect(costUsd("claude-sonnet-5-5", t)).toBeCloseTo(2 + 1 + 0.01, 6);
  });
  it("refuses an unpriced model", () => {
    expect(() => costUsd("claude-unknown", { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 })).toThrow();
  });
});

describe("fetch_url safety", () => {
  it("classifies private addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])
      expect(isPrivateAddress(ip), ip).toBe(true);
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
  it("refuses other schemes, ports, credentials and private hosts", async () => {
    const resolve = async (h: string) => (h === "internal.example" ? ["10.0.0.5"] : ["93.184.216.34"]);
    await expect(assertPublicUrl("file:///etc/passwd", resolve)).rejects.toThrow();
    await expect(assertPublicUrl("http://example.com:8080/", resolve)).rejects.toThrow();
    await expect(assertPublicUrl("http://user:pw@example.com/", resolve)).rejects.toThrow();
    await expect(assertPublicUrl("http://internal.example/", resolve)).rejects.toThrow();
    await expect(assertPublicUrl("http://[::1]/", resolve)).rejects.toThrow();
    await expect(assertPublicUrl("https://example.com/jobs/1", resolve)).resolves.toBeInstanceOf(URL);
  });
  it("turns HTML into text", () => {
    const html = "<html><head><title>x</title><style>p{}</style></head><body><h1>Senior PM</h1><script>evil()</script><ul><li>Own the API</li><li>Ship agents &amp; evals</li></ul></body></html>";
    expect(htmlToText(html)).toBe("Senior PM\n\n- Own the API\n- Ship agents & evals");
  });
});

// ---------- Milestone 7: the gaps in guard and verdict coverage ----------

describe("verdict.compose · template (M7)", () => {
  it("uses the design's notes word for word, and counts n as matches + gaps", () => {
    expect(composeVerdict(4, 2)).toEqual({ verdict: "Strong on 4 of 6 requirements.", note: "Each match links to the role or project behind it. Gaps are listed, not hidden." });
    expect(composeVerdict(1, 5)).toEqual({ verdict: "Not a strong fit: 1 of 6 requirements.", note: "Better you hear it from this site than in round two." });
  });
  it("is exactly strong at one half, never below", () => {
    expect(composeVerdict(1, 1).verdict).toMatch(/^Strong on 1 of 2/);
    expect(composeVerdict(5, 6).verdict).toMatch(/^Not a strong fit: 5 of 11/);
    expect(composeVerdict(1, 0).verdict).toBe("Strong on 1 of 1 requirements.");
  });
  it("never carries a percentage or score", () => {
    for (const [m, g] of [[0, 0], [3, 3], [1, 9], [7, 0]]) {
      const v = composeVerdict(m, g);
      expect(hasScore(`${v.verdict} ${v.note}`)).toBe(false);
    }
  });
});

describe("hasScore · every form guard.honesty rejects (M7)", () => {
  it.each(["92%", "92 %", "a 7.5% gap", "fifty per cent", "50 percent", "score", "scored well", "scores", "8/10", "4 / 5", "95/100", "rated highly", "a rating of"])("flags %s", (s) => {
    expect(hasScore(s)).toBe(true);
  });
  it.each(["Built the API platform", "3 of 6 requirements", "10+ years", "Rated R? No: 'Ratelimit'", "2024/25 roadmap", "B2B/SaaS"])("passes %s", (s) => {
    // "Rated" at the start is a rating word; the rest are plain facts.
    expect(hasScore(s)).toBe(s.startsWith("Rated"));
  });
});

describe("guard.citations · edge cases (M7)", () => {
  const notDoneEntry = notDone[0];
  it("a match citing a not-done or fact entry is a gap, even if kb.search returned it", () => {
    const cards: EvidenceCard[] = [{ type: "match", req: "Anything", evidence: "x", sourceId: notDoneEntry.id }];
    const out = guardCitations(["Anything"], cards, [notDoneEntry]);
    expect(out[0]).toMatchObject({ type: "gap", closest: NO_SOURCE_CLOSEST });
    expect(out.fired).toEqual(["guard.citations"]);
  });
  it("keeps the requirement order and text, matching cards by req first, then by position", () => {
    const cards: EvidenceCard[] = [
      { type: "gap", req: "B", closest: "c", close: "", notDoneId: null },
      { type: "match", req: "A", evidence: "e", sourceId: "cloudeagle" },
    ];
    const out = guardCitations(["A", "B"], cards, [cloudeagle]);
    expect(out.map((c) => [c.req, c.type])).toEqual([["A", "match"], ["B", "gap"]]);
  });
  it("leaves gaps alone and fires nothing for clean output", () => {
    const cards: EvidenceCard[] = [{ type: "gap", req: "A", closest: "c", close: "d", notDoneId: null }];
    expect([...guardCitations(["A"], cards, [])]).toMatchObject([{ type: "gap", closest: "c", close: "d" }]);
    expect(guardCitations(["A"], cards, []).fired).toEqual([]);
  });
});

describe("guard.honesty · edge cases (M7)", () => {
  it("every not-done topic, asked as a requirement, is a gap with no close", () => {
    for (const n of notDone) {
      const topic = n.text.replace(/^NOT DONE: /, "").split(". Closest:")[0];
      expect(notDoneTopicFor(topic, notDone)?.id, topic).toBe(n.id);
      const out = guardHonesty([{ type: "match", req: topic, evidence: "Did it.", sourceId: "cloudeagle" }], notDone);
      expect(out.matches, topic).toEqual([]);
      expect(out.gaps[0].close).toBe("");
      expect(out.fired).toEqual(["guard.honesty"]);
    }
  });
  it("doesn't treat an unrelated requirement as a not-done topic", () => {
    expect(notDoneTopicFor("Own a public API and partner integrations", notDone)).toBeUndefined();
    expect(notDoneTopicFor("", notDone)).toBeUndefined();
  });
  it("a match whose source isn't in the KB becomes a gap", () => {
    const out = guardHonesty([{ type: "match", req: "APIs", evidence: "Built it.", sourceId: "ghost" }], notDone);
    expect(out).toMatchObject({ matches: [], gaps: [{ req: "APIs", closest: NO_SOURCE_CLOSEST, close: "" }], fired: ["guard.honesty"] });
  });
  it("a gap with a score in its closest or close line is replaced", () => {
    const out = guardHonesty([{ type: "gap", req: "Evals", closest: "Scored 6/10 on evals", close: "", notDoneId: null }], notDone);
    expect(out.gaps[0].closest).toBe(NO_SOURCE_CLOSEST);
  });
  it("counts come from the cards, mixed in order", () => {
    const cards: EvidenceCard[] = [
      { type: "match", req: "Agents", evidence: "Designed it.", sourceId: "cloudeagle" },
      { type: "gap", req: "Evals at scale", closest: "Keeps an eval set.", close: "Would adopt the team's tooling.", notDoneId: null },
      { type: "match", req: "Consumer hardware launches at scale", evidence: "x", sourceId: "dhees" },
    ];
    const out = guardHonesty(cards, notDone);
    expect([out.matches.length, out.gaps.length]).toEqual([1, 2]);
  });
});

describe("Ask guard · every kind (M7)", () => {
  const src = ["cloudeagle"];
  it.each([
    ["refuse", "guard.prompt_injection"],
    ["none", "guard.not_done"],
    ["conflict", "guard.conflicting_info"],
    ["clarify", "guard.ambiguous_ask"],
    ["gap", "guard.gap_stated"],
    ["fit", "none · answered from the knowledge base"],
  ] as const)("%s → %s", (kind, guard) => {
    expect(guardAsk({ kind, text: "From the record.", sourceIds: src, guard: "none" }, false).guard).toBe(guard);
  });
  it("memory answers use the session-memory guard line", () => {
    expect(guardAsk({ kind: "fit", text: "From your fit check.", sourceIds: ["memory", "cloudeagle"], guard: "none" }, true)).toMatchObject({
      guard: "none · answered from session memory + knowledge base",
      sources: [{ label: "Your fit check", href: "/#top" }, { label: "Case study · CloudEagle concept", href: "/work/integration-builder" }],
    });
  });
  it("refuse and clarify may cite nothing; a score anywhere is unknown", () => {
    expect(guardAsk({ kind: "clarify", text: "Good at what?", sourceIds: [], guard: "none" }, false).kind).toBe("clarify");
    expect(guardAsk({ kind: "fit", text: "He's a 95% match.", sourceIds: src, guard: "none" }, false).kind).toBe("unknown");
    expect(guardAsk({ kind: "unknown", text: "anything", sourceIds: src, guard: "none" }, false).text).toBe(ASK_UNKNOWN_TEXT);
  });
  it("dedupes sources", () => {
    expect(guardAsk({ kind: "fit", text: "Yes.", sourceIds: ["cloudeagle", "cloudeagle"], guard: "none" }, false).sources).toHaveLength(1);
  });
});

describe("sandbox guard · every WORK_ATTACKS pair (M7)", () => {
  it("accepts each design verdict with its guard and refuses a score in the reason", async () => {
    const { WORK_ATTACKS, WORK_SAFE } = await import("@/content/case-studies/cloudeagle-attacks");
    for (const a of WORK_ATTACKS) expect(sandboxConsistent({ verdict: a.verdict, reason: a.reason, guard: a.guard }), a.type).toBe(true);
    expect(sandboxConsistent({ verdict: WORK_SAFE.verdict, reason: WORK_SAFE.reason, guard: WORK_SAFE.guard })).toBe(true);
    expect(sandboxConsistent({ verdict: "BLOCKED", reason: "Risk score 9/10.", guard: "guard.scope" })).toBe(false);
    expect(sandboxConsistent({ verdict: "FLAGGED", reason: "Held.", guard: "guard.clarify" })).toBe(false);
  });
});
