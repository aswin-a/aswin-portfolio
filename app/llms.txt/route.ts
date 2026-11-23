import { llmsTxt } from "@/lib/llms";

/** /llms.txt (SPEC §11), built from /content at build time. */
export const dynamic = "force-static";

export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
