import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Generated at /robots.txt.
 *
 * The disallow list is everything a crawler would only ever find by accident:
 * the three signed-in panels, the auth screens, and the API. None of it is
 * useful in search results, and crawling it burns crawl budget that should go
 * to the service and blog pages.
 *
 * Note this asks crawlers not to *fetch* these paths — it is not a security
 * boundary. Access control is enforced server-side in the API routes and
 * firestore.rules; robots.txt only shapes what Google spends time on.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/patient/",
          "/doctor/",
          "/api/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
