import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * WCAG 2.2 AA contrast for every text colour on every surface it is used on (SPEC §14.8), on the
 * light page and inside the dark X-ray panels. Values are read from app/globals.css, so a token
 * change is checked too. AA: 4.5:1 for normal text, 3:1 for large text (≥ 24px, or ≥ 18.66px bold).
 * Disabled controls (opacity 0.45–0.6 while unavailable) are exempt under WCAG 1.4.3.
 */
const css = readFileSync("app/globals.css", "utf8");
function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
}

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const lum = ([r, g, b]: RGB) => {
  const c = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** `fg` drawn at `alpha` over `bg`. */
const over = (fg: RGB, bg: RGB, alpha: number): RGB => fg.map((v, i) => alpha * v + (1 - alpha) * bg[i]) as RGB;

const t = (n: string) => rgb(token(n));

// Text colours × the surfaces they sit on (from the components' class names).
const PAGE_TEXT = ["ink", "muted", "accent", "amber-text"];
const PAGE_SURFACES = ["bg", "panel", "paper", "accent-tint"];
const XR_TEXT = ["xr-ink", "xr-muted", "xr-accent", "xr-amber-text"];
const XR_SURFACES = ["xr-bg", "xr-panel", "xr-paper", "xr-accent-tint"];

describe("contrast: light page", () => {
  for (const fg of PAGE_TEXT)
    for (const bg of PAGE_SURFACES)
      it(`${fg} on ${bg} ≥ 4.5`, () => expect(ratio(t(fg), t(bg))).toBeGreaterThanOrEqual(4.5));

  it("amber-text on amber-bg (the human step, PARTIAL pills) ≥ 4.5", () =>
    expect(ratio(t("amber-text"), t("amber-bg"))).toBeGreaterThanOrEqual(4.5));
  it("btn-ink on btn-bg ≥ 4.5", () => expect(ratio(t("btn-ink"), t("btn-bg"))).toBeGreaterThanOrEqual(4.5));
  it("paper on accent (NEW and RESULT pills) ≥ 4.5", () => expect(ratio(t("paper"), t("accent"))).toBeGreaterThanOrEqual(4.5));
  it("video caption on the video frame ≥ 4.5", () =>
    expect(ratio(t("video-caption"), t("video-bg"))).toBeGreaterThanOrEqual(4.5));
  it("⌘K at 75% on the Ask button ≥ 4.5", () =>
    expect(ratio(over(t("btn-ink"), t("btn-bg"), 0.75), t("btn-bg"))).toBeGreaterThanOrEqual(4.5));
  it("filter counts at 70%, on and off ≥ 4.5", () => {
    expect(ratio(over(t("btn-ink"), t("btn-bg"), 0.7), t("btn-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(over(t("ink"), t("bg"), 0.7), t("bg"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("contrast: X-ray panels", () => {
  for (const fg of XR_TEXT)
    for (const bg of XR_SURFACES)
      it(`${fg} on ${bg} ≥ 4.5`, () => expect(ratio(t(fg), t(bg))).toBeGreaterThanOrEqual(4.5));

  it("xr-amber-text on xr-amber-bg ≥ 4.5", () => expect(ratio(t("xr-amber-text"), t("xr-amber-bg"))).toBeGreaterThanOrEqual(4.5));
  it("xr-btn-ink on xr-btn-bg ≥ 4.5", () => expect(ratio(t("xr-btn-ink"), t("xr-btn-bg"))).toBeGreaterThanOrEqual(4.5));
});

describe("focus ring", () => {
  // WCAG 1.4.11: a focus indicator needs 3:1 against what it sits on.
  for (const bg of ["bg", "panel", "paper", "xr-bg", "xr-paper"])
    it(`#4F7FC0 against ${bg} ≥ 3`, () => expect(ratio(t("focus"), t(bg))).toBeGreaterThanOrEqual(3));
});
