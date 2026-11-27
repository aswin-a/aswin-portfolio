import Link from "next/link";
import { ContactArea } from "@/components/contact-form";
import { siteMeta } from "@/content/site-meta";
import { contactConfig } from "@/lib/contact/config";
import { hrefOf, withTodo } from "@/lib/content";

/** The deploy date, filled at build time (next.config `BUILD_DATE`, e.g. "20 Nov 2026"). Never hard-coded. */
const updated = `Updated ${process.env.BUILD_DATE}`;

/**
 * "This site’s code on GitHub →" (design update 14) links to `SITE_REPO_URL` and is hidden while it
 * is unset (the design's FOOT_REPO is still a placeholder). Not a secret: it renders on the page.
 */
export function siteRepoUrl(env: Record<string, string | undefined> = process.env): string | null {
  const url = env.SITE_REPO_URL?.trim();
  // A `[placeholder]` (the design's FOOT_REPO) counts as unset.
  return url && /^https:\/\/[^\s[\]]+$/.test(url) ? url : null;
}

/**
 * The shared Footer (Footer.dc.html, design update 6), on every page: the "Talk to Aswin." contact
 * section (`#contact`: intro, WhatsApp and call, links and the form, design update 7) and the footer bar. The fit check's role reaches the form through
 * `rolePrefill` (Main.dc.html `role={fitRole}`); other pages leave it empty.
 */
export function Footer() {
  const repo = siteRepoUrl();
  return (
    <>
      <section
        id="contact"
        aria-labelledby="contact-h"
        className="border-t border-rule px-6 pt-[72px] pb-[88px] max-[640px]:px-5 max-[640px]:pt-12 max-[640px]:pb-14"
      >
        <div className="mx-auto flex max-w-[1040px] flex-wrap gap-10">
          <ContactArea
            config={contactConfig()}
            intro={
              <>
                <h2
                  id="contact-h"
                  className="m-0 font-serif text-[clamp(36px,6vw,48px)] font-normal leading-[1.05] tracking-[-0.01em]"
                >
                  Talk to Aswin.
                </h2>
                <p className="m-0 font-serif text-[20px] leading-[1.45] text-muted">
                  If the fit check sent you here, the role is already filled in. I read every message myself.
                </p>
              </>
            }
            links={
              <div className="flex flex-wrap gap-x-[18px] gap-y-2">
                <a href={hrefOf(siteMeta.linkedin)} className="inline-flex min-h-11 items-center text-[15px]">
                  {withTodo("LinkedIn", siteMeta.linkedin)}
                </a>
                <a href={hrefOf(siteMeta.github)} className="inline-flex min-h-11 items-center text-[15px]">
                  {withTodo("GitHub", siteMeta.github)}
                </a>
                <Link href="/about" className="inline-flex min-h-11 items-center text-[15px]">
                  CV
                </Link>
              </div>
            }
          />
        </div>
      </section>
      <footer className="border-t border-rule px-6 py-7">
        <div className="mx-auto flex max-w-[1040px] flex-wrap justify-between gap-3 font-mono text-[12px] text-muted">
          <span className="inline-flex flex-wrap items-center gap-x-[14px] gap-y-1">
            <span>This site is an AI product. Turn on X-ray to see how it works.</span>
            {repo && (
              <a href={repo} className="inline-flex min-h-8 items-center text-accent no-underline">
                This site’s code on GitHub →
              </a>
            )}
          </span>
          <span>
            {updated} · © 2026 Aswin · {siteMeta.domain}
          </span>
        </div>
      </footer>
    </>
  );
}
