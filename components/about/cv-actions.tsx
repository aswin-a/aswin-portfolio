"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSite } from "@/components/xray-provider";
import type { CvTopic } from "@/content/cv";
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
