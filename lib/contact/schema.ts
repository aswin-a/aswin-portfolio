// zod/mini: the same validation as classic Zod in a fraction of the bundle. These schemas run in the
// browser too (stream and response parsing), so they stay out of the classic API (Lighthouse, SPEC §14.8).
import * as z from "zod/mini";

/** Field limits; the form's inputs carry the same `maxLength` (Aswin, 2026-11-23). */
export const CONTACT_LIMITS = { name: 120, email: 254, role: 160, msg: 5000 } as const;

/** Footer.dc.html `errors()`: an email "looks like a@b.c". */
export const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type ContactFields = { name: string; email: string; role: string; msg: string };
export type ContactField = "name" | "email" | "msg";
export const CONTACT_FIELDS: readonly ContactField[] = ["name", "email", "msg"];

/** The design's check, shared by the form (on send) and the server: name and message required, email shaped, role optional. */
export function invalidFields(f: ContactFields): ContactField[] {
  const bad: ContactField[] = [];
  if (!f.name.trim()) bad.push("name");
  if (!EMAIL_SHAPE.test(f.email.trim())) bad.push("email");
  if (!f.msg.trim()) bad.push("msg");
  return bad;
}

/** `/api/contact` request (SPEC §9). The fields are the Footer form's: Name, Work email, Role, Message. */
export const ContactRequestSchema = z.object({
  name: z.string().check(z.trim(), z.minLength(1), z.maxLength(CONTACT_LIMITS.name)),
  email: z.string().check(z.trim(), z.maxLength(CONTACT_LIMITS.email), z.regex(EMAIL_SHAPE)),
  role: z._default(z.string().check(z.trim(), z.maxLength(CONTACT_LIMITS.role)), ""),
  msg: z.string().check(z.trim(), z.minLength(1), z.maxLength(CONTACT_LIMITS.msg)),
  turnstileToken: z._default(z.string().check(z.maxLength(4096)), ""),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

/** `/api/contact` reply (design update 7, SPEC §9). */
export const ContactResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    code: z.enum(["invalid", "rate_limited", "error"]),
    fields: z.optional(z.array(z.enum(["name", "email", "role", "msg"]))),
    retryAfterSec: z.optional(z.int().check(z.nonnegative())),
  }),
]);
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
