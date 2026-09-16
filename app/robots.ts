import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const DEFAULT_DISALLOW = ["/admin/", "/api/", "/*?q="];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /search carries a noindex meta tag, so crawlers must be allowed to
        // fetch it and see that directive. Only private/system routes and
        // search-query junk (?q=) are blocked. Pagination (?page=) is left open.
        disallow: DEFAULT_DISALLOW,
      },
      // นโยบาย GEO/AEO ตั้งใจเปิดให้ AI crawler หลัก ๆ เก็บเนื้อหาไปอ้างอิง/ตอบคำถาม
      // (ต้องการให้ ChatGPT, Claude, Perplexity, Google AI ฯลฯ อ้างอิง/อ้างที่มาเว็บนี้)
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-User",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
        disallow: DEFAULT_DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
