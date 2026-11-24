import { AskLink } from "@/components/ask/ask-link";
import { isHiddenStudyHref } from "@/lib/case-study-visibility";
import { XrayPill } from "@/components/xray-panel";
import { ASK_BUDGET, ASK_ERROR, ASK_LABELS, ASK_LIMITED, CONTACT_SOURCE } from "@/lib/ask/copy";
import type { AskAnswer, AskResult, AskSource } from "@/lib/ask/types";

const CARD_TONE = {
  plain: "border border-solid border-rule bg-bg",
  amber: "border-[1.5px] border-dashed border-amber-border bg-amber-bg",
  accent: "border border-solid border-accent bg-accent-tint",
} as const;
const LABEL_TONE = { amber: "text-amber-text", accent: "text-accent", muted: "text-muted" } as const;

type Card = { tone: keyof typeof CARD_TONE; label?: [string, keyof typeof LABEL_TONE]; text: string; todo?: string; sources: AskSource[] };

function cardFor(result: AskResult): Card {
  if (result.status === "error") return { tone: "plain", text: ASK_ERROR, sources: [CONTACT_SOURCE] };
  if (result.status === "limited") return { tone: "plain", text: ASK_LIMITED, sources: [CONTACT_SOURCE] };
  if (result.status === "budget") return { tone: "plain", text: ASK_BUDGET, sources: [CONTACT_SOURCE] };
  const a = result.answer;
  const label = ASK_LABELS[a.kind];
  const tone = label?.[1] === "amber" ? "amber" : label?.[1] === "accent" ? "accent" : "plain";
  return { tone, label, text: a.text, todo: a.todo, sources: a.sources };
}

/** The X-ray line. Live numbers only come from a real run; until then the design's placeholders show. "1 source" is singular (Aswin, 2026-11-20). */
function traceLine(a: AskAnswer): string {
  const live = a.trace
    ? `trace ${a.trace.runId} · live usage: cost $${a.trace.costUsd.toFixed(4)} · ${a.trace.ms} ms`
    : "trace [run id] · live usage: cost [logged] · [logged] ms";
  return `kb.search → ${a.sources.length} ${a.sources.length === 1 ? "source" : "sources"} · guardrail fired: ${a.guard} · ${live}`;
}

/** Ask.dc.html after a question: the "›" line, the answer card, sources, X-ray trace, "← Ask another". */
export function AskAnswerView({
  question,
  result,
  onAgain,
  onNavigate,
}: {
  question: string;
  result: AskResult;
  onAgain: () => void;
  onNavigate: () => void;
}) {
  const card = cardFor(result);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-[14px] px-[18px] pt-4 pb-5">
      <p className="m-0 font-mono text-[13px] text-muted">› {question}</p>
      <div className={`flex flex-col gap-2 rounded-[10px] p-4 ${CARD_TONE[card.tone]}`}>
        {card.label && (
          <p className={`m-0 font-mono text-[12px] tracking-[0.06em] ${LABEL_TONE[card.label[1]]}`}>
            {card.label[0]}
          </p>
        )}
        <p className="m-0 text-[17px] leading-[1.55]">{card.text}</p>
        {card.todo && (
          <p className="m-0 rounded-[6px] border border-dotted border-muted px-2 py-[6px] font-mono text-[13px] text-muted">
            {card.todo}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {card.sources.map((s) =>
          isHiddenStudyHref(s.href) ? (
            <span key={s.label} className="rounded-[6px] bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-muted">
              {s.label}
            </span>
          ) : (
          <AskLink
            key={s.label}
            href={s.href}
            onNavigate={onNavigate}
            className="rounded-[6px] bg-accent-tint px-[10px] py-[6px] font-mono text-[12px] text-accent no-underline"
          >
            {s.label} →
          </AskLink>
          ),
        )}
      </div>
      {result.status === "ok" && (
        <div className="xray-only">
          <div className="relative">
            <XrayPill />
            <p className="m-0 rounded-[8px] border border-xr-rule bg-xr-bg py-[10px] pr-[76px] pl-3 font-mono text-[12px] leading-[1.6] text-xr-muted">
              {traceLine(result.answer)}
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onAgain}
        className="min-h-11 cursor-pointer self-start border-0 bg-transparent px-0 py-2 font-mono text-[13px] text-accent"
      >
        ← Ask another
      </button>
    </div>
  );
}
