import { Ratelimit } from "@upstash/ratelimit";
import type { ServerEnv } from "./env";
import { redisOrNull } from "./redis";

/**
 * Rate limits (SPEC §10, buckets approved in M5 planning):
 * - fit: FIT_DAILY_LIMIT fit checks per visitor per day
 * - ask: 30 per visitor per hour, shared by Ask my work and Break my AI
 * - drill: FIT_DAILY_LIMIT failure drills per visitor per day, apart from fit checks
 * - contact: 3 contact-form messages per visitor per hour (SPEC §9)
 */
export type Bucket = "fit" | "ask" | "drill" | "contact";
export const ASK_HOURLY_LIMIT = 30;
export const CONTACT_HOURLY_LIMIT = 3;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function rule(bucket: Bucket, env: ServerEnv): { tokens: number; windowMs: number; window: "1 d" | "1 h" } {
  if (bucket === "ask") return { tokens: ASK_HOURLY_LIMIT, windowMs: HOUR_MS, window: "1 h" };
  if (bucket === "contact") return { tokens: CONTACT_HOURLY_LIMIT, windowMs: HOUR_MS, window: "1 h" };
  return { tokens: env.FIT_DAILY_LIMIT, windowMs: DAY_MS, window: "1 d" };
}

/** In-memory sliding window for local and AI_FAKE servers. Resets on restart. */
const memory = new Map<string, number[]>();
export function resetMemoryLimits() {
  memory.clear();
}

export async function checkLimit(bucket: Bucket, visitor: string, env: ServerEnv): Promise<boolean> {
  return (await takeToken(bucket, visitor, env)).success;
}

/**
 * Gives back one token taken by checkLimit, for a run that stopped before any model call (a link
 * fetch_url couldn't read, Aswin 2026-11-26). Upstash refunds with a negative rate.
 */
export async function refundToken(bucket: Bucket, visitor: string, env: ServerEnv): Promise<void> {
  const redis = redisOrNull(env);
  if (!redis) {
    memory.get(`${bucket}:${visitor}`)?.pop();
    return;
  }
  const { tokens, window } = rule(bucket, env);
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `rl:${bucket}`, analytics: false });
  await limiter.limit(visitor, { rate: -1 });
}

/** Like checkLimit, plus the seconds until the window frees a slot (0 on success). The contact form shows it (SPEC §9). */
export async function takeToken(bucket: Bucket, visitor: string, env: ServerEnv): Promise<{ success: boolean; retryAfterSec: number }> {
  const { tokens, windowMs, window } = rule(bucket, env);
  const redis = redisOrNull(env);
  const now = Date.now();
  if (!redis) {
    const key = `${bucket}:${visitor}`;
    const hits = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= tokens) {
      memory.set(key, hits);
      return { success: false, retryAfterSec: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
    }
    hits.push(now);
    memory.set(key, hits);
    return { success: true, retryAfterSec: 0 };
  }
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `rl:${bucket}`, analytics: false });
  const { success, reset } = await limiter.limit(visitor);
  return { success, retryAfterSec: success ? 0 : Math.max(1, Math.ceil((reset - now) / 1000)) };
}
