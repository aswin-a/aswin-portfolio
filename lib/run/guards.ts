import type { AskOutput, EvidenceCard } from "@/lib/ai/schemas";
import { CONTACT_SOURCE } from "@/lib/ask/copy";
import type { AskAnswer, AskSource } from "@/lib/ask/types";
import type { FitGap, FitMatch } from "@/lib/fit-check/types";
import { kbEntry, type KbEntry } from "@/lib/kb/snapshot";
import { tokens } from "@/lib/kb/search";

/**
 * Deterministic guards (SPEC §7–8). They run on every model output; the model can't skip them.
 */

/** A gap whose evidence failed a guard. Approved wording follows Ask's `unknown` line. */
export const NO_SOURCE_CLOSEST = "The knowledge base doesn't cover this.";
export const NOT_DONE = "Not something Aswin has done.";

/** No percentages, scores or ratings anywhere (guard.honesty). */
const SCORE_RE = /\d+(?:\.\d+)?\s*%|\bper ?cent\b|\bscore[sd]?\b|\b\d+(?:\.\d+)?\s*\/\s*(?:5|10|100)\b|\brat(?:ed|ing)\b/i;
export function hasScore(text: string): boolean {
  return SCORE_RE.test(text);
}

export type Cards = { matches: FitMatch[]; gaps: FitGap[] };
type Fired = { fired: string[] };

/**
 * `guard.citations`: one card per requirement, in order. A match stands only if it cites a source
 * kb.search returned for this run, from roles or projects. Anything else becomes a gap.
 */
export function guardCitations(requirements: readonly string[], cards: readonly EvidenceCard[], sources: readonly KbEntry[]): EvidenceCard[] & Fired {
  const allowed = new Map(sources.filter((s) => s.scope === "roles" || s.scope === "projects").map((s) => [s.id, s]));
  const fired: string[] = [];
  const out = requirements.map((req, i): EvidenceCard => {
    const card = cards.find((c) => c.req === req) ?? cards[i];
    if (!card) {
      fired.push("guard.citations");
      return { type: "gap", req, closest: NO_SOURCE_CLOSEST, close: "", notDoneId: null };
    }
    if (card.type === "match" && !allowed.has(card.sourceId)) {
      fired.push("guard.citations");
      return { type: "gap", req, closest: NO_SOURCE_CLOSEST, close: "", notDoneId: null };
    }
    return { ...card, req };
  });
  return Object.assign(out, { fired });
}

/** A requirement is about a not-done topic when it shares most of the topic's words. */
export function notDoneTopicFor(req: string, notDone: readonly KbEntry[]): KbEntry | undefined {
  const rt = tokens(req);
  return notDone.find((n) => {
    const topic = tokens(n.text.replace(/^NOT DONE: /, "").split(". Closest:")[0]);
    let hit = 0;
    for (const t of topic) if (rt.has(t)) hit++;
    return topic.size > 0 && hit >= 2 && hit / topic.size >= 0.6;
  });
}

/**
 * `guard.honesty`: not-done topics are never matches and always read "Not something Aswin has
 * done." (or the entry's own closest line) with no close; no percentages or scores. Counts are
 * computed here from the cards, so the verdict can't disagree with them.
 */
export function guardHonesty(cards: readonly EvidenceCard[], notDone: readonly KbEntry[]): Cards & Fired {
  const fired: string[] = [];
  const matches: FitMatch[] = [];
  const gaps: FitGap[] = [];
  for (const c of cards) {
    const nd = (c.type === "gap" && c.notDoneId ? notDone.find((n) => n.id === c.notDoneId) : undefined) ?? notDoneTopicFor(c.req, notDone);
    if (nd) {
      if (c.type === "match") fired.push("guard.honesty");
      gaps.push({ req: c.req, closest: nd.notDone?.closest ?? NOT_DONE, close: "" });
      continue;
    }
    if (c.type === "match") {
      const src = kbEntry(c.sourceId);
      if (!src || hasScore(c.evidence)) {
        fired.push("guard.honesty");
        gaps.push({ req: c.req, closest: NO_SOURCE_CLOSEST, close: "" });
      } else matches.push({ req: c.req, evidence: c.evidence, source: src.label, href: src.href });
      continue;
    }
    if (hasScore(c.closest) || hasScore(c.close)) {
      fired.push("guard.honesty");
      gaps.push({ req: c.req, closest: NO_SOURCE_CLOSEST, close: "" });
    } else gaps.push({ req: c.req, closest: c.closest, close: c.close });
  }
  return { matches, gaps, fired };
}

// ---------- Ask (SPEC §8) ----------

export const ASK_UNKNOWN_TEXT =
  "The knowledge base doesn't cover that, so there's no answer to give. Try a suggested question, or ask Aswin directly.";
const DEFAULT_GUARD = "none · answered from the knowledge base";
const MEMORY_GUARD = "none · answered from session memory + knowledge base";
const MEMORY_SOURCE: AskSource = { label: "Your fit check", href: "/#top" };

/** The guard line follows from the kind, so the X-ray line can't name the wrong safeguard. */
const GUARD_BY_KIND: Partial<Record<AskOutput["kind"], string>> = {
  refuse: "guard.prompt_injection",
  none: "guard.not_done",
  conflict: "guard.conflicting_info",
  clarify: "guard.ambiguous_ask",
  gap: "guard.gap_stated",
};

/** Kinds that state facts and must cite at least one source. */
const FACTUAL = new Set<AskOutput["kind"]>(["fit", "gap", "none", "conflict"]);

/**
 * Every factual answer cites ≥ 1 real KB source (or the visitor's own fit check, when sent);
 * otherwise, or if it carries a score, it becomes `unknown`. `todo` lists the placeholders still
 * in the cited entries (dev and preview only: production has none).
 */
export function guardAsk(out: AskOutput, hasMemory: boolean): Omit<AskAnswer, "trace"> & { fired: string | null } {
  const cited: KbEntry[] = [];
  let usedMemory = false;
  for (const id of out.sourceIds) {
    if (id === "memory" && hasMemory) usedMemory = true;
    const e = kbEntry(id);
    if (e && !cited.includes(e)) cited.push(e);
  }
  const uncited = FACTUAL.has(out.kind) && cited.length === 0 && !usedMemory;
  if (out.kind === "unknown" || uncited || hasScore(out.text)) {
    return { kind: "unknown", text: ASK_UNKNOWN_TEXT, sources: [CONTACT_SOURCE], guard: DEFAULT_GUARD, todo: "", fired: uncited ? "ask.citations" : null };
  }
  const sources: AskSource[] = [];
  if (usedMemory) sources.push(MEMORY_SOURCE);
  for (const e of cited) if (!sources.some((s) => s.label === e.label && s.href === e.href)) sources.push({ label: e.label, href: e.href });
  const guard = GUARD_BY_KIND[out.kind] ?? (usedMemory ? MEMORY_GUARD : DEFAULT_GUARD);
  const todo = [...new Set(cited.flatMap((e) => e.todos))].join(" ");
  return { kind: out.kind, text: out.text, sources, guard, todo, fired: GUARD_BY_KIND[out.kind] ?? null };
}
