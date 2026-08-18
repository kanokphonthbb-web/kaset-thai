import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORIES, TOOLS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { getAllStarterKits } from "@/lib/starterKits";
import { REDIRECTED_ARTICLE_SLUGS } from "@/lib/articleSeoRules.mjs";
import { getAllProducts, isProductIndexable } from "@/lib/products";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";
import { PROVINCES } from "@/lib/weather/locations";

// Cache the generated sitemap instead of querying Turso on every crawler hit.
// CMS/product updatedAt values remain the source of truth for dynamic entries.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/tools",
    "/blog",
    "/products",
    "/prices",
    "/weather",
    "/farm-dashboard",
    "/data-sources",
    "/data-methodology",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/weather" || path === "/prices" ? 0.8 : 0.7,
  }));

  // หน้าอากาศรายจังหวัด — พยากรณ์สด + บริบทเกษตร (unique value ต่อจังหวัด)
  const weatherProvinceRoutes = PROVINCES.map((p) => ({
    url: `${SITE_URL}/weather/${p.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
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

  const productCategoryRoutes = PRODUCT_CATEGORIES.map((category) => ({
    url: `${SITE_URL}/products/category/${category.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
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
      where: {
        status: "published",
        slug: { notIn: [...REDIRECTED_ARTICLE_SLUGS] },
      },
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
    const products = (await getAllProducts()).filter(isProductIndexable);
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
    ...weatherProvinceRoutes,
    ...categoryRoutes,
    ...toolRoutes,
    ...productCategoryRoutes,
    ...starterKitRoutes,
    ...staticArticleRoutes,
    ...cmsArticleRoutes,
    ...productRoutes,
  ];
  const seen = new Set<string>();
  return all.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
}
