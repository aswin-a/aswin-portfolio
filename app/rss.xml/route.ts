import { rssXml } from "@/lib/rss";

/** /rss.xml: the build log feed (SPEC §11). */
export const dynamic = "force-static";

export async function GET() {
  return new Response(await rssXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
