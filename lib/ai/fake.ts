import { MockLanguageModelV4 } from "ai/test";
import { ASK_QUESTIONS, CTX_QUESTION, gapQuestion } from "@/lib/ask/copy";
import { ASK_ANSWERS } from "@/lib/ask/fixtures";
import { HERO_SAMPLES, heroSummary } from "@/lib/fit-check/copy";
import { BREAK_REPLIES, HERO_BAD, HERO_FIT } from "@/lib/fit-check/fixtures";
import { isHighlighted, parseCvHash } from "@/lib/cv-link";
import { KB, kbEntry } from "@/lib/kb/snapshot";
import type { AskOutput, EvidenceCard, JdParse } from "./schemas";
import { ASK_SYSTEM, EVIDENCE_MAP_SYSTEM, JD_PARSE_SYSTEM } from "./prompts";

/**
 * AI_FAKE=1 only (tests and e2e; refused in production): a deterministic stand-in for Claude that
 * replays the design's sample outputs (HERO_FIT / HERO_BAD, ASK_ANSWERS and the Break my AI replies)
 * through the real pipeline, guards and route. It bills nothing, so its runs show
 * a real, measured cost of $0 and the model "Fake · test model (AI_FAKE)".
 *
 * Test markers anywhere in the visitor's text:
 *   [[fake:error]]     every model call fails (the retry fails too → error fallback)
 *   [[fake:fail-once]] the first call with this prompt fails, the retry succeeds (retries = 1)
 * Route-level hooks ([[fake:limited]], [[fake:budget]], [[fake:hold]]) live in lib/run/hooks.ts.
 */

export class FakeModelError extends Error {}

/** Vitest runs many calls per test, so it skips the delay. */
export const FAKE_LATENCY_MS = process.env.VITEST ? 0 : 600;

const failedOnce = new Set<string>();

type Prompt = Parameters<MockLanguageModelV4["doGenerate"]>[0]["prompt"];

function textOf(prompt: Prompt): { system: string; user: string } {
  let system = "";
  let user = "";
  for (const m of prompt) {
    if (m.role === "system") system += m.content + "\n";
    else if (m.role === "user") for (const p of m.content) if (p.type === "text") user += p.text + "\n";
  }
  return { system, user };
}

function between(s: string, tag: string): string {
  const m = s.match(new RegExp(`<${tag}>\\n([\\s\\S]*?)\\n</${tag}>`));
  return m ? m[1] : "";
}

function sampleFor(jd: string) {
  return HERO_SAMPLES.find((s) => jd.includes(s.jd));
}

function jdParse(user: string): JdParse {
  const jd = between(user, "job_description");
  const sample = sampleFor(jd);
  const body = sample?.bad ? HERO_BAD : HERO_FIT;
  return {
    role: sample?.role ?? heroSummary(jd),
    requirements: [...body.matches.map((m) => m.req), ...body.gaps.map((g) => g.req)],
  };
}

/**
 * The design's `#cv=` deep links → a KB id and its cited `L` numbers, so the fake cites the same CV
 * lines the design links to and the real guards rebuild the link (design update 14). The id is the
 * entry that sits exactly at the first target (a Zelthy area, or a whole role).
 */
function cvFocus(href: string) {
  return href.startsWith("/about#") ? parseCvHash(href.slice(href.indexOf("#") + 1)) : null;
}
function idForCvHref(href: string): string | undefined {
  const t = cvFocus(href)?.targets[0];
  if (!t) return undefined;
  return KB.find((e) => (e.scope === "roles" || e.scope === "projects") && e.cv.length === 1 && e.cv[0].roleId === t.id && (e.cv[0].group ?? null) === t.group)?.id;
}
function linesForCvHref(id: string, href: string): number[] {
  const f = cvFocus(href);
  const e = kbEntry(id);
  if (!f || !e) return [];
  return e.lines.flatMap((l, i) =>
    l.at.item !== undefined && f.targets.some((t) => t.id === l.at.roleId) && isHighlighted(f.targets.filter((t) => t.id === l.at.roleId && t.items.length > 0), l.at.group ?? null, l.at.item) ? [i + 1] : [],
  );
}

/** Fixture hrefs → KB ids (content/kb). */
const SOURCE_IDS: Record<string, string> = {
  "/work/integration-builder": "integration-builder",
  "/work/job-search-agent": "job-search-agent",
  "/work/instagram-agent": "dhees-instagram-agent",
};
const NOT_DONE_IDS: Record<string, string> = {
  "Hardware roadmaps from prototype to mass production": "hardware-roadmaps",
  "Contract manufacturers and supply chain": "contract-manufacturing",
  "Retail channel P&L": "retail-channel-pl",
  "10+ years of consumer hardware launches": "consumer-hardware-launches",
};

function evidenceMap(user: string): { cards: EvidenceCard[] } {
  const reqs = between(user, "requirements")
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, ""));
  const all = [...HERO_FIT.matches, ...HERO_BAD.matches];
  const gaps = [...HERO_FIT.gaps, ...HERO_BAD.gaps];
  return {
    cards: reqs.map((req): EvidenceCard => {
      const m = all.find((x) => x.req === req);
      if (m) {
        const sourceId = idForCvHref(m.href) ?? SOURCE_IDS[m.href] ?? "unknown-source";
        return { type: "match", req, evidence: m.evidence, sourceId, lines: linesForCvHref(sourceId, m.href) };
      }
      const g = gaps.find((x) => x.req === req);
      return {
        type: "gap",
        req,
        closest: g?.closest ?? "Not something Aswin has done.",
        close: g?.close ?? "",
        notDoneId: NOT_DONE_IDS[req] ?? null,
      };
    }),
  };
}

