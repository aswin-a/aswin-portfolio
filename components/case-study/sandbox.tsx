"use client";

import { useRef, useState, type FormEvent } from "react";
import { SandboxReplySchema, type SandboxReply } from "@/lib/ai/sandbox-reply";
import { postRun } from "@/lib/run-client";

type Attack = { type: string; text: string };
type Entry = { id: number; text: string } & SandboxReply;
type Status = "idle" | "running" | "error" | "limited" | "budget";

/** Work.dc.html keeps the newest 8 attempts. */
const LOG_MAX = 8;

// Approved in M5 planning: the sandbox's states, which the design doesn't show.
const STATE_LINE: Record<Exclude<Status, "idle">, string> = {
  running: "Running against the builder…",
  error: "The builder couldn't answer this time. Try again.",
  limited: "That's the limit for attempts this hour. Aswin is one message away.",
  budget: "Live attempts are paused for this month.",
};

/** pillFor() in Work.dc.html. */
function pillClass(verdict: SandboxReply["verdict"]): string {
  if (verdict === "BLOCKED") return "border border-solid border-accent bg-accent-tint text-accent";
  if (verdict === "FLAGGED") return "border-[1.5px] border-dashed border-amber-border bg-amber-bg text-amber-text";
  return "border border-solid border-rule bg-transparent text-ink";
}

/**
 * "Try to break it" (Work.dc.html). Presets and free text run against /api/run mode "sandbox"
 * (SPEC §8). A failed or limited attempt isn't added to the log or the counter.
 */
export function Sandbox({ attacks, evalSet }: { attacks: Attack[]; evalSet: { href: string; label: string } }) {
  const [text, setText] = useState("");
  const [log, setLog] = useState<Entry[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const nextId = useRef(0);

  const stopped = log.filter((l) => l.verdict !== "DRAFTED").length;

  async function run(attempt: string) {
    const t = attempt.trim();
    if (!t || status === "running") return;
    setStatus("running");
    try {
      const res = await postRun({ mode: "sandbox", attempt: t });
      const data = res.ok ? ((await res.json()) as { status: string; reply?: unknown }) : { status: "error" };
      if (data.status === "limited" || data.status === "budget") return setStatus(data.status);
      const reply = SandboxReplySchema.safeParse(data.reply);
      if (data.status !== "ok" || !reply.success) return setStatus("error");
      setLog((prev) => [{ id: ++nextId.current, text: t, ...reply.data }, ...prev].slice(0, LOG_MAX));
      setText("");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(text);
  };
  const busy = status === "running";

  return (
    <section id="s-break" aria-labelledby="h-break" className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="h-break" className="m-0 font-serif text-[34px] font-normal">
            Try to break it
          </h2>
          <p className="m-0 text-[16px] text-muted">The same attack types as Break my AI on the home page. Pick one or write your own.</p>
        </div>
        <div role="status" aria-live="polite" className="flex items-baseline gap-2 font-mono">
          {log.length === 0 ? (
            <span className="text-[14px] text-muted">No attempts yet</span>
          ) : (
            <>
              <span className="text-[40px] text-accent">{stopped}</span>
              <span className="text-[14px] text-muted">held up of {log.length}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[14px] rounded-[14px] border border-rule bg-paper p-5">
        <div className="flex flex-wrap gap-2">
          {attacks.map((k) => (
            <button
              key={k.text}
              type="button"
              disabled={busy}
              onClick={() => void run(k.text)}
              className="flex min-h-11 cursor-pointer flex-col items-start gap-[2px] rounded-lg border border-rule bg-bg px-3 py-2 text-left font-mono text-[13px] text-ink"
            >
              <span className="text-[11px] text-muted">{k.type}</span>
              {k.text}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex flex-wrap gap-[10px]">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            aria-label="Your own attempt"
            placeholder="Or write your own instruction to the builder…"
            className="min-h-11 flex-[1_1_280px] rounded-lg border border-rule bg-bg px-3 py-2 font-mono text-[14px] text-ink"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 cursor-pointer rounded-lg border-0 bg-btn-bg px-[18px] py-2 font-sans text-[15px] font-semibold text-btn-ink"
          >
            Run
          </button>
        </form>
        {status !== "idle" && (
          <p role={busy ? "status" : "alert"} className="m-0 font-mono text-[13px] text-muted">
            {STATE_LINE[status]}
          </p>
        )}
        {log.length === 0 && <p className="m-0 border-t border-rule pt-[14px] pb-[2px] font-mono text-[13px] text-muted">No attempts yet.</p>}
        {log.map((l) => (
          <div key={l.id} className="flex flex-wrap items-start gap-3 border-t border-rule pt-3 pb-[2px] font-mono text-[13px] leading-[1.5]">
            <span className={`flex-[0_0_auto] rounded-md px-2 py-[2px] ${pillClass(l.verdict)}`}>{l.verdict}</span>
            <span className="flex flex-[1_1_300px] flex-col gap-[2px]">
              <span>“{l.text}”</span>
              <span className="text-muted">{l.reason}</span>
              {/* X-ray only: a small dark chip (design update 3). */}
              <span className="xray-only mt-1 self-start rounded-md bg-xr-bg px-2 py-[3px] text-xr-muted">
                guardrail fired: {l.guard} · trace {l.trace?.runId ?? "[run id]"} · {l.trace ? `${l.trace.ms} ms` : "[ms]"}
              </span>
            </span>
          </div>
        ))}
        <a
          href={evalSet.href}
          className="inline-flex min-h-10 items-center self-start border-t border-rule pt-[6px] font-mono text-[12px] text-accent"
        >
          {evalSet.label} →
        </a>
      </div>
    </section>
  );
}
