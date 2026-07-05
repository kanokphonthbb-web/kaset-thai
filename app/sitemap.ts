import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORIES, TOOLS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = ["", "/about", "/tools", "/blog", "/search"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryRoutes = CATEGORIES.filter((c) => c.href.startsWith("/")).map((c) => ({
    url: `${SITE_URL}${c.href.split("#")[0]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const toolRoutes = TOOLS.map((t) => ({
    url: `${SITE_URL}${t.href}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticArticleRoutes = ARTICLES.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: now,
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

  const all = [
    ...staticRoutes,
    ...categoryRoutes,
    ...toolRoutes,
    ...staticArticleRoutes,
    ...cmsArticleRoutes,
  ];
  const seen = new Set<string>();
  return all.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
}
