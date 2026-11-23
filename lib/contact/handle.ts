import { ContactRequestSchema, type ContactRequest, type ContactStatus } from "@/lib/contact/schema";
import { isFake, serverEnv, type ServerEnv } from "@/lib/server/env";
import { checkLimit } from "@/lib/server/ratelimit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { clientIp, visitorId } from "@/lib/server/visitor";

/**
 * `/api/contact` (SPEC §9): Zod → Turnstile → 3 per hour per visitor → Resend, to CONTACT_TO_EMAIL with
 * reply-to set to the sender. The message is never stored or logged: errors log only a status code.
 *
 * Under AI_FAKE (refused in production) nothing is sent, and the markers [[fake:error]] and
 * [[fake:limited]] in the message force those states for e2e.
 */
const RESEND_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;

export type SendMail = (mail: ResendEmail, env: ServerEnv) => Promise<boolean>;
export type ResendEmail = { from: string; to: string[]; reply_to: string; subject: string; text: string };

export type ContactDeps = { env?: ServerEnv; verify?: typeof verifyTurnstile; send?: SendMail };

const reply = (status: ContactStatus, code = 200) =>
  Response.json({ status }, { status: code, headers: { "cache-control": "no-store" } });

/** Header-safe: no line breaks in the subject. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export function composeEmail(req: ContactRequest, env: ServerEnv): ResendEmail {
  const role = req.role ? ` · ${oneLine(req.role)}` : "";
  return {
    from: env.CONTACT_FROM_EMAIL ?? "",
    to: [env.CONTACT_TO_EMAIL ?? ""],
    reply_to: req.email,
    subject: oneLine(`Portfolio: ${req.name}${role}`).slice(0, 200),
    text: [`Name: ${req.name}`, `Work email: ${req.email}`, `Role: ${req.role || "—"}`, "", req.msg].join("\n"),
  };
}

export const sendWithResend: SendMail = async (mail, env) => {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(mail),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });
  if (!res.ok) console.error("contact send failed: resend status", res.status);
  return res.ok;
};

export async function handleContact(request: Request, deps: ContactDeps = {}): Promise<Response> {
  let env: ServerEnv;
  try {
    env = deps.env ?? serverEnv();
  } catch {
    console.error("contact: bad server env");
    return reply("error", 500);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return reply("invalid", 400);
  }
  const parsed = ContactRequestSchema.safeParse(raw);
  if (!parsed.success) return reply("invalid", 400);
  const req = parsed.data;

  const ip = clientIp(request.headers);
  const turnstile = await (deps.verify ?? verifyTurnstile)(req.turnstileToken, ip, env);
  if (!turnstile.ok) {
    if (turnstile.reason === "config") console.error("contact: TURNSTILE_SECRET_KEY is not set");
    return reply("error", 403);
  }

  const fake = isFake(env);
  if (fake && req.msg.includes("[[fake:limited]]")) return reply("limited", 429);
  try {
    if (!(await checkLimit("contact", visitorId(ip, env), env))) return reply("limited", 429);
  } catch (e) {
    console.error("contact: rate limit unavailable:", e instanceof Error ? e.name : "error");
    return reply("error", 503);
  }

  if (fake && !deps.send) return req.msg.includes("[[fake:error]]") ? reply("error", 502) : reply("sent");
  if (!deps.send && (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL)) {
    console.error("contact: RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are not set");
    return reply("error", 500);
  }
  try {
    const ok = await (deps.send ?? sendWithResend)(composeEmail(req, env), env);
    return ok ? reply("sent") : reply("error", 502);
  } catch (e) {
    console.error("contact send failed:", e instanceof Error ? e.name : "error");
    return reply("error", 502);
  }
}
