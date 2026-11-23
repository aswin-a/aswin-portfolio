"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import type { ContactConfig } from "@/lib/contact/config";
import { telHref, waHref } from "@/lib/contact/config";
import { CONTACT_COPY, minutesText } from "@/lib/contact/copy";
import { CONTACT_LIMITS, ContactResponseSchema, invalidFields, type ContactField, type ContactFields } from "@/lib/contact/schema";
import { rolePrefill } from "@/lib/fit-check/role-prefill";
import { turnstileToken } from "@/lib/turnstile/client";

/** Footer.dc.html `initial`: the form's 6 states (design update 7, FooterStates.dc.html). */
export type ContactStatus = "idle" | "invalid" | "sending" | "sent" | "error" | "limited";

/** On failure the typed message survives a reload (SPEC §9). Cleared once sent. */
const DRAFT_KEY = "contact-draft";
const EMPTY: ContactFields = { name: "", email: "", role: "", msg: "" };

function readDraft(): ContactFields | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<ContactFields>;
    return { name: String(d.name ?? ""), email: String(d.email ?? ""), role: String(d.role ?? ""), msg: String(d.msg ?? "") };
  } catch {
    return null;
  }
}
function writeDraft(f: ContactFields | null) {
  try {
    if (f) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(f));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage blocked: the message still stays in the form.
  }
}

type Outcome = { status: "sent" } | { status: "invalid" } | { status: "error" } | { status: "limited"; retryAfterSec: number };

