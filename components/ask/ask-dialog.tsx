"use client";

import { track } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AskAnswerView } from "@/components/ask/ask-answer";
import { AskStart } from "@/components/ask/ask-start";
import { AskThinking } from "@/components/ask/ask-thinking";
import { ask } from "@/lib/ask/client";
import { ASK_LOADING, ASK_PLACEHOLDER, ASK_SUBMIT, ASK_THINKING, askPageFor, CTX_QUESTION, gapQuestion } from "@/lib/ask/copy";
import { sessionMemory } from "@/lib/ask/session-memory";
import { ASK_MAX_CHARS, type AskResult, type AskStepEvent } from "@/lib/ask/types";
import { cvGeneral } from "@/lib/cv";
import type { CvTopic } from "@/content/cv";

/** Which session-memory question to open on: a gap index, or "q" for "What should I ask him…". */
export type AskFocus = number | "q";

/**
 * How Ask opens. `topic` shows "ASKING ABOUT · {label}" with its suggested questions, and
 * `autoAsk` is asked as soon as Ask opens (Ask.dc.html topic mode, design update 6). On the CV
 * page Ask opens on the general topic unless another is given.
 */
export type AskOpenOptions = { focus?: AskFocus; topic?: CvTopic; autoAsk?: string };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** A question in flight (`result` null: the thinking state) or answered. `steps` are the run's real step events. */
type Asked = { question: string; steps: AskStepEvent[]; result: AskResult | null };

/** "Ask my work" command bar (Ask.dc.html); a bottom sheet at ≤ 640 px (MobileAsk.dc.html), via the [@media(max-width:640px)] classes. */
export function AskDialog({ focus, topic: givenTopic, autoAsk, onClose }: AskOpenOptions & { onClose: () => void }) {
  const page = askPageFor(usePathname());
  const topic = givenTopic ?? (page === "about" ? cvGeneral : undefined);
  const memory = useSyncExternalStore(sessionMemory.subscribe, sessionMemory.get, () => null);
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<Asked | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const submitQuestion = useCallback((question: string) => {
    const id = ++requestId.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setAsked({ question, steps: [], result: null });
    setQuery("");
    // Ignore events for a question that was replaced, or a dialog that closed.
    const current = () => id === requestId.current;
    const onStep = (ev: AskStepEvent) => {
      if (!current()) return;
      setAsked((prev) => {
        if (!prev || prev.result) return prev;
        const i = prev.steps.findIndex((s) => s.tool === ev.tool);
        return { ...prev, steps: i === -1 ? [...prev.steps, ev] : prev.steps.map((s, j) => (j === i ? ev : s)) };
      });
    };
    track("ask_question_sent", {});
    ask({ question, memory: sessionMemory.get() }, onStep, ac.signal)
      .catch((): AskResult => ({ status: "error" }))
      .then((result) => {
        if (current()) setAsked((prev) => (prev ? { ...prev, result } : prev));
      });
  }, []);

  const thinking = asked !== null && asked.result === null;

  // The input is disabled while thinking, so focus moves to the thinking block, then back to the input.
  const wasThinking = useRef(false);
  useEffect(() => {
    if (thinking) thinkingRef.current?.focus({ preventScroll: true });
    else if (wasThinking.current) inputRef.current?.focus({ preventScroll: true });
    wasThinking.current = thinking;
  }, [thinking]);

  // Modal: the rest of the page is inert and doesn't scroll; focus returns to the trigger on close.
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = dialogRef.current?.closest("[data-ask-root]");
    const made: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el !== root && !el.hasAttribute("inert")) {
        el.setAttribute("inert", "");
        made.push(el);
      }
    }
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    inputRef.current?.focus();
    const ids = requestId;
    const abort = abortRef;
    return () => {
      ids.current++;
      abort.current?.abort();
      made.forEach((el) => el.removeAttribute("inert"));
      html.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  // Opened on a session-memory question (the hero's gap cards, Milestone 4).
  useEffect(() => {
    if (focus === undefined) return;
    const m = sessionMemory.get();
    if (!m) return;
    const q = focus === "q" ? CTX_QUESTION : m.gaps[focus] && gapQuestion(m.gaps[focus].req);
    // Starts a request, which sets state when it resolves; runs once on open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) submitQuestion(q);
  }, [focus, submitQuestion]);

  // Opened with a question to ask straight away (the CV page). It goes to the live endpoint like any other.
  useEffect(() => {
    const q = autoAsk?.trim().slice(0, ASK_MAX_CHARS);
    // Starts a request, which sets state when it resolves; runs once on open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) submitQuestion(q);
  }, [autoAsk, submitQuestion]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || thinking) return;
    submitQuestion(q);
  };

  const again = () => {
    requestId.current++;
    abortRef.current?.abort();
    setAsked(null);
    inputRef.current?.focus();
  };

  const forget = () => {
    sessionMemory.clear();
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      data-ask-root=""
      onKeyDown={onKeyDown}
      // The scrim doesn't close the dialog (only Esc and ✕ do); keep focus where it was.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className={"fixed inset-0 z-50 box-border flex items-start justify-center overflow-y-auto bg-scrim px-5 pt-[10vh] pb-5 font-sans text-ink [@media(max-width:640px)]:px-0 [@media(max-width:640px)]:pt-0 [@media(max-width:640px)]:pb-0"}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ask my work"
        className={"box-border flex w-full max-w-[680px] flex-col overflow-hidden rounded-[14px] border border-rule bg-paper shadow-ask [@media(max-width:640px)]:mt-auto [@media(max-width:640px)]:max-w-full [@media(max-width:640px)]:rounded-[18px_18px_0_0]"}
      >
        <form onSubmit={onSubmit} className="flex items-center gap-[10px] border-b border-rule px-[14px] py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={thinking}
            aria-busy={thinking}
            maxLength={ASK_MAX_CHARS}
            aria-label="Ask a question about Aswin's work"
            placeholder={thinking ? ASK_LOADING : ASK_PLACEHOLDER}
            className="min-h-11 min-w-0 flex-1 border-0 bg-transparent font-sans text-[17px] text-ink outline-none"
            style={{ opacity: thinking ? 0.5 : 1 }}
          />
          <button
            type="submit"
            disabled={thinking}
            className="min-h-10 cursor-pointer rounded-[8px] border-0 bg-btn-bg px-[14px] py-[6px] font-sans text-[14px] font-semibold text-btn-ink disabled:cursor-default"
            style={{ opacity: thinking ? 0.5 : 1 }}
          >
            {thinking ? ASK_THINKING : ASK_SUBMIT}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </form>
        {asked?.result ? (
          <AskAnswerView question={asked.question} result={asked.result} onAgain={again} onNavigate={onClose} />
        ) : asked ? (
          <AskThinking question={asked.question} steps={asked.steps} focusRef={thinkingRef} />
        ) : (
          <AskStart page={page} topic={topic} memory={memory} onAsk={submitQuestion} onForget={forget} onNavigate={onClose} />
        )}
      </div>
    </div>,
    document.body,
  );
}
