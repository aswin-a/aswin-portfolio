import type { FallbackEvent, Drill, ResultEvent, StepEvent } from "./types";

/**
 * The last finished fit check, kept so it survives leaving the home page (e.g. a CV link → /about)
 * and coming back, until "Try another role" clears it. Module memory only: the pasted JD is never
 * written to storage (the design promises "not stored"), so a full reload starts fresh.
 */
export type HeroSnapshot<Phase extends string, Entry> = {
  phase: Phase;
  jd: string;
  role: string;
  drill: Drill | null;
  steps: StepEvent[];
  result: ResultEvent | null;
  fallback: FallbackEvent | null;
  log: Entry[];
  entryId: number;
};

let snapshot: unknown = null;

export const heroCache = {
  get<Phase extends string, Entry>(): HeroSnapshot<Phase, Entry> | null {
    return snapshot as HeroSnapshot<Phase, Entry> | null;
  },
  set<Phase extends string, Entry>(value: HeroSnapshot<Phase, Entry>): void {
    snapshot = value;
  },
  clear(): void {
    snapshot = null;
  },
};
