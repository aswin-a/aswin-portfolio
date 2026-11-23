import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { aiCrawlerOf } from "@/lib/ai-crawlers";
import { logCrawl } from "@/lib/server/log-crawl";

/**
 * SPEC §11: log AI-crawler visits (bot name and path only) to `ai_crawls`. The request is never
 * changed or delayed: the insert runs after the response via waitUntil. (Next 16 renamed
 * middleware.ts to proxy.ts.)
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const bot = aiCrawlerOf(request.headers.get("user-agent"));
  if (bot) event.waitUntil(logCrawl(bot, request.nextUrl.pathname));
  return NextResponse.next();
}

export const config = {
  // Pages and the GEO files; not /api, Next's assets or files in /public (except the text routes).
  matcher: ["/((?!api/|_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|pdf|woff2?|css|js)$).*)"],
};
