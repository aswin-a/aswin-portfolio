import type { Metadata } from "next";
import Link from "next/link";
import { AskAboutRole, CopyCv, CvActions, CvAskBox } from "@/components/about/cv-actions";
import { CvCard, CvFocusProvider, CvGroups, CvHighlights } from "@/components/about/cv-focus";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Nav } from "@/components/nav";
import { cvHeader, cvItems, cvSkills, cvStats, type CvItem } from "@/content/cv";
import { cvPlainText, cvUpdatedLabel, projectKind, topicFor } from "@/lib/cv";
import { DESCRIPTIONS, pageMetadata, profilePageJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CV — Aswin A",
  description: DESCRIPTIONS.about,
  path: "/about",
  type: "profile",
});

/** Site routes go through next/link; "#" placeholders and other sites stay plain anchors. */
function CvLink({ href, children }: { href: string; children: string }) {
  const className = "inline-flex min-h-10 items-center font-mono text-[13px] text-accent no-underline";
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Lane styles from About.dc.html: roles solid, projects dashed and indented, education a paper dot. */
function lane(it: CvItem) {
  const project = it.lane === "project";
  const edu = it.lane === "edu";
  return {
    project,
    indent: project ? "pl-10 max-[640px]:pl-4" : "pl-0",
    title: project || edu ? "text-[17px]" : "text-[20px]",
    bg: project ? "bg-transparent" : "bg-paper",
    border: project ? "border-[1.5px] border-dashed border-rule" : "border border-solid border-rule",
    dot: project ? "bg-bg border-muted" : edu ? "bg-paper border-ink" : "bg-ink border-ink",
  };
}

export default function About() {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <JsonLd data={profilePageJsonLd("/about", true)} />
      <Nav current="about" />
      <main className="mx-auto flex max-w-[1040px] flex-col gap-14 px-6 pt-16 pb-24">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="m-0 font-mono text-[12px] tracking-[0.08em] text-muted">{cvHeader.eyebrow}</p>
            <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-5">
              <div className="flex max-w-[760px] flex-[1_1_480px] flex-col gap-2">
                <h1 className="m-0 font-serif text-h1 font-normal leading-[1.1] tracking-[-0.015em]">{cvHeader.name}</h1>
                <p className="m-0 text-[18px] font-medium">{cvHeader.role}</p>
                <p className="m-0 text-[15px] text-muted">
                  {cvHeader.location}
                  {cvHeader.links.map((l) => (
                    <span key={l.href}>
                      {" · "}
                      <a href={l.href} className="text-accent">
                        {l.label}
                      </a>
                    </span>
                  ))}
                </p>
                <p className="mt-2 mb-0 max-w-[760px] font-serif text-[21px] leading-[1.5]">{cvHeader.summary}</p>
              </div>
              <div className="flex w-[260px] max-w-full flex-col items-stretch gap-[10px]">
                <a
                  href={cvHeader.downloadPdf.href}
                  download
                  className="flex min-h-12 items-center justify-center rounded-[10px] bg-btn-bg px-[18px] py-[10px] text-[15px] font-semibold text-btn-ink no-underline"
                >
                  {cvHeader.downloadPdf.label}
                </a>
                <CopyCv text={cvPlainText()} />
                <span className="text-center font-mono text-[12px] text-muted">
                  {cvHeader.synced.label} · {cvUpdatedLabel()}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {cvStats.map(([big, small]) => (
              <div key={big} className="flex flex-col gap-1 rounded-[12px] border border-rule bg-paper px-[18px] py-4">
                <span className="font-serif text-[26px] leading-[1.15]">{big}</span>
                <span className="text-[14px] leading-[1.4] text-muted">{small}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-[14px] rounded-[12px] border border-accent bg-accent-tint px-[22px] py-5">
            <div className="flex flex-col gap-1">
              <span className="text-[17px] font-semibold">Questions about my experience?</span>
              <span className="text-[14px] text-muted">Ask my work answers from this CV, with sources.</span>
            </div>
            <CvAskBox />
          </div>
        </header>

        <section aria-labelledby="exp-h" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h2 id="exp-h" className="m-0 font-serif text-[36px] font-normal">
              Experience
            </h2>
            <span className="font-mono text-[12px] text-muted">solid: roles · dashed, indented: agentic AI builds and side projects</span>
          </div>
          <CvFocusProvider>
            <ol className="m-0 flex list-none flex-col p-0">
              {cvItems.map((it) => {
                const l = lane(it);
                return (
                  <li key={it.id} className="grid grid-cols-[132px_minmax(0,1fr)] gap-x-5 max-[640px]:grid-cols-[minmax(0,1fr)]">
                    <div className="flex flex-col items-end pt-[22px] text-right font-mono text-[12px] leading-[1.5] text-muted max-[640px]:hidden">
                      {it.dates}
                    </div>
                    <div className={`relative border-l-2 border-rule py-[10px] pr-0 ${l.indent}`}>
                      <span
                        aria-hidden="true"
                        className={`absolute top-[26px] -left-[7px] h-3 w-3 rounded-full border-2 border-solid ${l.dot}`}
                      />
                      <CvCard id={it.id} bg={l.bg} border={l.border}>
                        <div className="flex flex-col gap-1">
                          <span className="hidden font-mono text-[12px] text-muted max-[640px]:inline">{it.dates}</span>
                          {l.project && <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">{projectKind(it)}</span>}
                          <h3 className={`m-0 font-semibold leading-[1.3] ${l.title}`}>{it.title}</h3>
                          <p className="m-0 text-[15px] text-muted">{it.org}</p>
                          {it.ladder && <p className="mt-1 mb-0 font-mono text-[12px] leading-[1.6] text-muted">{it.ladder}</p>}
                        </div>
                        {it.scope && <p className="m-0 text-[15px] leading-[1.55]">{it.scope}</p>}
                        {it.highlights.length > 0 && <CvHighlights id={it.id} items={it.highlights} />}
                        {it.groups && <CvGroups id={it.id} groups={it.groups} />}
                        <CvActions full={it.full}>
                          {it.qa && <AskAboutRole topic={topicFor(it)} />}
                          {it.href && it.link && <CvLink href={it.href}>{it.link}</CvLink>}
                          {it.href2 && it.link2 && <CvLink href={it.href2}>{it.link2}</CvLink>}
                        </CvActions>
                      </CvCard>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CvFocusProvider>
        </section>

        <section aria-labelledby="skills-h" className="flex flex-col gap-[14px]">
          <h2 id="skills-h" className="m-0 font-serif text-[36px] font-normal">
            Skills
          </h2>
          <div className="flex flex-col border-t border-rule">
            {cvSkills.map(([name, list]) => (
              <div
                key={name}
                className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-6 gap-y-1 border-b border-rule py-[14px]"
              >
                <span className="text-[15px] font-semibold">{name}</span>
                <span className="col-span-2 min-w-0 text-[15px] leading-[1.55] text-muted">{list}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
