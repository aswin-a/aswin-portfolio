import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addSpend, budgetKey, budgetLeft, resetMemoryBudget, spentThisMonth } from "@/lib/server/budget";
import type { ServerEnv } from "@/lib/server/env";
import { ASK_HOURLY_LIMIT, CONTACT_HOURLY_LIMIT, checkLimit, resetMemoryLimits, takeToken } from "@/lib/server/ratelimit";

/** The in-memory store (no Upstash env), as local and AI_FAKE servers use it. */
const ENV: ServerEnv = { FIT_CHECK_MODEL: "m", CHAT_MODEL: "m", FIT_DAILY_LIMIT: 2, MONTHLY_BUDGET_USD: 1 };
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-23T10:00:00Z"));
  resetMemoryLimits();
  resetMemoryBudget();
});
afterEach(() => vi.useRealTimers());

async function drain(bucket: Parameters<typeof checkLimit>[0], visitor: string, n: number) {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push(await checkLimit(bucket, visitor, ENV));
  return out;
}

describe("rate limits (SPEC §10)", () => {
  it("fit: FIT_DAILY_LIMIT per visitor per day", async () => {
    expect(await drain("fit", "v", 3)).toEqual([true, true, false]);
    vi.advanceTimersByTime(DAY - 1);
    expect(await checkLimit("fit", "v", ENV)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(await checkLimit("fit", "v", ENV)).toBe(true);
  });

  it("ask: 30 an hour", async () => {
    expect(ASK_HOURLY_LIMIT).toBe(30);
    const r = await drain("ask", "v", 31);
    expect(r.filter(Boolean)).toHaveLength(30);
    expect(r[30]).toBe(false);
    vi.advanceTimersByTime(HOUR);
    expect(await checkLimit("ask", "v", ENV)).toBe(true);
  });

  it("contact: 3 an hour (SPEC §9)", async () => {
    expect(CONTACT_HOURLY_LIMIT).toBe(3);
    expect(await drain("contact", "v", 4)).toEqual([true, true, true, false]);
  });

  it("buckets and visitors are independent: drills don't use fit checks", async () => {
    await drain("fit", "v", 2);
    expect(await checkLimit("fit", "v", ENV)).toBe(false);
    expect(await drain("drill", "v", 3)).toEqual([true, true, false]);
    expect(await checkLimit("fit", "other", ENV)).toBe(true);
    expect(await checkLimit("ask", "v", ENV)).toBe(true);
  });

  it("is a sliding window: the oldest hit frees the first slot", async () => {
    await checkLimit("contact", "v", ENV);
    vi.advanceTimersByTime(20 * 60_000);
    await checkLimit("contact", "v", ENV);
    await checkLimit("contact", "v", ENV);
    vi.advanceTimersByTime(40 * 60_000);
    expect(await checkLimit("contact", "v", ENV)).toBe(true);
    expect(await checkLimit("contact", "v", ENV)).toBe(false);
  });

  it("takeToken: retryAfterSec is 0 on success, then whole seconds until a slot frees", async () => {
    expect(await takeToken("contact", "v", ENV)).toEqual({ success: true, retryAfterSec: 0 });
    await takeToken("contact", "v", ENV);
    await takeToken("contact", "v", ENV);
    vi.advanceTimersByTime(10 * 60_000 + 500);
    expect(await takeToken("contact", "v", ENV)).toEqual({ success: false, retryAfterSec: 50 * 60 });
    vi.advanceTimersByTime(50 * 60_000 - 1000);
    expect(await takeToken("contact", "v", ENV)).toEqual({ success: false, retryAfterSec: 1 });
  });

  it("a refused attempt doesn't take a slot", async () => {
    await drain("contact", "v", 10);
    vi.advanceTimersByTime(HOUR);
    expect(await drain("contact", "v", 4)).toEqual([true, true, true, false]);
  });
});

describe("monthly budget (SPEC §10)", () => {
  it("keys the counter by UTC month", () => {
    expect(budgetKey(new Date("2026-11-30T23:59:59Z"))).toBe("budget:2026-11");
    expect(budgetKey(new Date("2026-12-01T00:00:00Z"))).toBe("budget:2026-12");
    expect(budgetKey()).toBe("budget:2026-11");
  });

  it("adds each run's real cost and stops at MONTHLY_BUDGET_USD", async () => {
    expect(await budgetLeft(ENV)).toBe(true);
    await addSpend(0.4, ENV);
    await addSpend(0.5, ENV);
    expect(await spentThisMonth(ENV)).toBeCloseTo(0.9);
    expect(await budgetLeft(ENV)).toBe(true);
    await addSpend(0.1, ENV);
    expect(await budgetLeft(ENV)).toBe(false);
  });

  it("ignores zero, negative and NaN costs", async () => {
    for (const v of [0, -1, Number.NaN]) await addSpend(v, ENV);
    expect(await spentThisMonth(ENV)).toBe(0);
  });

  it("starts again next month", async () => {
    await addSpend(5, ENV);
    expect(await budgetLeft(ENV)).toBe(false);
    vi.setSystemTime(new Date("2026-12-01T00:00:00Z"));
    expect(await budgetLeft(ENV)).toBe(true);
  });
});
