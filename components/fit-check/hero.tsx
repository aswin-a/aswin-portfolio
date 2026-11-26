"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BreakPanel, resetButton, type BreakEntry } from "@/components/fit-check/break-panel";
import { RunXray, type BuildMeta } from "@/components/fit-check/run-xray";
import { Fallback } from "@/components/fit-check/fallback";
import { FitInput } from "@/components/fit-check/fit-input";
import { HowBuilt, type HowIBuiltMeta } from "@/components/fit-check/how-built";
import { Result } from "@/components/fit-check/result";
import { useSite } from "@/components/xray-provider";
import { ASK_BUDGET, ASK_ERROR, ASK_LIMITED } from "@/lib/ask/copy";
import { sessionMemory } from "@/lib/ask/session-memory";
import { ASK_TOOLS } from "@/lib/ask/types";
import { breakAttempt, runFitCheck } from "@/lib/fit-check/client";
import {
  BREAK_LOG_MAX,
  HERO_DRILLS,
  breakVerdict,
  HERO_SAMPLES,
  isLink,
  isStrongFit,
  heroSummary,
  NUDGE,
  SKIPPED_FETCH,
  SKIPPED_FETCH_STATUS,
  STEP_COPY,
} from "@/lib/fit-check/copy";
import { rolePrefill } from "@/lib/fit-check/role-prefill";
import { FIT_TOOLS, FitEventSchema, type Drill, type FallbackEvent, type ResultEvent, type StepEvent } from "@/lib/fit-check/types";

export type { BuildMeta, HowIBuiltMeta };

/** "break" is no longer a state (design update 3): Break my AI is an X-ray panel below the fit check. */
type Phase = "empty" | "running" | "result" | "badfit" | "error" | "limited" | "budget" | "link";

const statusLabel = "m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-muted";

/**
 * The fit-check hero (Hero.dc.html, the states in HeroStates.dc.html). Every state change
 * comes from the run's event stream (SPEC §7): `step` rows while running, then `result` or
 * `fallback`. Nothing here is timed or scripted.
 */