async function postContact(form: ContactFields): Promise<Outcome> {
  try {
    const token = await turnstileToken();
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken: token }),
    });
    const parsed = ContactResponseSchema.safeParse(await res.json());
    if (!parsed.success) return { status: "error" };
    const r = parsed.data;
    if (r.ok) return { status: "sent" };
    if (r.code === "rate_limited") return { status: "limited", retryAfterSec: r.retryAfterSec ?? 3600 };
    if (r.code === "invalid") return { status: "invalid" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

const fieldBase = "min-h-11 rounded-lg border px-3 py-2 font-sans text-[16px] text-ink";

/**
 * The contact area of the shared Footer (Footer.dc.html, design update 7): the direct options
 * (WhatsApp, call) under the intro, and the form with its 6 states. Sending shows only while the
 * real request is in flight. "Talk to Aswin about this role" in the hero pre-fills Role.
 */
export function ContactArea({ intro, links, config }: { intro: ReactNode; links: ReactNode; config: ContactConfig }) {
  const [form, setForm] = useState<ContactFields>(EMPTY);
  const [prefilled, setPrefilled] = useState(false);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [tick, setTick] = useState(0);
  const [limitTime, setLimitTime] = useState("");
  const reopen = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A draft kept after a failed send (survives a reload).
  useEffect(() => {
    const d = readDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after hydration.
    if (d) setForm(d);
  }, []);
  // Main.dc.html `setRole` / Footer `componentDidUpdate`: the fit check's role fills the field.
  useEffect(
    () =>
      rolePrefill.subscribe((role) => {
        setForm((f) => ({ ...f, role }));
        setPrefilled(true);
        setStatus((s) => (s === "limited" ? s : "idle"));
      }),
    [],
  );
  // The three dots step every 300ms while the request is in flight.
  useEffect(() => {
    if (status !== "sending") return;
    const t = setInterval(() => setTick((n) => n + 1), 300);
    return () => clearInterval(t);
  }, [status]);
  useEffect(() => () => void (reopen.current && clearTimeout(reopen.current)), []);

  const set = (k: keyof ContactFields) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const rolePrefilled = prefilled && !!form.role;
  // While invalid, every keystroke re-checks, so each fix clears at once.
  const bad: ContactField[] = status === "invalid" ? invalidFields(form) : [];
  const sending = status === "sending";
  const limited = status === "limited";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || limited) return;
    if (invalidFields(form).length) {
      setStatus("invalid");
      track("contact_submit", { outcome: "invalid", contact_prefilled_role: rolePrefilled });
      return;
    }
    setTick(0);
    setStatus("sending");
    const out = await postContact(form);
    track("contact_submit", { outcome: out.status, contact_prefilled_role: rolePrefilled });
    if (out.status === "sent") {
      writeDraft(null);
      setStatus("sent");
      return;
    }
    writeDraft(form);
    if (out.status === "limited") {
      setLimitTime(minutesText(out.retryAfterSec));
      setStatus("limited");
      if (reopen.current) clearTimeout(reopen.current);
      reopen.current = setTimeout(() => setStatus((s) => (s === "limited" ? "idle" : s)), out.retryAfterSec * 1000);
      return;
    }
    // A server "invalid" the form's own check can't see is shown as the error state.
    setStatus(out.status === "invalid" && invalidFields(form).length ? "invalid" : "error");
  };

  const waLink = (withMessage: boolean) => waHref(config.digits, form.role, withMessage ? form.msg : "");
  const onWa = () => track("contact_whatsapp_click", {});

  /** Footer.dc.html `fieldVal`: amber when bad, accent when the role was pre-filled, else rule; dimmed while sending. */
  const stateClass = (k: ContactField | "role") =>
    `${
      k !== "role" && bad.includes(k)
        ? "border-amber-border bg-amber-bg"
        : k === "role" && rolePrefilled
          ? "border-accent bg-accent-tint"
          : "border-rule bg-bg"
    } ${sending ? "opacity-60" : ""}`;
  const fieldClass = (k: ContactField | "role") => `${fieldBase} ${stateClass(k)}`;
  const err = (k: ContactField) =>
    bad.includes(k) ? (
      <span id={`c-${k}-err`} className="text-[13px] text-amber-text">
        {CONTACT_COPY.fieldError[k]}
      </span>
    ) : null;
  const invalidProps = (k: ContactField) => ({
    "aria-invalid": bad.includes(k) || undefined,
    "aria-describedby": `c-${k}-err`,
    disabled: sending,
  });

  const line =
    status === "invalid" && bad.length
      ? { tag: CONTACT_COPY.invalid.tag, text: CONTACT_COPY.invalid.text(bad.length), tone: "amber", role: "alert", wa: false }
      : status === "error"
        ? { tag: CONTACT_COPY.error.tag, text: CONTACT_COPY.error.text, tone: "amber", role: "alert", wa: true }
        : limited
          ? { tag: CONTACT_COPY.limited.tag, text: CONTACT_COPY.limited.text(limitTime), tone: "muted", role: "status", wa: true }
          : null;

  return (
    <>
      <div className="flex flex-[1_1_320px] flex-col gap-[14px]">
        {intro}
        <div className="mt-2 flex flex-col gap-[10px]">
          <div className="flex flex-wrap gap-[10px]">
            <a
              href={waLink(false)}
              target="_blank"
              rel="noopener"
              onClick={onWa}
              className="inline-flex min-h-12 flex-[1_1_170px] items-center justify-center gap-[10px] rounded-[10px] border border-rule bg-paper px-[18px] py-[10px] text-[15px] font-semibold text-ink no-underline"
            >
              <span aria-hidden="true" className="h-[10px] w-[10px] rounded-full bg-whatsapp" />
              {CONTACT_COPY.whatsapp}
            </a>
            <a
              href={telHref(config.digits)}
              onClick={() => track("contact_call_click", {})}
              className="inline-flex min-h-12 flex-[1_1_170px] items-center justify-center gap-[10px] rounded-[10px] border border-rule bg-paper px-[18px] py-[10px] text-[15px] font-semibold text-ink no-underline"
            >
              <span aria-hidden="true" className="font-mono text-[14px] text-accent">
                ☎
              </span>
              {CONTACT_COPY.call}
            </a>
          </div>
          <span className="font-mono text-[12px] leading-[1.6] text-muted">
            {CONTACT_COPY.directLine(config.phoneDisplay, config.hours, rolePrefilled)}
          </span>
        </div>
        {links}
      </div>
      <div className="flex-[1_1_420px]">
        {status === "sent" ? (
          <div role="status" className="flex flex-col gap-2 rounded-[14px] border border-rule bg-paper p-7">
            <p className="m-0 font-mono text-[12px] text-accent">✓ SENT</p>
            <p className="m-0 font-serif text-[26px]">Thanks. Your note is with Aswin.</p>
            <p className="m-0 text-[15px] text-muted">He replies from his own inbox, usually within {config.responseTime}.</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            aria-busy={sending}
            data-status={status}
            className="flex flex-col gap-[14px] rounded-[14px] border border-rule bg-paper p-6"
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[14px]">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="c-name" className="text-[14px] font-medium">
                  Name
                </label>
                <input id="c-name" type="text" value={form.name} onChange={set("name")} maxLength={CONTACT_LIMITS.name} {...invalidProps("name")} className={fieldClass("name")} />
                {err("name")}
              </div>
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="c-email" className="text-[14px] font-medium">
                  Work email
                </label>
                <input id="c-email" type="email" value={form.email} onChange={set("email")} maxLength={CONTACT_LIMITS.email} {...invalidProps("email")} className={fieldClass("email")} />
                {err("email")}
              </div>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="c-role" className="text-[14px] font-medium">
                Role
              </label>
              <input
                id="c-role"
                type="text"
                value={form.role}
                onChange={(e) => {
                  set("role")(e);
                  setPrefilled(false);
                }}
                maxLength={CONTACT_LIMITS.role}
                disabled={sending}
                aria-describedby="c-role-err"
                placeholder="e.g. Senior Platform PM"
                className={fieldClass("role")}
              />
              {rolePrefilled && <span className="font-mono text-[12px] text-accent">pre-filled from your fit check</span>}
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="c-msg" className="text-[14px] font-medium">
                Message
              </label>
              <textarea
                id="c-msg"
                rows={4}
                value={form.msg}
                onChange={set("msg")}
                maxLength={CONTACT_LIMITS.msg}
                {...invalidProps("msg")}
                className={`resize-y rounded-lg border px-3 py-[10px] font-sans text-[16px] text-ink ${stateClass("msg")}`}
              />
              {err("msg")}
            </div>
            {line && (
              <div
                role={line.role}
                data-testid="contact-line"
                className={`flex items-start gap-3 rounded-[10px] border px-[14px] py-3 ${
                  line.tone === "amber" ? "border-solid border-amber-border bg-amber-bg" : "border-dashed border-rule bg-bg"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex-none pt-[2px] font-mono text-[12px] tracking-[0.06em] ${line.tone === "amber" ? "text-amber-text" : "text-muted"}`}
                >
                  {line.tag}
                </span>
                <div className="flex flex-col gap-[6px]">
                  <span className="text-[15px] leading-[1.5] text-ink">{line.text}</span>
                  {line.wa && (
                    <a
                      href={waLink(true)}
                      target="_blank"
                      rel="noopener"
                      onClick={onWa}
                      className="inline-flex min-h-9 items-center self-start font-mono text-[13px] text-accent no-underline"
                    >
                      {CONTACT_COPY.whatsappInstead}
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <button
                type="submit"
                disabled={sending || limited}
                className={`min-h-12 rounded-[10px] border-0 px-[22px] py-3 font-sans text-[16px] font-semibold ${
                  sending || limited ? "cursor-not-allowed bg-rule text-muted" : "cursor-pointer bg-btn-bg text-btn-ink"
                }`}
              >
                {sending ? CONTACT_COPY.sending : status === "error" ? CONTACT_COPY.tryAgain : CONTACT_COPY.send}
              </button>
              {sending && (
                <span role="status" className="inline-flex items-center gap-2 font-mono text-[12px] text-muted">
                  <span aria-hidden="true" className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={`h-[6px] w-[6px] rounded-full ${tick % 3 === i ? "bg-ink" : "bg-rule"}`} />
                    ))}
                  </span>
                  {CONTACT_COPY.sendingStatus}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
