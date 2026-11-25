import { randomBytes } from "node:crypto";
import { NO_TOKENS, addTokens, costUsd, type Tokens } from "@/lib/ai/cost";
import type { ServerEnv } from "@/lib/server/env";

/** What a run records about itself as it goes: the source for the trace, the log row and the budget. */
export type RunRecord = {
  runId: string;
  startedAt: number;
  /** Wall-clock start, ISO 8601 (the "Time" in X-ray's "This run"). */
  startedAtIso: string;
  mode: "fit" | "ask";
  drill: "kb" | "rate" | null;
  branch: "link" | "text" | null;
  steps: { tool: string; status: string; ms: number }[];
  guardFired: string[];
  retries: number;
  /** Fit check only: requirements found, sources retrieved and cited, fallback used (SPEC §10). */
  requirements: number | null;
  sourcesRetrieved: number | null;
  sourcesCited: number | null;
  fallback: "error" | "limited" | "budget" | null;
  /** Model id for pricing and the log. Empty until a model is resolved. */
  model: string;
  tokens: Tokens;
  /** False for runs that must not be logged (failed or limited Ask attempts, SPEC §8). */
  log: boolean;
  /** Set once the cost is counted and the row logged, so neither happens twice. */
  finished?: boolean;
};

export type RunContext = {
  env: ServerEnv;
  visitor: string;
  signal: AbortSignal;
  now: () => number;
};

/** Run ids look like the design's trace ids: `run_` + 12 hex characters. */
export function newRunId(): string {
  return `run_${randomBytes(6).toString("hex")}`;
}

export function newRecord(mode: RunRecord["mode"], now: () => number): RunRecord {
  return {
    runId: newRunId(),
    startedAt: now(),
    startedAtIso: new Date().toISOString(),
    mode,
    drill: null,
    branch: null,
    steps: [],
    guardFired: [],
    retries: 0,
    requirements: null,
    sourcesRetrieved: null,
    sourcesCited: null,
    fallback: null,
    model: "",
    tokens: NO_TOKENS,
    log: true,
  };
}

export function addUsage(rec: RunRecord, t: Tokens) {
  rec.tokens = addTokens(rec.tokens, t);
}

/** This run's real cost so far, from the tokens the API reported. */
export function runCost(rec: RunRecord): number {
  return rec.model ? costUsd(rec.model, rec.tokens) : 0;
}

/** Cost rounded for display (4 decimal places, as the result footer shows). */
export function displayCost(usd: number): number {
  return Math.round(usd * 1e5) / 1e5;
}
