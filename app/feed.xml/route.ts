import { ARTICLES } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  type Item = { title: string; slug: string; desc: string; date: Date };

  const staticItems: Item[] = ARTICLES.map((a) => ({
    title: a.title,
    slug: a.slug,
    desc: a.description,
    date: new Date(),
  }));

  let cmsItems: Item[] = [];
  try {
    const posts = await prisma.article.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, excerpt: true, publishedAt: true, updatedAt: true },
    });
    cmsItems = posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      desc: p.excerpt,
      date: p.publishedAt ?? p.updatedAt,
    }));
  } catch {
    cmsItems = [];
  }

  const items = [...cmsItems, ...staticItems]
    .map(
      (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${SITE_URL}/articles/${encodeURIComponent(it.slug)}</link>
      <guid>${SITE_URL}/articles/${encodeURIComponent(it.slug)}</guid>
      <description>${esc(it.desc)}</description>
      <pubDate>${it.date.toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>เกษตรกรไทย — คลังความรู้เกษตร</title>
    <link>${SITE_URL}</link>
    <description>บทความความรู้เกษตรไทย ปลูกพืช เลี้ยงสัตว์ ประมง ต้นทุนกำไร</description>
    <language>th</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
