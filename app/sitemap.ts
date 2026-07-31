import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORIES, TOOLS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { getAllStarterKits } from "@/lib/starterKits";

// Cache the generated sitemap instead of querying Turso on every crawler hit.
// CMS/product updatedAt values remain the source of truth for dynamic entries.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/about", "/tools", "/blog", "/products"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryRoutes = CATEGORIES.filter((c) => c.href.startsWith("/")).map((c) => ({
    url: `${SITE_URL}${c.href.split("#")[0]}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const toolRoutes = TOOLS.map((t) => ({
    url: `${SITE_URL}${t.href}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const starterKitRoutes = getAllStarterKits().map((kit) => ({
    url: `${SITE_URL}/tools/starter-kits/${encodeURIComponent(kit.kitId)}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticArticleRoutes = ARTICLES.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // บทความจากระบบหลังบ้าน (CMS) ที่เผยแพร่แล้ว
  let cmsArticleRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.article.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    });
    cmsArticleRoutes = posts.map((p) => ({
      url: `${SITE_URL}/articles/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    cmsArticleRoutes = [];
  }

  // สินค้าเพื่อการเกษตร (affiliate) — เฉพาะที่ status active เท่านั้น (held ไม่รวม)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.map((p) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    productRoutes = [];
  }

  const all = [
    ...staticRoutes,
    ...categoryRoutes,
    ...toolRoutes,
    ...starterKitRoutes,
    ...staticArticleRoutes,
    ...cmsArticleRoutes,
    ...productRoutes,
  ];
  const seen = new Set<string>();
  return all.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
}
