import { cvItems } from "@/content/cv";

/**
 * CV locators and `#cv=` deep links (design update 14, SPEC §6.1).
 *
 * A locator points into content/cv.ts: `{ roleId }` is a whole CV item, `{ roleId, group }` one of
 * its areas, and `item` one line (a group's point, or a highlight when there is no group). Indices
 * are 0-based in content/cv.ts order, which matches CV_ITEMS in About.dc.html.
 *
 * The link format is the design's (About.dc.html `cvParseHash`); ask Aswin before changing it:
 *   /about#cv=<targets>&req=<url-encoded text>
 *   target = roleId[.groupIndex][.itemList] · itemList = 3 | 3-5 | 3,7 · targets joined by "+"
 *   roles without areas: roleId..itemList
 */

export type CvLocator = { roleId: string; group?: number; item?: number };
/** One parsed target: a CV item, an optional area, and the points to highlight. */
export type CvTarget = { id: string; group: number | null; items: number[] };
export type CvFocus = { targets: CvTarget[]; req: string };

const ITEM = new Map(cvItems.map((it) => [it.id, it]));

/** The CV text a line locator points at, or undefined when it doesn't resolve to a line. */
export function cvLineText(at: CvLocator): string | undefined {
  const it = ITEM.get(at.roleId);
  if (!it || at.item === undefined) return undefined;
  if (at.group === undefined) return it.groups ? undefined : it.highlights[at.item];
  return it.groups?.[at.group]?.items[at.item];
}

/** Does the locator point at something on the CV (an item, an area or a line)? */
export function resolves(at: CvLocator): boolean {
  const it = ITEM.get(at.roleId);
  if (!it) return false;
  if (at.item !== undefined) return cvLineText(at) !== undefined;
  if (at.group !== undefined) return !!it.groups?.[at.group];
  return true;
}

/** Locators → targets, merging lines of the same item and area, in first-seen order. */
export function toTargets(locs: readonly CvLocator[]): CvTarget[] {
  const out: CvTarget[] = [];
  for (const l of locs) {
    const group = l.group ?? null;
    let t = out.find((x) => x.id === l.roleId && x.group === group);
    if (!t) out.push((t = { id: l.roleId, group, items: [] }));
    if (l.item !== undefined && !t.items.includes(l.item)) t.items.push(l.item);
  }
  // A whole-area (or whole-item) locator wins over single lines in it.
  for (const l of locs) {
    if (l.item !== undefined) continue;
    const t = out.find((x) => x.id === l.roleId && x.group === (l.group ?? null));
    if (t) t.items = [];
  }
  for (const t of out) t.items.sort((a, b) => a - b);
  return out;
}

/** [6,7,8,9] → "6-9"; [7,10] → "7,10"; [0,1] → "0-1". */
function itemList(items: readonly number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < items.length) {
    let j = i;
    while (j + 1 < items.length && items[j + 1] === items[j] + 1) j++;
    parts.push(j > i ? `${items[i]}-${items[j]}` : `${items[i]}`);
    i = j + 1;
  }
  return parts.join(",");
}

export function formatTarget(t: CvTarget): string {
  const list = itemList(t.items);
  if (t.group === null) return list ? `${t.id}..${list}` : t.id;
  return list ? `${t.id}.${t.group}.${list}` : `${t.id}.${t.group}`;
}

/** The deep link into the CV for these locators, with the requirement or question as `req`. */
export function cvHref(locs: readonly CvLocator[], req = ""): string {
  const targets = toTargets(locs);
  if (!targets.length) return "/about";
  const cv = targets.map(formatTarget).join("+");
  return `/about#cv=${cv}${req ? `&req=${encodeURIComponent(req)}` : ""}`;
}

/** `cvParseHash` from About.dc.html: unknown role ids are dropped; none left → null. */
export function parseCvHash(hash: string): CvFocus | null {
  const m = /cv=([^&]+)/.exec(hash);
  if (!m) return null;
  const r = /req=([^&]+)/.exec(hash);
  let raw: string;
  let req = "";
  try {
    raw = decodeURIComponent(m[1]);
    req = r ? decodeURIComponent(r[1]) : "";
  } catch {
    return null;
  }
  const targets = raw
    .split("+")
    .map((part): CvTarget => {
      const bits = part.split(".");
      const items: number[] = [];
      for (const seg of (bits[2] ?? "").split(",")) {
        if (!seg) continue;
        const ab = seg.split("-").map((n) => parseInt(n, 10));
        const end = ab.length > 1 ? ab[1] : ab[0];
        // Guard against huge or broken ranges in a hand-edited hash.
        if (!Number.isFinite(ab[0]) || !Number.isFinite(end) || end - ab[0] > 100) continue;
        for (let k = ab[0]; k <= end; k++) items.push(k);
      }
      const g = bits[1] === undefined || bits[1] === "" ? null : parseInt(bits[1], 10);
      return { id: bits[0], group: g !== null && Number.isFinite(g) ? g : null, items };
    })
    .filter((t) => ITEM.has(t.id));
  return targets.length ? { targets, req } : null;
}

/** Is point `item` of area `group` (null: the item's highlights) highlighted by these targets? */
export function isHighlighted(targets: readonly CvTarget[], group: number | null, item: number): boolean {
  return targets.some((t) => t.group === group && (t.items.length === 0 ? group !== null : t.items.includes(item)));
}
