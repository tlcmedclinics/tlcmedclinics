// Deliberately plain JavaScript, not TypeScript.
//
// Next has to transpile a `next.config.ts` before it can read it, and that
// needs its native SWC binary. On build hosts with an older glibc that binary
// won't load, Next falls back to the WASM build, and loading the TS config
// fails outright ("Failed to load next.config.ts"). A .js config is read
// directly, so it works everywhere. The JSDoc type still gives editor
// completion and checking.

const { version } = require("./package.json");

/**
 * Which build is running, printed to the browser console by SiteChrome.
 *
 * Deliberately NOT `new Date()`. `next build` runs two separate webpack
 * compilations, server and client, and each evaluates this file, so a clock
 * gives them different values — and an `env` value is inlined into whichever
 * modules read it. A package version is the same on every evaluation. Set
 * NEXT_PUBLIC_BUILD_STAMP in Hostinger's environment variables for something
 * more specific per deploy.
 */
const BUILD_STAMP = process.env.NEXT_PUBLIC_BUILD_STAMP || `v${version}`;

/**
 * The same thing, but with a clock on it — for the X-TLC-Build response header.
 *
 * BUILD_STAMP above must not use a clock, for the reason spelled out there: it
 * is inlined into client modules, and the server and client compilations would
 * disagree. This one never reaches the browser bundle. It is baked into the
 * routes manifest once, at build time, and only ever appears as a response
 * header — so a clock is safe here and is exactly what is wanted: two deploys
 * an hour apart get different values, which is what makes "is this edge serving
 * my latest build?" a question with an answer.
 */
const RESPONSE_STAMP = `${BUILD_STAMP}-${new Date().toISOString().slice(0, 16).replace(/\D/g, "")}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_STAMP: BUILD_STAMP,
  },

  /**
   * Generate the static pages in ONE process instead of sixty-three.
   *
   * WHY. The Hostinger build kept dying with:
   *
   *   Could not find the module ".../SiteChrome.tsx#default" in the React
   *   Client Manifest. This is probably a bug in the React Server Components
   *   bundler.
   *
   * It reads like a broken import, and it isn't. Two things say so. First, a
   * different set of pages failed on each run — /about and /register one time,
   * /_not-found and /privacy the next — and a genuinely broken module fails the
   * same pages every time. Second, /_not-found contains none of this project's
   * code at all; it is the root layout and nothing else. So SiteChrome compiles
   * fine and is in the manifest; some of the workers just can't see it.
   *
   * The log line above the failure is "Generating static pages using 63
   * workers". Each of those is a process that loads the client reference
   * manifest, and this is shared hosting with limited memory — the same build
   * is already falling back to the WASM build of SWC because the native binary
   * won't load. Serialising removes the race outright.
   *
   * COST: a slower build. Ninety-nine pages in one process is seconds, not
   * minutes, and a build that takes a minute longer beats one that fails.
   *
   * If deploys move to a machine with real memory, raise this or delete it.
   */
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // AVIF first, WebP second, original last. Blog covers and service photos
    // are the heaviest thing on the public pages, and image weight is most of
    // what Google's Largest Contentful Paint score measures.
    formats: ["image/avif", "image/webp"],
  },

  // Nothing gains from advertising the framework in a response header.
  poweredByHeader: false,

  /**
   * Cache rules, written for the CDN sitting in front of this site.
   *
   * WHY. tlcmedclinics.com resolves through Hostinger's CDN —
   * `www.tlcmedclinics.com` is a CNAME to `www.tlcmedclinics.com.cdn.hstgr.net`,
   * and the apex answers from a rotating pool of edge addresses. An edge that
   * has never been told otherwise will hold a page it fetched days ago, and
   * different edges hold different days. That is exactly the fault this site
   * has been showing: the same URL serving the current build on one request and
   * a previous deployment on the next, with a reload sometimes "fixing" it —
   * a reload that is really just landing on a different edge.
   *
   * So every response now says how long it may be kept:
   *
   *   HTML          revalidate every time. A patient must never be shown a
   *                 price, a slot or a signed-in page that was true last week.
   *   /api          never stored at all. These are per-patient and often
   *                 authenticated; a cached one is a data leak, not a stale
   *                 page.
   *   /_next/static forever. Those filenames contain a content hash, so a new
   *                 build produces new names and an old file can never be the
   *                 wrong answer.
   *
   * COST: the CDN stops absorbing HTML requests, so pages come from the origin
   * every time and are a little slower. That is the right trade here. The site
   * is small, most of its weight is images and scripts (still cached), and
   * "slightly slower" is worth incomparably more than "sometimes last week's
   * site".
   *
   * This does not switch the CDN off — only hPanel can do that. It tells the
   * CDN how to behave while it is on.
   */
  async headers() {
    return [
      {
        // Everything except the API and the hashed build output.
        source: "/((?!api/|_next/static/|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          // Which build actually answered. Open DevTools → Network → the
          // document request → Response Headers, and this says whether you
          // are looking at the deploy you just made or something an edge kept.
          // Two different values on two reloads is a caching problem, full
          // stop, and no longer needs guessing at.
          { key: "X-TLC-Build", value: RESPONSE_STAMP },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-TLC-Build", value: RESPONSE_STAMP },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // Every URL is generated without a trailing slash (sitemap, canonicals,
  // internal links). Stating it here stops the host redirecting between the two
  // forms, which would make canonicals disagree with the URLs that actually
  // serve.
  trailingSlash: false,
};

module.exports = nextConfig;
