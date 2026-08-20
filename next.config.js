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
