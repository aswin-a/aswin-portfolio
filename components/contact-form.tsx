"use client";

import { useEffect, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { CONTACT_COPY } from "@/lib/contact/copy";
import { ContactResponseSchema, type ContactStatus } from "@/lib/contact/schema";
import { rolePrefill } from "@/lib/fit-check/role-prefill";
import { turnstileToken } from "@/lib/turnstile/client";

const field =
  "min-h-11 rounded-lg border px-3 py-2 font-sans text-[16px] text-ink";

type Phase = "idle" | "sending" | Exclude<ContactStatus, "sent">;

async function sendContact(form: { name: string; email: string; role: string; msg: string }): Promise<ContactStatus> {
  try {
    const token = await turnstileToken();
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken: token }),
    });
    const parsed = ContactResponseSchema.safeParse(await res.json());
    return parsed.success ? parsed.data.status : "error";
  } catch {
    return "error";
  }
}

/**
 * Contact form from Footer.dc.html (design update 6), sent through /api/contact (SPEC §9).
 * "Talk to Aswin about this role" in the hero pre-fills Role. The sending, invalid, limited and
 * error lines aren't in the design; their copy was approved in Milestone 6 (lib/contact/copy.ts).
 */
export function ContactForm({
  responseTime,
  contactEmail,
  contactHref,
  prefilledRole,
}: {
  responseTime: string;
  /** siteMeta.contactEmail as shown, and its mailto: href ("#" while it's a placeholder). */
  contactEmail: string;
  contactHref: string;
  prefilledRole?: string;
}) {
  const [form, setForm] = useState({ name: "", email: "", role: prefilledRole ?? "", msg: "" });
  const [prefilled, setPrefilled] = useState(!!prefilledRole);
  const [sent, setSent] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  // Main.dc.html `setRole`: the fit check's role fills the field and marks it pre-filled.
  useEffect(
    () =>
      rolePrefill.subscribe((role) => {
        setForm((f) => ({ ...f, role }));
        setPrefilled(true);
      }),
    [],
  );
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    setPhase("sending");
    const status = await sendContact(form);
    if (status === "sent") {
      track("contact_sent", {});
      setSent(true);
      setPhase("idle");
    } else setPhase(status);
  };
  const sending = phase === "sending";
  const mail = (
    <a href={contactHref} className="text-accent">
      {contactEmail}
    </a>
  );
  const line =
    phase === "invalid" ? (
      CONTACT_COPY.invalid
    ) : phase === "limited" ? (
      <>
        {CONTACT_COPY.limited.before}
        {mail}
        {CONTACT_COPY.limited.after}
      </>
    ) : phase === "error" ? (
      <>
        {CONTACT_COPY.error.before}
        {mail}
        {CONTACT_COPY.error.after}
      </>
    ) : null;

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-[14px] border border-rule bg-paper p-7">
        <p className="m-0 font-mono text-[12px] text-accent">✓ SENT</p>
        <p className="m-0 font-serif text-[26px]">Thanks. Your note is with Aswin.</p>
        <p className="m-0 text-[15px] text-muted">He replies from his own inbox, usually within {responseTime}.</p>
      </div>
    );
  }

  const rolePrefilled = prefilled && !!form.role;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[14px] rounded-[14px] border border-rule bg-paper p-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[14px]">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="c-name" className="text-[14px] font-medium">
            Name
          </label>
          <input id="c-name" type="text" value={form.name} onChange={set("name")} className={`${field} border-rule bg-bg`} />
        </div>
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="c-email" className="text-[14px] font-medium">
            Work email
          </label>
          <input id="c-email" type="email" value={form.email} onChange={set("email")} className={`${field} border-rule bg-bg`} />
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
          placeholder="e.g. Senior Platform PM"
          className={`${field} ${rolePrefilled ? "border-accent bg-accent-tint" : "border-rule bg-bg"}`}
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
          className="resize-y rounded-lg border border-rule bg-bg px-3 py-[10px] font-sans text-[16px] text-ink"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-btn-bg px-[22px] py-3 font-sans text-[16px] font-semibold text-btn-ink disabled:cursor-default"
      >
        {sending ? CONTACT_COPY.sending : CONTACT_COPY.button}
      </button>
      <p aria-live="polite" data-testid="contact-line" className={line ? "m-0 font-mono text-[12px] text-amber-text" : "sr-only"}>
        {line}
      </p>
    </form>
  );
}
