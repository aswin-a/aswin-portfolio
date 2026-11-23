import { cvMarkdown } from "@/lib/cv";

/** /about.md: the CV as markdown for GEO (SPEC §4), generated from content/cv.ts like the page. */
export const dynamic = "force-static";

export function GET() {
  return new Response(cvMarkdown(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
