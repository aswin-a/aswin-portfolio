"use client";

import { useEffect, useState, type FormEvent } from "react";
import { rolePrefill } from "@/lib/fit-check/role-prefill";

const field =
  "min-h-11 rounded-lg border px-3 py-2 font-sans text-[16px] text-ink";

/**
 * Contact form from Footer.dc.html (design update 6). Sending is wired to /api/contact in Milestone 6; until then
 * submit does nothing (no fake "sent"). "Talk to Aswin about this role" in the hero pre-fills Role.
 */
export function ContactForm({ responseTime, prefilledRole }: { responseTime: string; prefilledRole?: string }) {
  const [form, setForm] = useState({ name: "", email: "", role: prefilledRole ?? "", msg: "" });
  const [prefilled, setPrefilled] = useState(!!prefilledRole);
  const sent = false;
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

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
          className={`${field} ${prefilled ? "border-accent bg-accent-tint" : "border-rule bg-bg"}`}
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
        className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-btn-bg px-[22px] py-3 font-sans text-[16px] font-semibold text-btn-ink"
      >
        Send to Aswin
      </button>
    </form>
  );
}
