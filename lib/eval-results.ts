import raw from "@/content/eval-results.json";
import { todo } from "@/lib/content";
import { EvalResultsSchema, type EvalResults } from "@/lib/schemas/content";

/** The offline eval numbers the site shows, from content/eval-results.json (SPEC §10). A malformed file fails the build. */
export const evalResults: EvalResults = EvalResultsSchema.parse(raw);

/** "23 Nov 2026", like the build date. */
export function evalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** The site's eval fields: real numbers after a real run, the design's placeholders before it. */
export function evalMeta(r: EvalResults = evalResults) {
  if (r.lastRun === null) {
    return {
      evalCaseCount: todo("[25]"), // "[25]" in Hero.dc.html update 5 and the hood card
      evalLastRun: todo("[date]"),
      // X-ray "Build details" (design update 3): "[passed]/[total] cases" and "[held]/[total] held".
      evalPassed: todo("[passed]"),
      evalTotal: todo("[total]"),
      evalRedTeamPassed: todo("[held]"),
      evalRedTeamTotal: todo("[total]"),
    };
  }
  return {
    evalCaseCount: String(r.cases),
    evalLastRun: evalDate(r.lastRun),
    evalPassed: String(r.passed),
    evalTotal: String(r.cases),
    evalRedTeamPassed: String(r.redTeam.held),
    evalRedTeamTotal: String(r.redTeam.total),
  };
}
