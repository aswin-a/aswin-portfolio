import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/ai-crawlers";
import { absolute } from "@/lib/seo";

/** SPEC §11: the listed AI crawlers are allowed by name; nobody crawls /api/. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: "/api/" },
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: absolute("/sitemap.xml"),
  };
}