/** KB ids for the design's Ask source chips, by label then href (see content/kb/facts.ts). */
const ASK_SOURCE_IDS: Record<string, string> = {
  "Case studies": "fact-ai-work",
  "Case study · Integration builder": "integration-builder",
  "Case study · Safeguards": "integration-builder",
  "Case study · v2 & lessons": "integration-builder",
  "Your fit check": "memory",
};

/** Questions whose design answer cites a specific KB entry rather than a page. */
const SOURCES_BY_QUESTION: Partial<Record<keyof typeof ASK_QUESTIONS, string[]>> = {
  health: ["healthcare-integrations"],
};

/** The design's ctxAnswer for session-memory questions (Ask.dc.html). */
function fromMemory(q: string, memory: string): AskOutput | null {
  const gaps = memory
    .split("\n")
    .filter((l) => l.startsWith("gap: "))
    .map((l) => {
      const [req, closest = "", close = ""] = l.slice(5).split(" | ").map((x) => x.replace(/^(closest|close): /, ""));
      return { req, closest, close };
    });
  if (q === CTX_QUESTION) {
    return { kind: "fit", text: `Ask how he would ramp up on: ${gaps.map((g) => g.req).join("; ")}. Each case study also ends with questions to ask him.`, sourceIds: ["memory", "fact-ai-work"], sourceLines: [], guard: "none" };
  }
  const g = gaps.find((x) => gapQuestion(x.req) === q);
  if (!g) return null;
  const none = /^Not something Aswin has done/.test(g.closest);
  return { kind: none ? "none" : "gap", text: g.closest + (g.close ? ` ${g.close}` : ""), sourceLines: [], sourceIds: ["memory", "fact-focus"], guard: none ? "guard.not_done" : "guard.gap_stated" };
}

function ask(user: string): AskOutput {
  const q = between(user, "question").trim();
  const memory = between(user, "session_memory");
  const ctx = memory ? fromMemory(q, memory) : null;
  if (ctx) return ctx;
  const attack = BREAK_REPLIES[q];
  if (attack) return { kind: attack.kind, text: attack.text, sourceIds: attack.kind === "none" ? ["fact-focus"] : attack.kind === "conflict" ? ["fact-llm-experience"] : [], sourceLines: [], guard: attack.guard as AskOutput["guard"] };
  const id = (Object.keys(ASK_QUESTIONS) as (keyof typeof ASK_QUESTIONS)[]).find((k) => ASK_QUESTIONS[k] === q);
  if (!id) {
    return { kind: "unknown", text: ASK_ANSWERS.unknown.text, sourceIds: [], sourceLines: [], guard: "none" };
  }
  const f = ASK_ANSWERS[id];
  const guard = (f.guard ?? (f.kind === "gap" ? "guard.gap_stated" : "none")) as AskOutput["guard"];
  const sourceIds =
    SOURCES_BY_QUESTION[id] ?? [...new Set(f.sources.map((s) => idForCvHref(s.href) ?? ASK_SOURCE_IDS[s.label]).filter((x): x is string => !!x))];
  // The CV lines the design's source links highlight, per cited entry.
  const sourceLines = sourceIds.flatMap((sid) => {
    const lines = [...new Set(f.sources.flatMap((s) => linesForCvHref(sid, s.href)))];
    return lines.length ? [{ id: sid, lines }] : [];
  });
  return { kind: f.kind, text: f.text, sourceIds, sourceLines, guard };
}

export function fakeModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    provider: "fake",
    modelId: "fake",
    doGenerate: async (options) => {
      const { system, user } = textOf(options.prompt);
      // Roughly the prototype's pace, so loading and running states are visible. Real durations are
      // still measured around it; nothing reports this delay as anything else.
      await new Promise((r) => setTimeout(r, FAKE_LATENCY_MS));
      if (user.includes("[[fake:error]]")) throw new FakeModelError("fake: forced error");
      const key = system.slice(0, 40) + user;
      if (user.includes("[[fake:fail-once]]") && !failedOnce.has(key)) {
        failedOnce.add(key);
        throw new FakeModelError("fake: forced first failure");
      }
      let out: unknown;
      if (system.startsWith(JD_PARSE_SYSTEM.slice(0, 40))) out = jdParse(user);
      else if (system.startsWith(EVIDENCE_MAP_SYSTEM.slice(0, 40))) out = evidenceMap(user);
      else if (system.startsWith(ASK_SYSTEM.slice(0, 40))) out = ask(user);
      else throw new FakeModelError("fake: unknown prompt");
      const text = JSON.stringify(out);
      return {
        content: [{ type: "text", text }],
        finishReason: { unified: "stop", raw: "end_turn" },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 0, text: 0, reasoning: 0 },
        },
        warnings: [],
      };
    },
  });
}

