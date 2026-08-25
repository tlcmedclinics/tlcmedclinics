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
 * This used to be `new Date().toISOString()`, and that broke the production
 * build. `next build` runs two separate webpack compilations — one for the
 * server, one for the client — and each evaluates this file independently, so
 * the two got timestamps a few milliseconds apart. An `env` value is inlined
 * into whichever modules read it, so SiteChrome.tsx compiled to different
 * bytes on the server than on the client, and the server then asked for a
 * module the client manifest had no matching entry for:
 *
 *   Error: Could not find the module ".../SiteChrome.tsx#default" in the
 *   React Client Manifest.
 *
 * SiteChrome is the only file that reads this value, which is why it was the
 * only one named. `next dev` compiles once, so it never appeared locally.
 *
 * Whatever goes here has to be identical on every evaluation. A package
 * version is; a clock is not. Set NEXT_PUBLIC_BUILD_STAMP in Hostinger's
 * environment variables if you want something more specific per deploy.
 */
const BUILD_STAMP = process.env.NEXT_PUBLIC_BUILD_STAMP || `v${version}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_STAMP: BUILD_STAMP,
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
