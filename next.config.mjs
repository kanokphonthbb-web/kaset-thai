import { ARTICLE_REDIRECTS } from "./lib/articleSeoRules.mjs";
import { PRODUCT_REDIRECTS } from "./lib/productCanonical.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 1440px avoids sending the much larger 1920px hero variant to common
    // laptop/desktop viewports while keeping a full-width responsive image.
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1440, 1920, 2048, 3840],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.img.susercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.kasettakonthai.com" }],
        destination: "https://kasettakonthai.com/:path*",
        permanent: true,
      },
      ...Object.entries(ARTICLE_REDIRECTS).map(([sourceSlug, destinationSlug]) => ({
        source: `/articles/${sourceSlug}`,
        destination: `/articles/${destinationSlug}`,
        permanent: true,
      })),
      ...Object.entries(PRODUCT_REDIRECTS).map(([sourceSlug, destinationSlug]) => ({
        source: `/products/${sourceSlug}`,
        destination: `/products/${destinationSlug}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
