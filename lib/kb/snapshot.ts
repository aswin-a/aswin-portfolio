import { z } from "zod";
import { facts } from "@/content/kb/facts";
import { notDone } from "@/content/kb/not-done";
import { projects } from "@/content/kb/projects";
import { roles } from "@/content/kb/roles";
import { HIDE_UNPROVEN, containsTodo, todosIn } from "@/lib/content";
import { cvHref, type CvLocator } from "@/lib/cv-link";

/**
 * The knowledge base everything the AI may say comes from (SPEC §6). Built once from the typed
 * files in /content/kb (themselves generated from content/cv.ts, design update 6) when the server
 * bundle loads, validated, and frozen. No embeddings.
 *
 * Production drops any entry that still holds a todo() placeholder ("Anything without proof
 * yet is left out"). The not-done list has no placeholders and is always present.
 */
export const KB_SCOPES = ["roles", "projects", "not_done", "facts"] as const;
export type KbScope = (typeof KB_SCOPES)[number];

const Locator = z.object({ roleId: z.string().min(1), group: z.int().optional(), item: z.int().optional() });

export const KbEntrySchema = z.object({
  id: z.string().min(1),
  scope: z.enum(KB_SCOPES),
  label: z.string().min(1),
  href: z.string().min(1),
  /** The whole entry as plain text (kb.search matches on it). */
  text: z.string().min(1),
  /** The entry without its numbered lines; the model sees `head` then `L1…Ln` (SPEC §6.1). */
  head: z.string(),
  /** CV lines the model can cite by number (1-based in the prompt), each with its CV locator. */
  lines: z.array(z.object({ at: Locator, text: z.string().min(1) })),
  /** Where the entry sits on the CV (SPEC §6.1); empty when it isn't on the CV. */
  cv: z.array(Locator),
  /** Extra words kb.search matches on (not shown to the model as facts). */
  tags: z.array(z.string()),
  /** Not-done entries: what the gap card says. */
  notDone: z.object({ closest: z.string().optional(), note: z.string() }).optional(),
  /** Placeholders still in the entry (dev and preview only; production drops these entries). */
  todos: z.array(z.string()),
});
export type KbEntry = z.infer<typeof KbEntrySchema>;

type Line = { at: CvLocator; text: string };
const withLines = (head: string, lines: Line[]) => ({ head, lines, text: [head, ...lines.map((l) => l.text)].filter(Boolean).join(" ") });

function build(): KbEntry[] {
  const entries: KbEntry[] = [
    ...roles.map((r) => ({
      id: r.id,
      scope: "roles" as const,
      label: r.label,
      href: r.href,
      ...withLines(
        [`${r.title}, ${r.company} (${r.years}).`, r.summary, ...r.details, r.evidence.length ? `Evidence:${r.evidence.map((x) => ` ${x}`).join("")}` : ""].filter(Boolean).join(" "),
        r.lines,
      ),
      cv: r.cv,
      tags: r.tags ?? [],
      todos: todosIn(r),
    })),
    ...projects.map((p) => ({
      id: p.id,
      scope: "projects" as const,
      label: p.label,
      href: p.href,
      ...withLines(`${p.title} (${p.status}). ${p.summary}${p.evidence.length || p.lines.length ? " Evidence:" : ""}${p.evidence.map((x) => ` ${x}`).join("")}`, p.lines),
      cv: p.cv,
      tags: p.tags ?? [],
      todos: todosIn(p),
    })),
    ...notDone.map((n) => ({
      id: n.id,
      scope: "not_done" as const,
      label: "Not done · CV",
      href: "/about",
      ...withLines(`NOT DONE: ${n.topic}.${n.closest ? ` Closest: ${n.closest}` : ""}`, []),
      cv: [],
      notDone: { closest: n.closest, note: n.note },
      tags: [],
      todos: todosIn(n),
    })),
    ...facts.map((f) => ({
      id: f.id,
      scope: "facts" as const,
      label: f.label,
      href: f.href,
      // A one-line fact is just its numbered line.
      ...(f.lines?.length ? { text: f.text, head: "", lines: f.lines } : withLines(f.text, [])),
      cv: f.cv ?? [],
      tags: [],
      todos: todosIn(f),
    })),
  ];
  const kept = HIDE_UNPROVEN ? entries.filter((e) => !containsTodo(e)) : entries;
  const parsed = z.array(KbEntrySchema).parse(kept);
  const ids = new Set<string>();
  for (const e of parsed) {
    if (ids.has(e.id)) throw new Error(`Duplicate KB id: ${e.id}`);
    ids.add(e.id);
  }
  return parsed.map((e) => Object.freeze(e));
}

export const KB: readonly KbEntry[] = Object.freeze(build());

const BY_ID = new Map(KB.map((e) => [e.id, e]));
export function kbEntry(id: string): KbEntry | undefined {
  return BY_ID.get(id);
}

/**
 * One block per entry, for prompts: `[id] (scope) head`, then each citable CV line on its own row
 * as `  L{n} text` (SPEC §6.1), so the model can say which lines it relied on.
 */
export function formatEntries(entries: readonly KbEntry[]): string {
  return entries
    .map((e) => [`[${e.id}] (${e.scope}) ${e.head}`.trimEnd(), ...e.lines.map((l, i) => `  L${i + 1} ${l.text}`)].join("\n"))
    .join("\n");
}

/**
 * The link for an entry: the CV deep link for the cited lines (1-based `L` numbers; unknown ones
 * are ignored), or for the whole entry when none are valid. Entries that link elsewhere (a case
 * study) or aren't on the CV keep their `href`.
 */
export function entryHref(e: KbEntry, lineNums: readonly number[] = [], req = ""): string {
  if (e.href !== "/about" || e.cv.length === 0) return e.href;
  const cited = validLines(e, lineNums).map((n) => e.lines[n - 1].at);
  return cvHref(cited.length ? cited : e.cv, req);
}

/** The cited line numbers that exist in the entry, deduplicated, in order. */
export function validLines(e: KbEntry, lineNums: readonly number[]): number[] {
  return [...new Set(lineNums)].filter((n) => Number.isInteger(n) && n >= 1 && n <= e.lines.length).sort((a, b) => a - b);
}