export function Hero({ meta, buildMeta }: { meta: HowIBuiltMeta; buildMeta: BuildMeta }) {
  const { xray, setXray, openAsk } = useSite();

  const [phase, setPhase] = useState<Phase>("empty");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [result, setResult] = useState<ResultEvent | null>(null);
  const [fallback, setFallback] = useState<FallbackEvent | null>(null);
  const [log, setLog] = useState<BreakEntry[]>([]);
  const [breakRunning, setBreakRunning] = useState(false);
  const breakBusy = useRef(false);
  const [breakError, setBreakError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // The result nudge's "Turn on X-ray →" scrolls to "This run" once it renders (Aswin, 2026-11-19).
  const runXrayRef = useRef<HTMLDivElement>(null);
  const scrollToRun = useRef(false);
  const entryId = useRef(0);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Focus target of the current state. When the control that started a change unmounts
  // (a sample chip, "Try another role"), focus moves here instead of being lost.
  const focusRef = useRef<HTMLElement | null>(null);
  const setFocusTarget = useCallback((el: HTMLElement | null) => {
    focusRef.current = el;
  }, []);
  // The streamed steps hand focus on too: once the result or fallback arrives, its heading takes focus,
  // so a screen reader announces the verdict, not only "done · 7 steps" (accessibility pass, M8).
  useEffect(() => {
    const active = document.activeElement;
    const handOff = active instanceof HTMLElement && active.hasAttribute("data-focus-handoff");
    if (!active || active === document.body || handOff) focusRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const run = useCallback(async (text: string, runRole: string, runDrill: Drill | null = null) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setJd(text);
    setRole(runRole);
    setDrill(runDrill);
    setSteps([]);
    setResult(null);
    setFallback(null);
    setPhase("running");

    const setFallbackState = (ev: FallbackEvent) => {
      setFallback(ev);
      setPhase(ev.reason);
      // A drill's real fallback adds a DRILL entry to Break my AI (design update 4). Never counted.
      if (ev.drill) {
        const chip = HERO_DRILLS.find((d) => d.id === ev.drill)?.chip ?? ev.drill;
        const entry: BreakEntry = { id: ++entryId.current, kind: "drill", text: chip, drill: ev.drill, runId: ev.runId };
        setLog((prev) => [entry, ...prev].slice(0, BREAK_LOG_MAX));
      }
    };
    const fail = () => setFallbackState({ type: "fallback", reason: "error" });
    try {
      for await (const raw of runFitCheck({ jd: text, drill: runDrill ?? undefined }, ac.signal)) {
        if (ac.signal.aborted) return;
        const parsed = FitEventSchema.safeParse(raw);
        if (!parsed.success) return fail();
        const ev = parsed.data;
        if (ev.type === "start") continue;
        if (ev.type === "step") {
          setSteps((prev) => {
            const i = prev.findIndex((s) => s.tool === ev.tool);
            return i === -1 ? [...prev, ev] : prev.map((s, j) => (j === i ? ev : s));
          });
        } else if (ev.type === "result") {
          const finalRole = ev.role ?? runRole;
          setRole(finalRole);
          setResult(ev);
          setPhase(isStrongFit(ev.matches.length, ev.gaps.length) ? "result" : "badfit");
          // Session memory for Ask my work (SPEC §5): role, match count and gaps only.
          sessionMemory.set({
            role: finalRole,
            matchCount: ev.matches.length,
            gaps: ev.gaps.map(({ req, closest, close }) => ({ req, closest, close })),
          });
          return;
        } else {
          setFallbackState(ev);
          return;
        }
      }
      // The stream ended without a result or fallback.
      if (!ac.signal.aborted) fail();
    } catch {
      if (!ac.signal.aborted) fail();
    }
  }, []);

  const reset = () => {
    abortRef.current?.abort();
    setPhase("empty");
    setJd("");
    setDrill(null);
    setSteps([]);
  };

  // Attempts run beside the fit check and never interrupt it (design update 3).
  // One attempt at a time (design update 4). Its pending entry follows the run's real step events.
  const attack = async (text: string) => {
    if (breakBusy.current) return;
    breakBusy.current = true;
    setBreakRunning(true);
    setBreakError(null);
    const id = ++entryId.current;
    const update = (fn: (e: BreakEntry) => BreakEntry) => setLog((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));
    setLog((prev) => [{ id, kind: "pending" as const, text, step: null, progress: 0 }, ...prev].slice(0, BREAK_LOG_MAX));
    const r = await breakAttempt(text, (ev) => {
      if (ev.status !== "running") return;
      const i = ASK_TOOLS.indexOf(ev.tool);
      update((e) => (e.kind === "pending" ? { ...e, step: ev.tool, progress: Math.round(((i + 1) / ASK_TOOLS.length) * 100) } : e));
    });
    breakBusy.current = false;
    setBreakRunning(false);
    // A failed or rate-limited attempt isn't logged or counted; Ask's line says why (SPEC §8).
    if (r.status !== "ok") {
      setLog((prev) => prev.filter((e) => e.id !== id));
      setBreakError(r.status === "limited" ? ASK_LIMITED : r.status === "budget" ? ASK_BUDGET : ASK_ERROR);
      return;
    }
    const [verdict, tone] = breakVerdict(r.reply.kind);
    update(() => ({ id, kind: "done", text, verdict, tone, reply: r.reply.text, guard: r.reply.guard, trace: r.reply.trace }));
  };

  useEffect(() => {
    const el = runXrayRef.current;
    if (!scrollToRun.current || !xray || !el) return;
    scrollToRun.current = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // scroll-padding-top keeps it clear of the sticky nav.
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [xray, result]);

  const talk = () => rolePrefill.send(role);
  const isResult = (phase === "result" || phase === "badfit") && result !== null;
  const showFallback = (phase === "error" || phase === "limited" || phase === "budget" || phase === "link") && fallback !== null;
  const linkRun = isLink(jd);
  const showSteps = (phase === "running" && !drill) || isResult;
  // "Checking… step n of 7": the step running now, counted from the real step events.
  const stepNum = Math.min(steps.filter((st) => st.status !== "running").length + 1, FIT_TOOLS.length);

  let nudge = "";
  if (isResult) nudge = NUDGE.result;
  else if (showFallback && drill) nudge = NUDGE.drill;

  return (
    <section className="box-border w-full bg-bg px-6 pt-[72px] pb-16 font-sans text-ink max-[640px]:px-4 max-[640px]:pt-7 max-[640px]:pb-9">
      <div className="mx-auto flex max-w-[1040px] flex-col gap-7 max-[640px]:gap-5">
        <div className="flex flex-col gap-[18px]">
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">Aswin · Senior Product Manager</p>
          <h1 className="m-0 font-serif text-[clamp(32px,4vw,46px)] font-normal max-[640px]:text-[32px] leading-[1.1] tracking-[-0.015em]">
            Platform PM who builds for agents.
          </h1>
          <p className="m-0 max-w-[720px] font-serif text-[20px] leading-[1.45] text-muted max-[640px]:text-[18px]">
            I build platforms, AI-powered products, and systems that turn emerging technology into real-world capability.
          </p>
        </div>

        <section
          aria-labelledby="fit-h"
          className="mt-2 flex flex-col gap-[22px] rounded-[20px] border border-rule bg-panel p-[clamp(18px,3vw,32px)] max-[640px]:gap-4 max-[640px]:rounded-2xl max-[640px]:p-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2 border-b border-rule pb-[18px]">
            <div className="flex flex-col gap-2">
              <span className="self-start rounded-full bg-accent px-[9px] py-[3px] font-mono text-[11px] tracking-[0.08em] text-paper">
                FIT CHECK · LIVE AI
              </span>
              <h2 id="fit-h" className="m-0 font-sans text-[clamp(24px,3vw,30px)] font-semibold leading-[1.2] tracking-[-0.01em]">
                Will I fit your role?
              </h2>
              <span className="font-mono text-[12px] text-muted">answers from my real record · gaps shown, not hidden</span>
            </div>
          </div>

          {phase === "empty" && (
            <FitInput
              jd={jd}
              onJd={setJd}
              onCheck={() => {
                if (jd.trim()) run(jd, heroSummary(jd));
              }}
              onSample={(s) => run(s.jd, s.role)}
              inputRef={setFocusTarget}
            />
          )}

          {phase !== "empty" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-rule bg-paper px-[18px] py-[14px]">
              <p className="m-0 min-w-0 flex-[1_1_320px] text-[15px] leading-[1.45]">
                <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                  {drill ? "Drill running against" : phase === "running" ? "Checking against" : "Checked against"}{" "}
                </span>
                <b className="font-semibold [overflow-wrap:anywhere]">{role}</b>
              </p>
              {phase === "running" ? (
                <div role="status" aria-live="polite" className="flex min-w-[180px] flex-col gap-[6px]">
                  <span className="font-mono text-[13px] text-accent">
                    Checking… step {stepNum} of {FIT_TOOLS.length}
                  </span>
                  <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-accent-tint">
                    <span
                      data-progress
                      className="block h-1 rounded-full bg-accent"
                      style={{ width: `${Math.round((stepNum / FIT_TOOLS.length) * 100)}%` }}
                    />
                  </span>
                </div>
              ) : (
                <button type="button" onClick={reset} className={resetButton}>
                  {drill ? "Back to the fit check" : "Try another role"}
                </button>
              )}
            </div>
          )}

          {showSteps && (
            <div
              ref={phase === "running" ? setFocusTarget : undefined}
              data-focus-handoff=""
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="flex flex-col gap-3 rounded-[14px] border border-rule bg-paper px-[22px] py-5 outline-none max-[640px]:p-4"
            >
              <p className={`${statusLabel} max-[640px]:mb-1`}>
                {phase === "running" ? "Agent · streaming from the live run" : `Agent · done · ${steps.length} steps from the live run`}
              </p>
              {/* Phone: a vertical stepper (Hero.dc.html compact, design update 9). Desktop keeps one-line rows. */}
              <ol className="m-0 hidden list-none flex-col p-0 max-[640px]:flex">
                {steps.map((st, i) => {
                  const done = st.status !== "running";
                  const skipped = st.status === "skipped";
                  const last = i === steps.length - 1;
                  const dot = skipped
                    ? "border border-dashed border-rule bg-paper text-muted"
                    : done
                      ? "border border-solid border-accent bg-accent-tint text-accent"
                      : "border-[1.5px] border-solid border-accent bg-paper text-accent";
                  return (
                    <li key={st.tool} className="flex items-start gap-3">
                      <span className="flex flex-[0_0_auto] flex-col items-center self-stretch">
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full font-mono text-[11px] leading-none ${dot}`}
                        >
                          {skipped ? "–" : done ? "✓" : "•"}
                        </span>
                        <span className={`block w-px flex-1 ${last ? "min-h-0 bg-transparent" : "min-h-[10px] bg-rule"}`} />
                      </span>
                      <span className={`flex min-w-0 flex-col gap-[2px] pt-px ${last ? "pb-0" : "pb-3"}`}>
                        <span className={`text-[15px] leading-[1.4] ${skipped ? "text-muted" : "text-ink"}`}>{STEP_COPY[st.tool]}</span>
                        <span className="font-mono text-[12px] leading-[1.5] text-muted [overflow-wrap:anywhere]">
                          {st.tool} ·{" "}
                          <span className={skipped ? "text-muted" : "text-accent"}>
                            {skipped ? SKIPPED_FETCH_STATUS : done ? (st.detail ?? "") : "running…"}
                          </span>
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              {steps.map((st) => {
                const done = st.status !== "running";
                const skipped = st.status === "skipped";
                const label = st.tool === "fetch_url" && !linkRun ? SKIPPED_FETCH : STEP_COPY[st.tool];
                const statusColor = done && !skipped ? "text-accent" : "text-muted";
                return (
                  <div key={st.tool} className="flex flex-wrap justify-between gap-4 font-mono text-[14px] leading-[1.5] max-[640px]:hidden">
                    <span className={skipped ? "text-muted" : "text-ink"}>
                      <span className={statusColor}>{skipped ? "–" : done ? "✓" : "›"} </span>
                      {st.tool} · {label}
                    </span>
                    <span className={statusColor}>{done ? (st.detail ?? "") : "running…"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {xray && isResult && <RunXray ref={runXrayRef} result={result} meta={buildMeta} />}

          {isResult && (
            <Result
              result={result}
              bad={phase === "badfit"}
              onAskGap={(i) => openAsk({ focus: i })}
              onAsk={() => openAsk()}
              onTalk={talk}
              headingRef={setFocusTarget}
            />
          )}

          {showFallback && (
            <Fallback
              event={fallback}
              xray={xray}
              onRetry={() => run(jd, role)}
              onPaste={reset}
              onTalk={talk}
              headingRef={setFocusTarget}
            />
          )}

          {xray && (
            <BreakPanel
              log={log}
              running={breakRunning}
              error={breakError}
              onAttack={attack}
              onDrill={(d) => run(HERO_SAMPLES[0].jd, HERO_SAMPLES[0].role, d)}
            />
          )}

          {!xray && nudge && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[10px] border border-dashed border-accent bg-accent-tint px-[14px] py-[10px]">
              <span className="text-[15px]">{nudge}</span>
              <button
                type="button"
                onClick={() => {
                  scrollToRun.current = isResult;
                  setXray(true);
                }}
                className="min-h-10 cursor-pointer rounded-lg border border-accent bg-transparent px-3 py-[6px] font-mono text-[13px] text-accent"
              >
                Turn on X-ray →
              </button>
            </div>
          )}

          <HowBuilt meta={meta} />
        </section>
      </div>
    </section>
  );
}
