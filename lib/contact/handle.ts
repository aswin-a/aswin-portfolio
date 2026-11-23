import { ContactRequestSchema, invalidFields, type ContactRequest, type ContactResponse } from "@/lib/contact/schema";
import { isFake, serverEnv, type ServerEnv } from "@/lib/server/env";
import { takeToken } from "@/lib/server/ratelimit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { clientIp, visitorId } from "@/lib/server/visitor";

/**
 * `/api/contact` (SPEC §9, design update 7): Zod → Turnstile → 3 per hour per connection → Resend,
 * to CONTACT_TO_EMAIL with Reply-To set to the sender. No auto-reply. The message is never stored
 * or logged: errors log only a status code. A Turnstile failure is `error`, never `invalid`.
 *
 * Under AI_FAKE (refused in production) nothing is sent, and the markers [[fake:error]] and
 * [[fake:limited]] in the message force those replies.
 */
const RESEND_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;

export type ResendEmail = { from: string; to: string[]; reply_to: string; subject: string; text: string };
export type SendMail = (mail: ResendEmail, env: ServerEnv) => Promise<boolean>;
export type ContactDeps = { env?: ServerEnv; verify?: typeof verifyTurnstile; send?: SendMail };

const reply = (body: ContactResponse, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const failed = (status: number) => reply({ ok: false, code: "error" }, status);
const limited = (retryAfterSec: number) =>
  Response.json({ ok: false, code: "rate_limited", retryAfterSec } satisfies ContactResponse, {
    status: 429,
    headers: { "cache-control": "no-store", "retry-after": String(retryAfterSec) },
  });

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
    return failed(500);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return failed(400);
  }
  const parsed = ContactRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const fields = invalidFields({ name: str(r.name), email: str(r.email), role: str(r.role), msg: str(r.msg) });
    // A shape the form can't produce (too long, wrong types): name the fields Zod rejected.
    const zodFields = parsed.error.issues.map((i) => i.path[0]).filter((p): p is "name" | "email" | "role" | "msg" => ["name", "email", "role", "msg"].includes(String(p)));
    return reply({ ok: false, code: "invalid", fields: [...new Set([...fields, ...zodFields])] }, 400);
  }
  const req = parsed.data;

  const ip = clientIp(request.headers);
  const turnstile = await (deps.verify ?? verifyTurnstile)(req.turnstileToken, ip, env);
  if (!turnstile.ok) {
    if (turnstile.reason === "config") console.error("contact: TURNSTILE_SECRET_KEY is not set");
    return failed(403);
  }

  const fake = isFake(env);
  if (fake && req.msg.includes("[[fake:limited]]")) return limited(1380);
  try {
    const t = await takeToken("contact", visitorId(ip, env), env);
    if (!t.success) return limited(t.retryAfterSec);
  } catch (e) {
    console.error("contact: rate limit unavailable:", e instanceof Error ? e.name : "error");
    return failed(503);
  }

  if (fake && !deps.send) return req.msg.includes("[[fake:error]]") ? failed(502) : reply({ ok: true });
  if (!deps.send && (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL)) {
    console.error("contact: RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are not set");
    return failed(500);
  }
  try {
    const ok = await (deps.send ?? sendWithResend)(composeEmail(req, env), env);
    return ok ? reply({ ok: true }) : failed(502);
  } catch (e) {
    console.error("contact send failed:", e instanceof Error ? e.name : "error");
    return failed(502);
  }
}
