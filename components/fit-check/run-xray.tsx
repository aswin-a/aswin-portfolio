"use client";

import type { Ref } from "react";
import { XrayPanel } from "@/components/xray-panel";
import type { ResultEvent } from "@/lib/fit-check/types";

/** Build metadata and offline-eval numbers for "Build details" (from the build and site-meta). */
export type BuildMeta = {
  build: string;
  prompt: string;
  kbSynced: string;
  offlineEval: string;
  redTeam: string;
  evalSet: { href: string; todo: string };
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const num = (n: number) => n.toLocaleString("en-GB");

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-xr-muted">{label}</span>
      {children}
    </div>
  );
}

const value = "text-[15px] leading-[1.4]";
const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-x-6 gap-y-4";

/**
 * X-ray "This run" + "Build details" (Hero.dc.html `showRunXray`, design update 3). Every value
 * is the run's own record, the same one written to the run log (SPEC §10), or build metadata.
 * Nothing here is estimated.
 */
export function RunXray({ result, meta, ref }: { result: ResultEvent; meta: BuildMeta; ref?: Ref<HTMLDivElement> }) {
  const t = result.trace;
  const m = result.matches.length;
  const g = result.gaps.length;
  const time = t
    ? new Date(t.startedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "[timestamp]";
  const run: [string, string, boolean?][] = [
    ["Run ID", t?.runId ?? "[run id]"],
    ["Time", time],
    ["Input", t ? (t.branch === "link" ? "Link · fetch_url called" : "Text · fetch_url skipped") : "[branch]"],
    ["Retries", `${result.retries} of 1 used`],
    ["Requirements found", `${t?.requirements ?? m + g} in the JD`],
    ["Sources", `${t ? t.sourcesRetrieved : "[N]"} retrieved · ${t ? t.sourcesCited : "[N]"} cited`],
    ["Result", `${plural(m, "match", "matches")} · ${plural(g, "gap", "gaps")}`],
    [
      "Guardrails",
      t ? `citations ${t.guards.citations ? "✓" : "×"} · honesty ${t.guards.honesty ? "✓" : "×"}` : "[guardrails]",
      true,
    ],
    ["Fallback", "Not needed"],
    ["Response time", `${t ? (t.ms / 1000).toFixed(1) : "[logged]"} s total`],
    ["Tokens", t ? `${num(t.tokensIn)} in · ${num(t.tokensOut)} out` : "[in] in · [out] out"],
    ["Cost", t ? `$${t.costUsd.toFixed(4)}` : "[logged]"],
  ];
  const build: [string, string][] = [
    ["Build", meta.build],
    ["Model", t?.model ?? "[provider · model]"],
    ["Prompt", meta.prompt],
    ["Knowledge base", meta.kbSynced],
    ["Offline eval", meta.offlineEval],
    ["Red-team cases", meta.redTeam],
  ];
  return (
    <XrayPanel ref={ref} className="flex flex-col gap-[18px] rounded-[14px] px-[22px] py-5 font-sans">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-[18px] font-semibold">This run</h3>
        <p className="m-0 text-[14px] text-xr-muted">From the logged trace of the check you just ran.</p>
      </div>
      <div className={grid}>
        {run.map(([label, v, accent]) => (
          <Item key={label} label={label}>
            <span className={`${value} ${accent ? "text-xr-accent" : "text-xr-ink"}`}>{v}</span>
          </Item>
        ))}
      </div>
      <div className="flex flex-col gap-[14px] border-t border-xr-rule pt-4">
        <h4 className="m-0 text-[15px] font-semibold">Build details</h4>
        <div className={grid}>
          {build.map(([label, v]) => (
            <Item key={label} label={label}>
              <span className={`${value} text-xr-ink`}>{v}</span>
            </Item>
          ))}
          <Item label="Eval set">
            <a href={meta.evalSet.href} className={`${value} text-xr-accent`}>
              View on GitHub{meta.evalSet.todo} →
            </a>
          </Item>
        </div>
      </div>
    </XrayPanel>
  );
}
