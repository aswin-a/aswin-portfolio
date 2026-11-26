import Link from "next/link";
import type { ReactNode } from "react";
import { BeforeAfterTabs } from "@/components/case-study/before-after-tabs";
import { XrayLinkButton } from "@/components/case-study/xray-link";
import { XrayPanel } from "@/components/xray-panel";
import { containsTodo, hrefOf, isTodo, withTodo } from "@/lib/content";
import type { CaseStudy, Post } from "@/lib/schemas/content";

const h2 = "m-0 font-serif text-[34px] font-normal";
const kicker = "font-mono text-[11px] tracking-[0.06em] text-muted";
const hintBase = "m-0 font-mono text-[13px] leading-[1.55] text-muted";
/**
 * The design's dotted box marks a placeholder. Filled text keeps the type but drops the box
 * (Aswin, 2026-11-24, as for the build-log summaries).
 */
const hintFor = (v: string, extra = "") =>
  `${hintBase} ${containsTodo(v) ? "rounded-lg border border-dotted border-muted px-3 py-[10px]" : ""} ${extra}`.trim();
const card = "flex flex-col gap-[10px] rounded-xl border border-rule bg-paper p-[18px]";

function Section({ id, title, children, className = "gap-[18px]" }: { id: string; title?: string; children: ReactNode; className?: string }) {
  return (
    <section id={`s-${id}`} aria-labelledby={`h-${id}`} className={`flex flex-col ${className}`}>
      {title && (
        <h2 id={`h-${id}`} className={h2}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/** Mono label over a mono muted value (decisions, safeguards). */
function Pair({ label, value, labelClass = "text-muted" }: { label: string; value: string; labelClass?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`font-mono text-[11px] ${labelClass}`}>{label}</span>
      <span className="font-mono text-[13px] text-muted">{value}</span>
    </div>
  );
}

/** The PRD template from Work.dc.html. Sections without data are left out; the rail follows. */
export function CaseStudyPage({ cs, next, related }: { cs: CaseStudy; next: CaseStudy; related?: Post }) {
  const rail: [string, string][] = [
    ...(cs.demo ? [["s-demo", "Demo"] as [string, string]] : []),
    ...(cs.problem ? [["s-problem", "Users & problem"] as [string, string]] : []),
    ...(cs.decisions ? [["s-decisions", "Decisions"] as [string, string]] : []),
    ...(cs.arch ? [["s-arch", "Architecture"] as [string, string]] : []),
    ...(cs.builtMyself ? [["s-built", "What I built"] as [string, string]] : []),
    ...(cs.safeguards ? [["s-safeguards", "Safeguards"] as [string, string]] : []),
    ...(cs.metrics ? [["s-measure", "Success"] as [string, string]] : []),
    ...(cs.perf ? [["s-perf", "Performance"] as [string, string]] : []),
    ...(cs.beforeAfter ? [["s-ba", "Before / after"] as [string, string]] : []),
    ...(cs.v2 || cs.learned ? [["s-lessons", "v2 & lessons"] as [string, string]] : []),
    ...(cs.questions ? [["s-questions", "Questions"] as [string, string]] : []),
    ["s-links", "Links"],
  ];

  return (
    <main className="cs-page mx-auto flex max-w-[1200px] flex-col gap-12 px-6 pt-14 pb-24">
      <header className="flex max-w-[880px] flex-col gap-5">
        <p className="m-0 font-mono text-[12px] tracking-[0.06em] text-muted">
          <Link href="/work" className="no-underline">
            CASE STUDIES
          </Link>{" "}
          / {cs.breadcrumb}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border-[1.5px] border-ink px-3 py-[6px] font-mono text-[12px] tracking-[0.06em]">
            STATUS · {cs.status}
          </span>
          {cs.disclaimer && (
            <span className="rounded-full border border-rule px-[10px] py-[6px] font-mono text-[12px] text-muted">{cs.disclaimer}</span>
          )}
        </div>
        <h1 className="m-0 font-serif text-[clamp(44px,6vw,72px)] font-normal leading-[1.02] tracking-[-0.02em]">{cs.title}</h1>
        <p className="m-0 font-serif text-[26px] leading-[1.35] text-muted">{cs.lede}</p>
        <p className="m-0 flex flex-wrap items-baseline gap-[10px] text-[17px]">
          <span className="font-mono text-[12px] tracking-[0.06em] text-muted">WHAT I BUILT</span>
          <span className={`font-mono text-[13px] text-muted ${containsTodo(cs.built) ? "rounded-md border border-dotted border-muted px-2 py-1" : ""}`}>{cs.built}</span>
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4 border-t border-rule pt-4">
          {cs.facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className={kicker}>{f.label}</span>
              <span className={isTodo(f.value) ? "font-mono text-[15px] text-muted" : "text-[15px]"}>{f.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-12">
        <nav aria-label="Case study sections" className="cs-rail flex max-w-[220px] flex-[1_1_200px] flex-col gap-[2px]">
          <p className="m-0 mb-2 font-mono text-[11px] tracking-[0.08em] text-muted">PRD</p>
          {rail.map(([href, label], i) => (
            <a
              key={href}
              href={`#${href}`}
              className="flex min-h-[34px] items-center gap-[10px] font-mono text-[13px] text-ink no-underline"
            >
              <span className="text-muted">{(i < 9 ? "0" : "") + (i + 1)}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[72px]">
          {cs.demo && (
            <Section id="demo" title="90-second demo" className="gap-[14px]">
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-[14px] rounded-[14px] bg-video-bg">
                <button
                  type="button"
                  aria-label="Play the demo"
                  className="inline-flex h-[72px] w-[72px] cursor-pointer items-center justify-center rounded-full border border-video-btn-border bg-video-btn"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" className="fill-video-icon" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <span className="font-mono text-[13px] text-video-caption">{cs.demo}</span>
              </div>
            </Section>
          )}

          {cs.problem && (
            <Section id="problem" title="Users and problem">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
                {(
                  [
                    ["WHO", cs.problem.who],
                    ["PROBLEM", cs.problem.problem],
                    ["WHY AI, WHY NOW", cs.problem.whyAi],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className={card}>
                    <span className={kicker}>{k}</span>
                    <p className={hintFor(v)}>{v}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cs.decisions && (
            <Section id="decisions" title="Key decisions and trade-offs">
              <div className="flex flex-col border-t border-rule">
                {cs.decisions.map((d, i) => (
                  <div key={i} className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-5 gap-y-3 border-b border-rule py-[18px]">
                    <Pair label={`DECISION 0${i + 1}`} value={d.topic} />
                    <Pair label="CHOSE" value={d.chose} labelClass="text-accent" />
                    <Pair label="OVER" value={d.over} />
                    <Pair label="BECAUSE" value={d.because} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cs.arch && (
            <Section id="arch">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="h-arch" className={h2}>
                  Architecture
                </h2>
                {cs.arch.note && <span className="font-mono text-[12px] text-amber-text">{cs.arch.note}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-rule bg-paper p-5 font-mono text-[13px]">
                {cs.arch.steps.map((a, i) => (
                  <span key={a.fn} className="contents">
                    <span className={`rounded-lg border bg-bg px-[10px] py-2 ${a.guard ? "border-accent" : "border-rule"}`}>{a.label}</span>
                    {i < cs.arch!.steps.length - 1 && <span className="text-muted">›</span>}
                  </span>
                ))}
              </div>
              <p className="m-0 text-[15px] text-muted">
                Boxes outlined in blue are where safeguards run.{cs.arch.caption && ` ${cs.arch.caption}`}
              </p>
              <div className="xray-only">
                <XrayPanel className="flex flex-col gap-[10px] rounded-[14px] p-5 font-mono text-[13px]">
                  <p className="m-0 text-xr-muted">LOGGED TRACE · {cs.arch.runId && `run ${cs.arch.runId} · `}real run, never a simulation</p>
                  {cs.arch.steps.map((a) => (
                    <div key={a.fn} className="flex justify-between gap-3 border-t border-xr-rule py-[6px]">
                      <span>
                        <span className="text-xr-accent">✓ </span>
                        {a.fn}
                      </span>
                      <span className="text-xr-muted">{a.ms}</span>
                    </div>
                  ))}
                </XrayPanel>
              </div>
            </Section>
          )}

          {cs.builtMyself && (
            <Section id="built" title="What I built">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
                <div className="flex flex-col gap-[10px] rounded-xl border-[1.5px] border-ink bg-paper p-[18px]">
                  <span className="font-mono text-[11px] tracking-[0.06em]">BUILT MYSELF</span>
                  <p className={hintFor(cs.builtMyself, "leading-[1.7]")}>{cs.builtMyself}</p>
                </div>
                {cs.usedOrReused && (
                  <div className={card}>
                    <span className={kicker}>USED OR REUSED</span>
                    <p className={hintFor(cs.usedOrReused, "leading-[1.7]")}>{cs.usedOrReused}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {cs.safeguards && (
            <section id="s-safeguards" aria-labelledby="h-safe" className="flex flex-col gap-[18px] rounded-[18px] bg-accent-tint p-8">
              <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-accent">THE CENTREPIECE</p>
              <h2 id="h-safe" className="m-0 font-serif text-[44px] font-normal leading-[1.1]">
                Safeguards
              </h2>
              <p className="m-0 max-w-[620px] font-serif text-[20px] leading-[1.45]">
                Each safeguard names what it stops and what the user sees when it fires.
              </p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
                {cs.safeguards.map((g, i) => (
                  <article key={i} className="flex flex-col gap-3 rounded-xl border border-rule bg-paper p-5">
                    <span className="font-mono text-[12px] text-accent">{`0${i + 1}`}</span>
                    {/* Placeholder vs real (design update 12 §1): real titles are sans 16px ink, no box. */}
                    <p className={containsTodo(g.title) ? hintFor(g.title) : "m-0 text-[16px] leading-[1.55] text-ink"}>{g.title}</p>
                    <Pair label="STOPS" value={g.stops} />
                    <Pair label="USER SEES" value={g.userSees} />
                  </article>
                ))}
              </div>
            </section>
          )}

          {cs.metrics && (
            <Section id="measure" title="How success is measured">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
                {cs.metrics.map((m) => (
                  <div key={m.kind} className={card}>
                    <span className={kicker}>{m.kind}</span>
                    <p className={hintFor(m.hint)}>{m.hint}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cs.perf && (
            <Section id="perf">
              <div className="flex flex-col gap-2">
                <h2 id="h-perf" className={h2}>
                  Performance
                </h2>
                <p className="m-0 text-[16px] text-muted">
                  Every number says where it comes from. Eval numbers and usage numbers are never combined.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
                {/* LIVE USAGE cards are hidden; only offline-eval cards remain (Work.dc.html, design update 12 §10; Aswin, 2026-11-26). */}
                {cs.perf.items.filter((p) => p.source !== "LIVE USAGE").map((p) => (
                  <div key={p.name} className={card}>
                    <span
                      className={`self-start rounded-full border px-2 py-[2px] font-mono text-[11px] tracking-[0.06em] ${
                        p.source === "OFFLINE EVAL" ? "border-accent text-accent" : "border-rule text-muted"
                      }`}
                    >
                      {p.source}
                    </span>
                    <span className="text-[15px] font-semibold">{p.name}</span>
                    <span className="font-mono text-[24px] text-muted">{p.value}</span>
                  </div>
                ))}
              </div>
              <div className="xray-only">
                <XrayPanel className="flex flex-col gap-3 rounded-[14px] p-5 font-mono text-[13px]">
                  <span className="text-xr-muted">OFFLINE EVAL SET · {cs.perf.evalCount} cases{cs.perf.redTeam !== false && " incl. red-team"}</span>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-[13px]">
                      <thead>
                        <tr>
                          <th scope="col" className="border-b border-xr-rule py-2 pr-[10px] text-left font-medium text-xr-muted">
                            eval case
                          </th>
                          <th scope="col" className="border-b border-xr-rule px-[10px] py-2 text-left font-medium text-xr-muted">
                            expected
                          </th>
                          <th scope="col" className="border-b border-xr-rule py-2 pl-[10px] text-left font-medium text-xr-muted">
                            result
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cs.perf.evals.map((e) => (
                          <tr key={e.case}>
                            <td className="border-b border-xr-rule py-2 pr-[10px]">{e.case}</td>
                            <td className="border-b border-xr-rule px-[10px] py-2">{e.expected}</td>
                            <td className="border-b border-xr-rule py-2 pl-[10px] text-xr-muted">{e.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-xr-muted">failed first: {cs.perf.failedFirst}</span>
                </XrayPanel>
              </div>
            </Section>
          )}

          {cs.beforeAfter && <BeforeAfterTabs data={cs.beforeAfter} />}

          {(cs.v2 || cs.learned) && (
            <Section id="lessons" title="v2 and lessons">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
                {(
                  [
                    ["IN V2", cs.v2],
                    ["WHAT I LEARNED", cs.learned],
                  ] as const
                ).map(
                  ([k, v]) =>
                    v && (
                      <div key={k} className="flex flex-col gap-[10px]">
                        <span className={kicker}>{k}</span>
                        <p className={hintFor(v, "leading-[1.7]")}>{v}</p>
                      </div>
                    ),
                )}
              </div>
            </Section>
          )}

          {cs.questions && (
            <section
              id="s-questions"
              aria-labelledby="h-questions"
              className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-dashed border-rule p-7"
            >
              <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted">FOR INTERVIEWERS</p>
              <h2 id="h-questions" className={h2}>
                Questions to ask me about this
              </h2>
              <ol className="m-0 flex list-decimal flex-col gap-[10px] pl-[22px] font-serif text-[20px] leading-[1.4]">
                {cs.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          <section id="s-links" aria-labelledby="h-links" className="flex flex-col gap-[14px]">
            <h2 id="h-links" className="m-0 font-mono text-[12px] font-medium tracking-[0.08em] text-muted">
              LINKS
            </h2>
            <div className="flex flex-wrap gap-[10px]">
              <a
                href={hrefOf(cs.repo)}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-rule bg-paper px-[14px] py-2 text-[15px] no-underline"
              >
                {withTodo("GitHub", cs.repo, " · ")}
              </a>
              {related && (
                <Link
                  href={`/log/${related.slug}`}
                  className="inline-flex min-h-11 items-center rounded-[10px] border border-rule bg-paper px-[14px] py-2 text-[15px] no-underline"
                >
                  Related post: {related.title}
                </Link>
              )}
              <XrayLinkButton />
            </div>
            <Link
              href={`/work/${next.slug}`}
              className="mt-6 flex items-center justify-between gap-4 rounded-[14px] border border-rule bg-paper p-6 no-underline"
            >
              <span className="flex flex-col gap-1">
                <span className="font-mono text-[12px] text-muted">
                  NEXT · {next.num} · {next.status}
                </span>
                <span className="font-serif text-[28px]">{next.cardTitle}</span>
              </span>
              <span className="font-mono text-[20px] text-accent">→</span>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
