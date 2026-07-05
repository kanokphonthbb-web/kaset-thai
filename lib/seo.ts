import type { Metadata } from "next";
import { imageFor, unsplashUrl, HERO_IMAGE } from "./data";
import { SITE_URL } from "./site";

// ─────────────────────────────────────────────────────────────
// SEO helper — ทุกหน้าต้องมี: title (≤60), description (150–160),
// feature image (OG+Twitter), canonical. รองรับ AEO/GEO/AI Search
// ─────────────────────────────────────────────────────────────

const DEFAULT_IMAGE = unsplashUrl(HERO_IMAGE, 1200)!;

export function pageMeta(opts: {
  title: string;
  description: string;
  image?: string | null;
  path?: string; // canonical path เช่น "/plants"
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const img = opts.image ?? DEFAULT_IMAGE;
  return {
    title: opts.title,
    description: opts.description,
    ...(opts.path ? { alternates: { canonical: `${SITE_URL}${opts.path}` } } : {}),
    openGraph: {
      title: opts.title,
      description: opts.description,
      type: opts.type ?? "website",
      images: [{ url: img, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [img],
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// เมตาสำหรับหน้าหมวด (ใช้รูปของหมวดนั้นเป็น feature image)
export function categoryMeta(
  slug: string,
  title: string,
  description: string,
): Metadata {
  return pageMeta({
    title,
    description,
    image: imageFor(slug, 1200),
    path: `/${slug}`,
  });
}
