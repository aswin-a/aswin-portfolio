import { describe, expect, it } from "vitest";
import { LIVE_CASE_STUDIES } from "@/content/case-studies/visibility";
import { CASE_STUDY_SLUGS } from "@/lib/case-studies";
import { isHiddenStudy, isHiddenStudyHref, plainLabel } from "@/lib/case-study-visibility";

describe("case-study visibility (Aswin, 2026-11-24)", () => {
  it("lists only real case-study slugs", () => {
    for (const s of LIVE_CASE_STUDIES) expect(CASE_STUDY_SLUGS as readonly string[]).toContain(s);
  });
  it("hides every study that isn't listed", () => {
    for (const s of CASE_STUDY_SLUGS) expect(isHiddenStudy(s)).toBe(!LIVE_CASE_STUDIES.includes(s));
  });
  it("matches only links to a case-study page", () => {
    const s = CASE_STUDY_SLUGS[0];
    const hidden = isHiddenStudy(s);
    expect(isHiddenStudyHref(`/work/${s}`)).toBe(hidden);
    expect(isHiddenStudyHref(`/work/${s}#safeguards`)).toBe(hidden);
    expect(isHiddenStudyHref("/work")).toBe(false);
    expect(isHiddenStudyHref("/about")).toBe(false);
    expect(isHiddenStudyHref("#top")).toBe(false);
    expect(isHiddenStudyHref("https://example.com/work/x")).toBe(false);
  });
  it("drops the trailing arrow from a link label", () => {
    expect(plainLabel("Read the case study →")).toBe("Read the case study");
    expect(plainLabel("Try it above ↑")).toBe("Try it above");
    expect(plainLabel("Watch the recorded run")).toBe("Watch the recorded run");
  });
});
