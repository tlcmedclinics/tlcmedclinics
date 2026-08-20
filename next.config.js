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
  },
};

module.exports = nextConfig;
