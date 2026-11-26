import { stackMarkdown } from "@/lib/stack";

/** /stack.md: the operating-stack page as markdown for GEO (design update 11), from content/stack.ts like the page. */
export const dynamic = "force-static";

export function GET() {
  return new Response(stackMarkdown(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
