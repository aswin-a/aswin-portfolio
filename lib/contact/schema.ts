import { z } from "zod";

/** `/api/contact` request (SPEC §9). The fields are the Footer form's: Name, Work email, Role, Message. */
export const ContactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  role: z.string().trim().max(160).default(""),
  msg: z.string().trim().min(1).max(5000),
  turnstileToken: z.string().max(4096).default(""),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const CONTACT_STATUSES = ["sent", "invalid", "limited", "error"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const ContactResponseSchema = z.object({ status: z.enum(CONTACT_STATUSES) });
