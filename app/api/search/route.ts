import { NextResponse } from "next/server";
import { searchContent, type SearchResult } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  // 1) เนื้อหา static (หมวด/บทความ/เครื่องมือ/โรค/พืช)
  const staticResults = searchContent(q);

  // 2) บทความจากระบบหลังบ้าน (CMS) ที่เผยแพร่แล้ว
  let cmsResults: SearchResult[] = [];
  try {
    const posts = await prisma.article.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { content: { contains: q } },
          { focusKeyword: { contains: q } },
          { metaDescription: { contains: q } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: { title: true, slug: true, excerpt: true },
    });
    cmsResults = posts.map((p) => ({
      type: "บทความ" as const,
      title: p.title,
      description: p.excerpt,
      href: `/articles/${p.slug}`,
      icon: "📝",
    }));
  } catch {
    cmsResults = [];
  }

  // รวม + ตัดซ้ำตาม href (บทความ CMS มาก่อน static ที่ href เดียวกัน)
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const r of [...cmsResults, ...staticResults]) {
    if (seen.has(r.href + r.title)) continue;
    seen.add(r.href + r.title);
    results.push(r);
  }

  return NextResponse.json({ results });
}
