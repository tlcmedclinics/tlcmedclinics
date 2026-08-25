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

  // Every URL is generated without a trailing slash (sitemap, canonicals,
  // internal links). Stating it here stops the host redirecting between the two
  // forms, which would make canonicals disagree with the URLs that actually
  // serve.
  trailingSlash: false,
};

module.exports = nextConfig;
