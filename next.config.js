// Deliberately plain JavaScript, not TypeScript.
//
// Next has to transpile a `next.config.ts` before it can read it, and that
// needs its native SWC binary. On build hosts with an older glibc that binary
// won't load, Next falls back to the WASM build, and loading the TS config
// fails outright ("Failed to load next.config.ts"). A .js config is read
// directly, so it works everywhere. The JSDoc type still gives editor
// completion and checking.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stamped into the client bundle at build time, and printed to the browser
  // console once on load.
  //
  // Worth the two lines because "is the code I just deployed actually the code
  // running?" has cost this project hours. A host serving a cached build looks
  // exactly like code that doesn't work: the button isn't there, the fix didn't
  // take, and there is no way from the outside to tell which. This makes the
  // answer readable in one glance at the console.
  env: {
    NEXT_PUBLIC_BUILD_STAMP: new Date().toISOString(),
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
