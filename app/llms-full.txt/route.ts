import { llmsFullTxt } from "@/lib/llms";

/** /llms-full.txt (SPEC §11): the site's content in one text file, built from /content. */
export const dynamic = "force-static";

export async function GET() {
  return new Response(await llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
