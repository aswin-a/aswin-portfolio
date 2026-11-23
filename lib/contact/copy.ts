/**
 * Contact form lines the design doesn't show (Footer.dc.html has only the form and "✓ SENT").
 * Approved by Aswin for Milestone 6. `{email}` is siteMeta.contactEmail, rendered as a mailto link.
 */
export const CONTACT_COPY = {
  button: "Send to Aswin",
  sending: "Sending…",
  invalid: "Add your name, a work email and a message.",
  limited: { before: "That’s the limit for messages this hour. Email Aswin at ", after: " instead." },
  error: { before: "That didn’t send. Email Aswin at ", after: " instead." },
} as const;
