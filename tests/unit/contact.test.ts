import { beforeEach, describe, expect, it, vi } from "vitest";
import { composeEmail, handleContact, type ResendEmail } from "@/lib/contact/handle";
import { contactConfig, telHref, waGreeting, waHref } from "@/lib/contact/config";
import { minutesText } from "@/lib/contact/copy";
import { ContactRequestSchema, invalidFields } from "@/lib/contact/schema";
import type { ServerEnv } from "@/lib/server/env";
import { resetMemoryLimits } from "@/lib/server/ratelimit";

const ENV: ServerEnv = {
  FIT_CHECK_MODEL: "m",
  CHAT_MODEL: "m",
  FIT_DAILY_LIMIT: 10,
  MONTHLY_BUDGET_USD: 20,
  TURNSTILE_SECRET_KEY: "secret",
  RESEND_API_KEY: "re_test",
  CONTACT_TO_EMAIL: "inbox@example.com",
  CONTACT_FROM_EMAIL: "Site <contact@example.com>",
};
const ok = async () => ({ ok: true }) as const;
const BODY = { name: "Sam", email: "sam@company.example", role: "Senior Platform PM", msg: "Hello there", turnstileToken: "t" };

function post(body: unknown, ip = "198.51.100.4") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
type Reply = { ok: boolean; code?: string; fields?: string[]; retryAfterSec?: number };
const json = async (r: Response) => (await r.json()) as Reply;
/** "sent" for ok, else the code. */
const status = async (r: Response) => {
  const j = await json(r);
  return j.ok ? "sent" : j.code === "rate_limited" ? "limited" : j.code!;
};

beforeEach(() => resetMemoryLimits());

describe("/api/contact", () => {
  it("sends one notification through Resend with reply-to set to the sender (no auto-reply)", async () => {
    const sent: ResendEmail[] = [];
    const res = await handleContact(post(BODY), { env: ENV, verify: ok, send: async (m) => (sent.push(m), true) });
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: ["inbox@example.com"], from: "Site <contact@example.com>", reply_to: "sam@company.example" });
    expect(sent[0].text).toContain("Hello there");
    expect(sent[0].text).toContain("Role: Senior Platform PM");
  });

  it("posts the Resend REST shape", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      expect(await status(await handleContact(post(BODY), { env: ENV, verify: ok }))).toBe("sent");
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe("https://api.resend.com/emails");
      expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test");
      expect(JSON.parse(init.body as string)).toMatchObject({ reply_to: "sam@company.example", to: ["inbox@example.com"] });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    ["no name", { ...BODY, name: "  " }, ["name"]],
    ["bad email", { ...BODY, email: "priya@acme" }, ["email"]],
    ["no message", { ...BODY, msg: "" }, ["msg"]],
    ["name and message", { ...BODY, name: "", msg: " " }, ["name", "msg"]],
    ["too long", { ...BODY, msg: "x".repeat(5001) }, ["msg"]],
    ["role too long", { ...BODY, role: "x".repeat(161) }, ["role"]],
  ])("rejects %s as invalid with its fields, without sending", async (_, body, fields) => {
    const send = vi.fn(async () => true);
    const res = await handleContact(post(body), { env: ENV, verify: ok, send });
    expect(res.status).toBe(400);
    expect(await json(res)).toEqual({ ok: false, code: "invalid", fields });
    expect(send).not.toHaveBeenCalled();
  });

  it("role is optional", async () => {
    expect(await status(await handleContact(post({ ...BODY, role: "" }), { env: ENV, verify: ok, send: async () => true }))).toBe("sent");
  });

  it("a body that isn't JSON is an error", async () => {
    expect(await status(await handleContact(post("{nope"), { env: ENV, verify: ok }))).toBe("error");
  });

  it("refuses a failed Turnstile check before sending, as error (never invalid)", async () => {
    const send = vi.fn(async () => true);
    const res = await handleContact(post(BODY), { env: ENV, verify: async () => ({ ok: false, reason: "invalid" }), send });
    expect(res.status).toBe(403);
    expect(await status(res)).toBe("error");
    expect(send).not.toHaveBeenCalled();
  });

  it("requires a Turnstile secret outside AI_FAKE", async () => {
    const env = { ...ENV, TURNSTILE_SECRET_KEY: undefined };
    expect(await status(await handleContact(post(BODY), { env, send: async () => true }))).toBe("error");
  });

  it("limits each visitor to 3 messages an hour", async () => {
    const send = vi.fn(async () => true);
    for (let i = 0; i < 3; i++) expect(await status(await handleContact(post(BODY), { env: ENV, verify: ok, send }))).toBe("sent");
    const res = await handleContact(post(BODY), { env: ENV, verify: ok, send });
    expect(res.status).toBe(429);
    const j = await json(res);
    expect(j.code).toBe("rate_limited");
    expect(j.retryAfterSec).toBeGreaterThan(3500);
    expect(j.retryAfterSec).toBeLessThanOrEqual(3600);
    expect(res.headers.get("retry-after")).toBe(String(j.retryAfterSec));
    expect(send).toHaveBeenCalledTimes(3);
    // Another visitor is unaffected.
    expect(await status(await handleContact(post(BODY, "198.51.100.99"), { env: ENV, verify: ok, send }))).toBe("sent");
  });

  it("returns error when Resend fails or isn't configured", async () => {
    expect(await status(await handleContact(post(BODY), { env: ENV, verify: ok, send: async () => false }))).toBe("error");
    const env = { ...ENV, RESEND_API_KEY: undefined };
    expect(await status(await handleContact(post(BODY), { env, verify: ok }))).toBe("error");
  });

  it("never logs the visitor's message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await handleContact(post({ ...BODY, msg: "secret-words" }), { env: ENV, verify: ok, send: async () => false });
      await handleContact(post({ ...BODY, msg: "secret-words" }), { env: ENV, verify: ok, send: async () => { throw new Error("secret-words"); } });
      expect(JSON.stringify(spy.mock.calls)).not.toContain("secret-words");
    } finally {
      spy.mockRestore();
    }
  });

  it("AI_FAKE sends nothing and honours the state markers", async () => {
    const env = { ...ENV, AI_FAKE: "1", TURNSTILE_SECRET_KEY: undefined, RESEND_API_KEY: undefined };
    expect(await status(await handleContact(post(BODY), { env }))).toBe("sent");
    expect(await status(await handleContact(post({ ...BODY, msg: "x [[fake:error]]" }), { env }))).toBe("error");
    expect(await status(await handleContact(post({ ...BODY, msg: "x [[fake:limited]]" }), { env }))).toBe("limited");
    // Refused in production.
    const prod = { ...env, VERCEL_ENV: "production" };
    expect(await status(await handleContact(post(BODY), { env: prod }))).toBe("error");
  });
});

