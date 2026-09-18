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
          // Both forms of each panel, on purpose.
          //
          // robots.txt matches on a literal prefix, so "/admin/" covers
          // /admin/appointments and misses /admin itself — which is the URL
          // Next.js actually serves the panel index at. All three landing
          // pages were crawlable.
          //
          // "/doctors" is deliberately absent: the public doctor pages live
          // there and are meant to be indexed. That is also why "/doctor" is
          // listed with its own trailing-slash twin rather than shortened —
          // a bare "/doctor" prefix would swallow /doctors/dr-naseem too.
          "/admin",
          "/admin/",
          "/patient",
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
