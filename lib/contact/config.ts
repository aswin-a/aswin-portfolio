import { todo } from "@/lib/content";

/**
 * Direct contact details (design update 7, SPEC §5, §9, §13): phone, call hours and reply time.
 * They're personal, so they live in env config (CONTACT_PHONE, CONTACT_PHONE_DISPLAY, CONTACT_HOURS,
 * CONTACT_RESPONSE_TIME), not in the repo. Read at build time by the server-rendered Footer.
 *
 * Unset values fall back to the design's placeholders, so dev and preview match the artboards,
 * links become "#" and `check:content` fails a production build. The phone number is shown only
 * on the page: never in JSON-LD, llms*.txt or the markdown twins.
 */
export type ContactConfig = {
  /** Digits only, for wa.me and tel: ("" while unset). */
  digits: string;
  phoneDisplay: string;
  hours: string;
  responseTime: string;
};

const PLACEHOLDER = {
  phone: todo("+91 [number]"),
  hours: todo("[Mon–Fri, 10am–7pm IST]"),
  responseTime: todo("[response time]"),
};

const E164 = /^\+[1-9]\d{6,14}$/;

export function contactConfig(env: Record<string, string | undefined> = process.env): ContactConfig {
  const phone = env.CONTACT_PHONE?.replace(/[\s-]/g, "") ?? "";
  const digits = E164.test(phone) ? phone.slice(1) : "";
  return {
    digits,
    phoneDisplay: env.CONTACT_PHONE_DISPLAY?.trim() || (digits ? `+${digits}` : PLACEHOLDER.phone),
    hours: env.CONTACT_HOURS?.trim() || PLACEHOLDER.hours,
    responseTime: env.CONTACT_RESPONSE_TIME?.trim() || PLACEHOLDER.responseTime,
  };
}

/** Footer.dc.html `waHref`: the greeting, with the role when the form has one. */
export function waGreeting(role: string): string {
  const r = role.trim();
  return r ? `Hi Aswin, I found your portfolio. I’m hiring for a ${r} role.` : "Hi Aswin, I found your portfolio.";
}

/**
 * wa.me link. `message` (the typed message) is added after a blank line in the error and
 * rate-limited lines only (Aswin, 2026-11-23). "#" while the phone is unset.
 */
export function waHref(digits: string, role: string, message = ""): string {
  if (!digits) return "#";
  const text = message.trim() ? `${waGreeting(role)}\n\n${message.trim()}` : waGreeting(role);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const telHref = (digits: string) => (digits ? `tel:+${digits}` : "#");
