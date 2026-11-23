import { beforeEach, describe, expect, it, vi } from "vitest";
import { composeEmail, handleContact, type ResendEmail } from "@/lib/contact/handle";
import { ContactRequestSchema } from "@/lib/contact/schema";
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
const status = async (r: Response) => ((await r.json()) as { status: string }).status;

beforeEach(() => resetMemoryLimits());

describe("/api/contact", () => {
  it("sends through Resend with reply-to set to the sender", async () => {
    const sent: ResendEmail[] = [];
    const res = await handleContact(post(BODY), { env: ENV, verify: ok, send: async (m) => (sent.push(m), true) });
    expect(res.status).toBe(200);
    expect(await status(res)).toBe("sent");
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
    ["no name", { ...BODY, name: "  " }],
    ["bad email", { ...BODY, email: "not-an-email" }],
    ["no message", { ...BODY, msg: "" }],
    ["too long", { ...BODY, msg: "x".repeat(5001) }],
  ])("rejects %s as invalid without sending", async (_, body) => {
    const send = vi.fn(async () => true);
    const res = await handleContact(post(body), { env: ENV, verify: ok, send });
    expect(res.status).toBe(400);
    expect(await status(res)).toBe("invalid");
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a body that isn't JSON", async () => {
    expect(await status(await handleContact(post("{nope"), { env: ENV, verify: ok }))).toBe("invalid");
  });

  it("refuses a failed Turnstile check before sending", async () => {
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
    expect(await status(res)).toBe("limited");
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
