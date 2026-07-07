// นำเข้า content map 1,000 บทความเข้า DB เป็น draft (backlog เขียนต่อใน /admin)
// รองรับ Turso ถ้ามี TURSO_DATABASE_URL, ไม่งั้นใช้ SQLite ไฟล์
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

async function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    const libsql = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}

const TYPE_MAP = {
  "Pillar Guide": "howto", "How-to": "howto", "How-To": "howto", "Step-by-step": "howto",
  "Comparison": "deep", "Deep Dive": "deep", "Ultimate Guide": "deep",
  "Listicle": "general", "Guide": "general", "Explainer": "general",
  "FAQ": "qa", "News": "qa", "Q&A": "qa",
};
const catName = {
  plants: "ปลูกพืช", animals: "เลี้ยงสัตว์", fishery: "ประมง",
  "mixed-farming": "เกษตรผสมผสาน", "soil-water-fertilizer": "ดิน น้ำ ปุ๋ย",
  diseases: "โรคและการดูแล", "cost-profit": "ต้นทุนและกำไร", market: "ตลาดและการขาย",
  "agri-tech-tools": "เทคโนโลยีและเครื่องมือ", "agri-news-law-standards": "ข่าว กฎหมาย มาตรฐาน",
};

const prisma = await makePrisma();
const items = JSON.parse(readFileSync(new URL("../data/content-map.json", import.meta.url), "utf8"));

// 1) ensure 10 categories
const catId = {};
for (const [slug, name] of Object.entries(catName)) {
  const c = await prisma.articleCategory.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  catId[slug] = c.id;
}

// 2) slugs ที่มีอยู่แล้ว (กันทับบทความที่เขียน/เผยแพร่ไปแล้ว)
const existing = new Set((await prisma.article.findMany({ select: { slug: true } })).map((a) => a.slug));

let created = 0, updated = 0;
for (const a of items) {
  const brief = JSON.stringify({
    cluster: a.cluster, intent: a.intent, audience: a.audience, type: a.type,
    angle: a.angle, mustInclude: a.mustInclude, sources: a.sources,
    internalLinks: a.internalLinks, instruction: a.instruction,
  });
  const base = {
    phase: a.phase, priority: a.priority, subcategory: a.sub, brief,
    focusKeyword: a.keyword,
    metaDescription: (a.angle || a.title).slice(0, 160),
    articleType: TYPE_MAP[a.type] || "howto",
    categoryId: catId[a.catSlug] ?? null,
  };
  if (existing.has(a.slug)) {
    // อัปเดตเฉพาะข้อมูล brief/backlog ไม่แตะ content/status
    await prisma.article.update({ where: { slug: a.slug }, data: base });
    updated++;
  } else {
    await prisma.article.create({
      data: {
        ...base,
        title: a.title,
        slug: a.slug,
        excerpt: (a.angle || "").slice(0, 200),
        status: "draft",
      },
    });
    created++;
  }
  if ((created + updated) % 100 === 0) console.log(`  ...${created + updated}/${items.length}`);
}
console.log(`done: created ${created}, updated ${updated}, categories ${Object.keys(catId).length}`);
console.log("total articles:", await prisma.article.count());
await prisma.$disconnect();
