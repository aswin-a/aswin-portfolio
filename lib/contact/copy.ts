/** Contact form copy, word for word from Footer.dc.html (design update 7). */
export const CONTACT_COPY = {
  send: "Send to Aswin",
  sending: "Sending…",
  tryAgain: "Try again",
  sendingStatus: "Sending to Aswin’s inbox",
  fieldError: {
    name: "Add your name.",
    email: "Enter an email like name@company.com.",
    msg: "Add a line or two about the role.",
  },
  invalid: { tag: "CHECK", text: (n: number) => (n === 1 ? "One field needs a fix before this can go." : `${n} fields need a fix before this can go.`) },
  error: { tag: "NOT SENT", text: "That didn’t go through, but your message is still here. Try again, or reach me another way." },
  limited: {
    tag: "PAUSED",
    text: (time: string) =>
      `This form takes 3 messages an hour from one connection, to keep spam out. Your message is saved here; send it again in ${time}, or right now on WhatsApp.`,
  },
  whatsappInstead: "Send it on WhatsApp instead →",
  whatsapp: "WhatsApp me",
  call: "Call me",
  directLine: (phone: string, hours: string, prefilled: boolean) =>
    `${phone} · calls ${hours} · WhatsApp anytime${prefilled ? " · role added to the message" : ""}`,
} as const;

/** `[time]` in the rate-limited line: whole minutes, rounded up (Aswin, 2026-11-23). */
export function minutesText(retryAfterSec: number): string {
  const m = Math.max(1, Math.ceil(retryAfterSec / 60));
  return m === 1 ? "1 minute" : `${m} minutes`;
}
