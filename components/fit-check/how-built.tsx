import type { ReactNode } from "react";
import { XrayPanel } from "@/components/xray-panel";

/** The 8 chips match the step names the API streams; the dashed one is the only branch (design update 5). */
const PIPELINE = [
  ["JD or link", false],
  ["fetch_url · links only", true],
  ["jd.parse", false],
  ["kb.search", false],
  ["evidence.map", false],
  ["guard.citations", false],
  ["guard.honesty", false],
  ["verdict.compose", false],
] as const;

export type HowIBuiltMeta = {
  evalCaseCount: string;
  evalFailedFirst: string;
  whatBreaksFirstAtScale: string;
  noVectorDbReason: string;
};

function Group({ title, items }: { title: string; items: ReactNode[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="m-0 text-[15px] font-semibold">{title}</h4>
      <ul className="m-0 flex list-disc flex-col gap-[6px] pl-[18px] text-[14px] leading-[1.5] text-xr-ink">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "How I built this" (Hero.dc.html `showHow`, design update 5): plain-language lists in sans type,
 * no toggle, X-ray only, as an X-ray panel. Always in the HTML (`.xray-only`) so check:content sees
 * its placeholders and a reload in X-ray shows it without a flash. The design's `minmax(360px, 1fr)`
 * is capped at the grid's width (`min(360px, 100%)`), which is narrower than 360px on a phone.
 */
export function HowBuilt({ meta }: { meta: HowIBuiltMeta }) {
  return (
    // .xray-only reverts to display: block, so it sits on the wrapper and the panel keeps its flex.
    <div className="xray-only">
      <XrayPanel id="how-built" className="flex flex-col gap-5 rounded-[14px] px-[22px] py-5 font-sans">
        <div className="flex flex-col gap-1 pr-16">
          <h3 className="m-0 text-[18px] font-semibold">How I built this</h3>
          <p className="m-0 text-[14px] leading-[1.5] text-xr-muted">
            The design behind the fit check. Numbers for a run and the current build appear in Build details after a check.
          </p>
        </div>
        <div className="flex flex-col gap-[10px]">
          <h4 className="m-0 text-[15px] font-semibold">Architecture</h4>
          <div className="flex flex-wrap items-center gap-[6px] font-mono text-[13px]">
            {PIPELINE.map(([p, branch], i) => (
              <span key={p} className="contents">
                <span
                  className={`rounded-md bg-xr-paper px-2 py-1 ${branch ? "border border-dashed border-xr-accent" : "border border-solid border-xr-rule"}`}
                >
                  {p}
                </span>
                <span className="text-xr-muted">{i < PIPELINE.length - 1 ? "›" : ""}</span>
              </span>
            ))}
          </div>
          <p className="m-0 text-[14px] leading-[1.5] text-xr-muted">
            Seven steps, one branch and one retry, on one endpoint and one knowledge base. Ask my work uses the same engine with
            its own prompt. The steps you see stream from the real run.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-x-8 gap-y-[22px] border-t border-xr-rule pt-4">
          <Group
            title="Guardrails"
            items={[
              "Answers only from the knowledge base, built from my master resume",
              "Every claim links to its source",
              "Gaps are stated plainly and the verdict is never inflated",
              "Refuses injected instructions, flags conflicting info and asks when a question is vague. Try it in Break my AI",
            ]}
          />
          <Group
            title="Evals"
            items={[
              `${meta.evalCaseCount} test JDs and questions, including bad-fit roles and red-team cases`,
              "Run before every change goes live; the set is public on GitHub",
              `What failed first: ${meta.evalFailedFirst}`,
              "Results for the current build are in Build details",
            ]}
          />
          <Group
            title="Memory and production"
            items={[
              "Session memory: your role and gaps carry into Ask my work",
              "Nothing is kept after the session, and pasted JDs aren’t stored",
              "A per-visitor rate limit and a monthly budget cap",
              "If the AI or knowledge base is down, it stops and says so instead of guessing",
              `Limits: ${meta.whatBreaksFirstAtScale}`,
            ]}
          />
          <Group
            title="Trade-offs and what’s next"
            items={[
              "A fixed pipeline over open tool choice: predictable and testable. The job-search agent is where the model picks its own tools",
              "Evidence tables over a % score: slower to skim, easier to trust",
              `No vector DB in v1, on purpose: ${meta.noVectorDbReason}`,
              <>
                Next: <code className="font-mono text-[13px]">kb.search</code> as an MCP server you can add to Claude
              </>,
            ]}
          />
        </div>
      </XrayPanel>
    </div>
  );
}
