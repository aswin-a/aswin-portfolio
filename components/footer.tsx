import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { siteMeta } from "@/content/site-meta";
import { hrefOf, isTodo, withTodo } from "@/lib/content";

/** The deploy date, filled at build time (next.config `BUILD_DATE`, e.g. "20 Nov 2026"). Never hard-coded. */
const updated = `Updated ${process.env.BUILD_DATE}`;

/**
 * The shared Footer (Footer.dc.html, design update 6), on every page: the "Talk to Aswin." contact
 * section (`#contact`) and the footer bar. The fit check's role reaches the form through
 * `rolePrefill` (Main.dc.html `role={fitRole}`); other pages leave it empty.
 */
export function Footer() {
  return (
    <>
      <section
        id="contact"
        aria-labelledby="contact-h"
        className="border-t border-rule px-6 pt-[72px] pb-[88px] max-[640px]:px-5 max-[640px]:pt-12 max-[640px]:pb-14"
      >
        <div className="mx-auto flex max-w-[1040px] flex-wrap gap-10">
          <div className="flex flex-[1_1_320px] flex-col gap-[14px]">
            <h2
              id="contact-h"
              className="m-0 font-serif text-[clamp(36px,6vw,48px)] font-normal leading-[1.05] tracking-[-0.01em]"
            >
              Talk to Aswin.
            </h2>
            <p className="m-0 font-serif text-[20px] leading-[1.45] text-muted">
              If the fit check sent you here, the role is already filled in. I read every message myself.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-[18px] gap-y-2">
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
          </div>
          <div className="flex-[1_1_420px]">
            <ContactForm
              responseTime={siteMeta.responseTime}
              contactEmail={siteMeta.contactEmail}
              contactHref={isTodo(siteMeta.contactEmail) ? "#" : `mailto:${siteMeta.contactEmail}`}
            />
          </div>
        </div>
      </section>
      <footer className="border-t border-rule px-6 py-7">
        <div className="mx-auto flex max-w-[1040px] flex-wrap justify-between gap-3 font-mono text-[12px] text-muted">
          <span>This site is an AI product. Turn on X-ray to see how it works.</span>
          <span>
            {updated} · © 2026 Aswin · {siteMeta.domain}
          </span>
        </div>
      </footer>
    </>
  );
}
