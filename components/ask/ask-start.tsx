import { AskLink } from "@/components/ask/ask-link";
import { XrayPanel } from "@/components/xray-panel";
import {
  ASK_ATTACKS,
  ASK_BY_PAGE,
  ASK_JUMP_TO,
  ASK_QUESTIONS,
  CTX_QUESTION,
  gapQuestion,
  type AskPage,
} from "@/lib/ask/copy";
import type { SessionMemory } from "@/lib/ask/types";
import type { CvTopic } from "@/content/cv";

const LABEL = "m-0 font-mono text-[12px] tracking-[0.06em] text-muted uppercase";
const ROW =
  "-mx-[10px] flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[8px] border-0 bg-transparent px-[10px] py-2 text-left font-sans text-ink";
const HINT = "font-mono text-[12px] text-muted";

/** Ask.dc.html before a question is asked: topic, session memory, suggestions, Break my AI, Jump to. */
export function AskStart({
  page,
  topic,
  memory,
  onAsk,
  onForget,
  onNavigate,
}: {
  page: AskPage;
  /** Topic mode (design update 6): its questions are suggested prompts, sent to the live endpoint. */
  topic?: CvTopic;
  memory: SessionMemory | null;
  onAsk: (question: string) => void;
  onForget: () => void;
  onNavigate: () => void;
}) {
  const ctxQuestions = memory ? [...memory.gaps.map((g) => gapQuestion(g.req)), CTX_QUESTION] : [];

  return (
    <div className="flex flex-col gap-[18px] px-[18px] pt-4 pb-5">
      {topic && (
        <div className="flex flex-col gap-[10px] rounded-[10px] border border-accent bg-accent-tint px-4 py-[14px]">
          <span className="font-mono text-[12px] tracking-[0.06em] text-accent">ASKING ABOUT · {topic.label}</span>
          <div className="flex flex-col gap-[2px]">
            {topic.qa.map(({ q }) => (
              <button key={q} type="button" onClick={() => onAsk(q)} className={`${ROW} text-[15px]`}>
                {q}
                <span className={HINT}>ask ↵</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {memory && (
        <div className="flex flex-col gap-[10px] rounded-[10px] border border-accent bg-accent-tint px-4 py-[14px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[12px] tracking-[0.06em] text-accent">
              CONTINUING FROM YOUR FIT CHECK · SESSION MEMORY
            </span>
            <button
              type="button"
              onClick={onForget}
              className="min-h-9 cursor-pointer rounded-[6px] border border-accent bg-transparent px-[10px] py-1 font-mono text-[12px] text-accent"
            >
              Forget this
            </button>
          </div>
          <p className="m-0 text-[16px]">
            <b className="font-semibold">{memory.role}</b> · {memory.matchCount} matches · {memory.gaps.length} gaps
          </p>
          <p className="m-0 font-mono text-[12px] text-muted">
            Held for this session only. Pasted job descriptions are not stored.
          </p>
          <div className="flex flex-col gap-[2px]">
            {ctxQuestions.map((q, i) => (
              <button key={i} type="button" onClick={() => onAsk(q)} className={`${ROW} text-[15px]`}>
                {q}
                <span className={HINT}>ask ↵</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-[6px]">
        <p className={LABEL}>Suggested for this page</p>
        {ASK_BY_PAGE[page].map((id) => (
          <button key={id} type="button" onClick={() => onAsk(ASK_QUESTIONS[id])} className={`${ROW} text-[16px]`}>
            {ASK_QUESTIONS[id]}
            <span className={HINT}>ask ↵</span>
          </button>
        ))}
      </div>
      {/* X-ray only, in an X-ray panel (design update 3). */}
      <div className="xray-only">
        <XrayPanel className="flex flex-col gap-2 rounded-[10px] px-[14px] py-3">
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.06em] text-xr-muted">Break my AI</p>
          <div className="flex flex-wrap gap-2">
            {ASK_ATTACKS.map(([id, chip]) => (
              <button
                key={id}
                type="button"
                onClick={() => onAsk(ASK_QUESTIONS[id])}
                className="min-h-10 cursor-pointer rounded-[8px] border border-xr-rule bg-transparent px-3 py-[6px] font-mono text-[13px] text-xr-ink"
              >
                {chip}
              </button>
            ))}
          </div>
        </XrayPanel>
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className={LABEL}>Jump to</p>
        <div className="flex flex-wrap gap-2">
          {ASK_JUMP_TO.map((j) => (
            <AskLink
              key={j.href}
              href={j.href}
              onNavigate={onNavigate}
              className="inline-flex min-h-10 items-center rounded-[8px] border border-rule px-3 py-[6px] text-[14px] text-ink no-underline"
            >
              {j.label}
            </AskLink>
          ))}
        </div>
      </div>
    </div>
  );
}
