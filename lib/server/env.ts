import { z } from "zod";

/**
 * Server env (SPEC §13), parsed on each call so tests can change it. Never import this from a
 * client component: none of these values may reach the browser.
 */
const EnvSchema = z.object({
  VERCEL_ENV: z.string().optional(),
  AI_FAKE: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  FIT_CHECK_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  CHAT_MODEL: z.string().min(1).default("claude-haiku-5-5"),
  FIT_DAILY_LIMIT: z.coerce.number().int().positive().default(10),
  MONTHLY_BUDGET_USD: z.coerce.number().positive().default(20),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  IP_HASH_SALT: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().optional(),
  CONTACT_FROM_EMAIL: z.string().optional(),
});
export type ServerEnv = z.infer<typeof EnvSchema>;

/** Empty strings (as in .env.example) count as unset. */
export function serverEnv(): ServerEnv {
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
  return EnvSchema.parse(raw);
}

export function isProduction(env: ServerEnv = serverEnv()): boolean {
  return env.VERCEL_ENV === "production";
}

/**
 * AI_FAKE=1 swaps the model for a deterministic fake and relaxes Turnstile, so tests and e2e run
 * the real pipeline without keys. It is refused in production.
 */
export function isFake(env: ServerEnv = serverEnv()): boolean {
  return env.AI_FAKE === "1" && !isProduction(env);
}
