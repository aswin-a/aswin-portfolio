import type { AiCrawler } from "@/lib/ai-crawlers";

/**
 * One row of `ai_crawls` (SPEC §10–11, supabase/migrations/0001): which AI crawler fetched which
 * path. No IP, no query string, no other headers. A plain PostgREST insert with the service role,
 * so proxy.ts doesn't pull in supabase-js. Without Supabase env it does nothing.
 */
export async function logCrawl(
  bot: AiCrawler,
  path: string,
  env: { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string } = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const res = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/ai_crawls`, {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ bot, path: path.slice(0, 512) }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error("ai_crawls insert failed: status", res.status);
  } catch {
    console.error("ai_crawls insert failed");
  }
}
