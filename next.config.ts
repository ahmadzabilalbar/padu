import type { NextConfig } from "next";

// Item photos live in Supabase Storage's public bucket.
const imageOrigin = process.env.SUPABASE_URL
  ? [new URL(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/**`)]
  : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: { remotePatterns: imageOrigin },
  experimental: {
    // Photos are shrunk in the browser first; the server accepts up to 4 MB (Vercel's cap is 4.5 MB).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
