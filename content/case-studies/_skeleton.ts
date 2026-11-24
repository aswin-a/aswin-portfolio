import { todo } from "@/lib/content";
import type { CaseStudy } from "@/lib/schemas/content";

type CardFields = Pick<
  CaseStudy,
  "slug" | "num" | "status" | "cardTitle" | "built"
>;

type Decision = NonNullable<CaseStudy["decisions"]>[number];
type Safeguard = NonNullable<CaseStudy["safeguards"]>[number];
type BeforeAfter = NonNullable<CaseStudy["beforeAfter"]>;
type FactLabel = "CONTEXT" | "BUILT WITH" | "FOCUS" | "TIME SPENT" | "LAST UPDATED";
type MetricKind = "NORTH STAR" | "GUARDRAIL" | "ADOPTION";

/**
 * Aswin's answers for one study, field by field. Anything left out stays a todo() placeholder.
 * `decisions` and `safeguards` are by position (1–3 and 1–4); a missing entry or part stays a placeholder.
 */
export type SkeletonFill = {
  lede?: string;
  facts?: Partial<Record<FactLabel, string>>;
  demo?: string;
  problem?: Partial<NonNullable<CaseStudy["problem"]>>;
  decisions?: (Partial<Decision> | undefined)[];
  builtMyself?: string;
  usedOrReused?: string;
  safeguards?: (Partial<Safeguard> | undefined)[];
  metrics?: Partial<Record<MetricKind, string>>;
  beforeAfter?: Partial<Omit<BeforeAfter, "agentTitle">>;
  v2?: string;
  learned?: string;
  repo?: string;
};

/**
 * The PRD template fields SPEC §12 asks for, for the studies the design doesn't spell out.
 * Every field not in `fill` is TODO(aswin). Architecture, "Try to break it", Performance and
 * Questions stay off until Aswin adds them.
 */
export function skeleton(card: CardFields, fill: SkeletonFill = {}): CaseStudy {
  const f = fill;
  return {
    ...card,
    breadcrumb: `${card.num} · ${card.cardTitle.toUpperCase()}`,
    title: card.cardTitle,
    lede: f.lede ?? todo("[One-line lede]"), // TODO(aswin)
    facts: [
      { label: "CONTEXT", value: f.facts?.CONTEXT ?? todo("[context]") }, // TODO(aswin)
      { label: "BUILT WITH", value: f.facts?.["BUILT WITH"] ?? todo("[tools]") }, // TODO(aswin)
      { label: "FOCUS", value: f.facts?.FOCUS ?? todo("[focus]") }, // TODO(aswin)
      { label: "TIME SPENT", value: f.facts?.["TIME SPENT"] ?? todo("[hours]") }, // TODO(aswin)
      { label: "LAST UPDATED", value: f.facts?.["LAST UPDATED"] ?? todo("[date]") }, // TODO(aswin)
    ],
    demo: f.demo ?? todo("[walkthrough video or recorded run]"), // TODO(aswin)
    problem: {
      who: f.problem?.who ?? todo("[Primary user, in one line]"), // TODO(aswin)
      problem: f.problem?.problem ?? todo("[What is slow or risky today, in two sentences]"), // TODO(aswin)
      whyAi: f.problem?.whyAi ?? todo("[What AI changes here, and what it must not be trusted with]"), // TODO(aswin)
    },
    decisions: [0, 1, 2].map((i) => {
      const d = f.decisions?.[i];
      return {
        topic: d?.topic ?? todo("[Decision]"), // TODO(aswin)
        chose: d?.chose ?? todo("[option]"),
        over: d?.over ?? todo("[alternative]"),
        because: d?.because ?? todo("[the cost you accepted]"),
      };
    }),
    builtMyself: f.builtMyself ?? todo("[What you built yourself]"), // TODO(aswin)
    usedOrReused: f.usedOrReused ?? todo("[Tools, models and parts you didn't build yourself]"), // TODO(aswin)
    safeguards: [0, 1, 2, 3].map((i) => {
      const s = f.safeguards?.[i];
      return {
        title: s?.title ?? todo("[Safeguard]"), // TODO(aswin)
        stops: s?.stops ?? todo("[the failure it prevents]"),
        userSees: s?.userSees ?? todo("[the UI when it fires]"),
      };
    }),
    metrics: [
      { kind: "NORTH STAR", hint: f.metrics?.["NORTH STAR"] ?? todo("[North-star metric]") }, // TODO(aswin)
      { kind: "GUARDRAIL", hint: f.metrics?.GUARDRAIL ?? todo("[Guardrail metric]") },
      { kind: "ADOPTION", hint: f.metrics?.ADOPTION ?? todo("[Adoption metric]") },
    ],
    beforeAfter: {
      agentTitle: "WITH THE AGENT",
      manual: f.beforeAfter?.manual ?? [{ text: todo("[Manual step]"), time: todo("[time]") }], // TODO(aswin)
      agent: f.beforeAfter?.agent ?? [{ text: todo("[Agent step]"), time: todo("[time]") }], // TODO(aswin)
      manualTotal: f.beforeAfter?.manualTotal ?? todo("[measured]"),
      agentTotal: f.beforeAfter?.agentTotal ?? todo("[measured]"),
    },
    v2: f.v2 ?? todo("[What you'd build next, and why it waited]"), // TODO(aswin)
    learned: f.learned ?? todo("[One thing that surprised you, in your words]"), // TODO(aswin)
    repo: f.repo ?? todo("[repo link]"), // TODO(aswin)
  };
}
