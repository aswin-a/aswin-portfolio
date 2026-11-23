"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSite } from "@/components/xray-provider";
import type { CvGroup, CvTopic } from "@/content/cv";
import { ASK_MAX_CHARS } from "@/lib/ask/types";
import { cvGeneral } from "@/lib/cv";

/** "Copy as plain text": copies `cvPlainText()` and shows "Copied ✓" for 2 s (About.dc.html). */
export function CopyCv({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-12 cursor-pointer rounded-[10px] border border-rule bg-paper px-[18px] py-[10px] font-sans text-[15px] text-ink"
    >
      {copied ? "Copied ✓" : "Copy as plain text"}
    </button>
  );
}

/** The Ask box's own question and its 3 chips: open Ask on the general topic and ask straight away. */
export function CvAskBox() {
  const { openAsk } = useSite();
  const [q, setQ] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = q.trim();
    setQ("");
    openAsk({ topic: cvGeneral, autoAsk: question });
  };
  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-[10px] rounded-[10px] border border-rule bg-paper py-[6px] pr-[6px] pl-[14px]"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={ASK_MAX_CHARS}
          aria-label="Ask your own question about Aswin's experience"
          placeholder="Ask your own question, e.g. has he worked with healthcare data?"
          className="min-h-10 min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] text-ink outline-none"
        />
        <span className="font-mono text-[12px] text-muted">⌘K</span>
        <button
          type="submit"
          className="min-h-10 cursor-pointer rounded-[8px] border-0 bg-btn-bg px-4 py-[6px] font-sans text-[14px] font-semibold text-btn-ink"
        >
          Ask
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] text-muted">Or try one:</span>
        {cvGeneral.qa.map(({ q: question }) => (
          <button
            key={question}
            type="button"
            onClick={() => openAsk({ topic: cvGeneral, autoAsk: question })}
            className="min-h-10 cursor-pointer rounded-full border border-accent bg-paper px-3 py-[6px] font-sans text-[14px] text-ink"
          >
            {question}
          </button>
        ))}
      </div>
    </>
  );
}

/** "Ask about this role →": opens Ask on the role's topic. */
export function AskAboutRole({ topic }: { topic: CvTopic }) {
  const { openAsk } = useSite();
  return (
    <button
      type="button"
      onClick={() => openAsk({ topic })}
      className="min-h-10 cursor-pointer border-0 bg-transparent px-0 py-1 font-mono text-[13px] text-accent"
    >
      Ask about this role →
    </button>
  );
}

/** Zelthy's area cards: each opens on its own and then spans the full row. */
export function CvGroups({ groups }: { groups: CvGroup[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="flex flex-col gap-[10px] pt-[6px]">
      <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">Pick an area to see everything I did</span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[10px]">
        {groups.map((g, i) => {
          const isOpen = !!open[i];
          return (
            <div
              key={g.name}
              className={`flex flex-col rounded-[10px] border bg-bg ${isOpen ? "col-[1/-1] border-accent" : "border-rule"}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                className="flex w-full cursor-pointer items-start justify-between gap-3 border-0 bg-transparent px-4 py-[14px] text-left font-sans text-ink"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">{g.name}</span>
                  <span className="text-[14px] leading-[1.5] text-muted">{g.summary}</span>
                  <span className="font-mono text-[12px] text-accent">
                    {isOpen ? `Hide ${g.items.length} points ↑` : `See all ${g.items.length} points ↓`}
                  </span>
                </span>
                <span aria-hidden="true" className="font-mono text-[16px] leading-[1.2] text-muted">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <ul className="m-0 flex list-disc flex-col gap-[6px] pt-0 pr-4 pb-4 pl-9 text-[14px] leading-[1.55]">
                  {g.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
