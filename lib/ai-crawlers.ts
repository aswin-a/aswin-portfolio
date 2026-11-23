/**
 * AI crawlers (SPEC §11): allowed in robots.txt and logged to `ai_crawls` by proxy.ts.
 * Matched case-insensitively as a token in the User-Agent.
 */
export const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
] as const;
export type AiCrawler = (typeof AI_CRAWLERS)[number];

// Longest first, so "Claude-SearchBot" never reads as a shorter name.
const BY_LENGTH = [...AI_CRAWLERS].sort((a, b) => b.length - a.length);

export function aiCrawlerOf(userAgent: string | null): AiCrawler | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const bot of BY_LENGTH) {
    const i = ua.indexOf(bot.toLowerCase());
    if (i < 0) continue;
    const before = ua[i - 1];
    const after = ua[i + bot.length];
    if ((before === undefined || !/[a-z0-9-]/.test(before)) && (after === undefined || !/[a-z0-9-]/.test(after))) return bot;
  }
  return null;
}
