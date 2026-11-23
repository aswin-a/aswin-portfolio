import { handleContact } from "@/lib/contact/handle";

/** The contact form in the shared Footer (SPEC §9). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return handleContact(request);
}