describe("composeEmail", () => {
  it("keeps the subject on one line", () => {
    const req = ContactRequestSchema.parse({ ...BODY, name: "Sam\r\nBcc: x@y.z" });
    expect(composeEmail(req, ENV).subject).not.toMatch(/[\r\n]/);
  });
});

describe("contact config (design update 7)", () => {
  it("reads phone, hours and response time from env", () => {
    const c = contactConfig({ CONTACT_PHONE: "+91 98765 43210", CONTACT_PHONE_DISPLAY: "+91 98765 43210", CONTACT_HOURS: "Mon–Fri", CONTACT_RESPONSE_TIME: "a day" });
    expect(c).toEqual({ digits: "919876543210", phoneDisplay: "+91 98765 43210", hours: "Mon–Fri", responseTime: "a day" });
    expect(telHref(c.digits)).toBe("tel:+919876543210");
  });
  it("falls back to the design placeholders and # links when unset or not E.164", () => {
    for (const env of [{}, { CONTACT_PHONE: "98765" }]) {
      const c = contactConfig(env);
      expect(c).toEqual({ digits: "", phoneDisplay: "+91 [number]", hours: "[Mon–Fri, 10am–7pm IST]", responseTime: "[response time]" });
      expect(waHref(c.digits, "")).toBe("#");
      expect(telHref(c.digits)).toBe("#");
    }
  });
  it("wa.me text: greeting with the role, plus the typed message when asked", () => {
    expect(waGreeting("")).toBe("Hi Aswin, I found your portfolio.");
    expect(waGreeting("Senior Platform PM")).toBe("Hi Aswin, I found your portfolio. I’m hiring for a Senior Platform PM role.");
    const u = new URL(waHref("919876543210", "Senior Platform PM", "Open to a call?"));
    expect(u.origin + u.pathname).toBe("https://wa.me/919876543210");
    expect(u.searchParams.get("text")).toBe("Hi Aswin, I found your portfolio. I’m hiring for a Senior Platform PM role.\n\nOpen to a call?");
  });
  it("wa.me text: the typed message is cut to 1,500 characters (design update 12)", () => {
    const text = new URL(waHref("919876543210", "", "x".repeat(4000))).searchParams.get("text")!;
    expect(text).toBe(`Hi Aswin, I found your portfolio.\n\n${"x".repeat(1500)}`);
  });
});

describe("form checks", () => {
  it("matches the design: name and message required, email shaped, role optional", () => {
    expect(invalidFields({ name: "Priya Raman", email: "priya@acme", role: "", msg: "" })).toEqual(["email", "msg"]);
    expect(invalidFields({ name: "a", email: "a@b.c", role: "", msg: "m" })).toEqual([]);
  });
  it("[time] is whole minutes, rounded up", () => {
    expect(minutesText(1)).toBe("1 minute");
    expect(minutesText(60)).toBe("1 minute");
    expect(minutesText(61)).toBe("2 minutes");
    expect(minutesText(1380)).toBe("23 minutes");
  });
});
