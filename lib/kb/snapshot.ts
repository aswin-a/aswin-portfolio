import { z } from "zod";
import { facts } from "@/content/kb/facts";
import { notDone } from "@/content/kb/not-done";
import { projects } from "@/content/kb/projects";
import { roles } from "@/content/kb/roles";
import { HIDE_UNPROVEN, containsTodo, todosIn } from "@/lib/content";

/**
 * The knowledge base everything the AI may say comes from (SPEC §6). Built once from the typed
 * files in /content/kb (themselves generated from content/cv.ts, design update 6) when the server
 * bundle loads, validated, and frozen. No embeddings.
 *
 * Production drops any entry that still holds a TODO(aswin) placeholder ("Anything without proof
 * yet is left out"). The not-done list has no placeholders and is always present.
 */
export const KB_SCOPES = ["roles", "projects", "not_done", "facts"] as const;
export type KbScope = (typeof KB_SCOPES)[number];

export const KbEntrySchema = z.object({
  id: z.string().min(1),
  scope: z.enum(KB_SCOPES),
  label: z.string().min(1),
  href: z.string().min(1),
  /** The entry as the model sees it. */
  text: z.string().min(1),
  /** Extra words kb.search matches on (not shown to the model as facts). */
  tags: z.array(z.string()),
  /** Not-done entries: what the gap card says. */
  notDone: z.object({ closest: z.string().optional(), note: z.string() }).optional(),
  /** Placeholders still in the entry (dev and preview only; production drops these entries). */
  todos: z.array(z.string()),
});
export type KbEntry = z.infer<typeof KbEntrySchema>;

function build(): KbEntry[] {
  const entries: KbEntry[] = [
    ...roles.map((r) => ({
      id: r.id,
      scope: "roles" as const,
      label: r.label,
      href: r.href,
      text: [`${r.title}, ${r.company} (${r.years}).`, r.summary, ...r.details].filter(Boolean).join(" "),
      tags: r.tags ?? [],
      todos: todosIn(r),
    })),
    ...projects.map((p) => ({
      id: p.id,
      scope: "projects" as const,
      label: p.label,
      href: p.href,
      text: `${p.title} (${p.status}). ${p.summary}${p.evidence.length ? ` Evidence: ${p.evidence.join(" ")}` : ""}`,
      tags: p.tags ?? [],
      todos: todosIn(p),
    })),
    ...notDone.map((n) => ({
      id: n.id,
      scope: "not_done" as const,
      label: "Not done · About",
      href: "/about",
      text: `NOT DONE: ${n.topic}.${n.closest ? ` Closest: ${n.closest}` : ""}`,
      notDone: { closest: n.closest, note: n.note },
      tags: [],
      todos: todosIn(n),
    })),
    ...facts.map((f) => ({ id: f.id, scope: "facts" as const, label: f.label, href: f.href, text: f.text, tags: [], todos: todosIn(f) })),
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

/** One line per entry, for prompts: `[id] (scope) text`. */
export function formatEntries(entries: readonly KbEntry[]): string {
  return entries.map((e) => `[${e.id}] (${e.scope}) ${e.text}`).join("\n");
}
