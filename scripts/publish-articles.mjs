// Publish บทความที่เขียนเสร็จแล้วขึ้น DB (Turso ถ้ามี TURSO_DATABASE_URL, ไม่งั้น SQLite)
//
// วิธีใช้:
//   1) เขียนไฟล์ JSON หนึ่งไฟล์ต่อหนึ่งบทความไว้ใน data/written/<slug>.json
//      รูปแบบ (ดู scripts/article.schema.json):
//      {
//        "slug": "plants-how-to-grow-rice-jasmine",   // ต้องตรงกับ backlog ใน content-map
//        "seoTitle": "…" ,                              // ≤ 60 ตัวอักษร (ไม่ใส่ = ใช้ title เดิม)
//        "metaDescription": "…",                        // 150–160 ตัวอักษร
//        "focusKeyword": "วิธีปลูกข้าวหอมมะลิ",
//        "coverImage": "https://images.unsplash.com/…", // URL เต็ม (ว่างได้ = ใช้รูปหมวด)
//        "content": "<p>…HTML เต็มบทความ…</p>",          // ต้องมี H2/H3 มี id ได้ (สร้าง TOC อัตโนมัติ)
//        "faqs": [{ "q": "…", "a": "…" }]               // ≥ 5 ข้อ (ไปเป็น FAQPage schema)
//      }
//   2) รัน:  node scripts/publish-articles.mjs
//      ตัวเลือก:  --dir=data/written   --dry (เช็คอย่างเดียว ไม่เขียน)   --draft (บันทึกแต่ไม่เผยแพร่)
//
// สคริปต์นี้ "อัปเดต" บทความที่มีอยู่แล้วใน backlog (match ด้วย slug) แล้วตั้ง status=published
// ถ้าไม่พบ slug ใน DB จะข้ามและเตือน (กันสร้าง slug หลุดจากแผน content-map)

import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const flag = (name) => args.includes(`--${name}`);

const DIR = resolve(ROOT, opt("dir", "data/written"));
const DRY = flag("dry");
const AS_DRAFT = flag("draft");

async function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log("DB: Turso/libSQL (production)");
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  console.log("DB: local SQLite (dev)  — ตั้ง TURSO_DATABASE_URL เพื่อ publish ขึ้น production");
  return new PrismaClient();
}

// ---- ตรวจคุณภาพขั้นต่ำก่อน publish (กัน thin/พังโครง) ----
function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}
function validate(a, file) {
  const errs = [];
  if (!a.slug) errs.push("ไม่มี slug");
  if (!a.content || a.content.length < 50) errs.push("ไม่มี content");
  const text = stripTags(a.content || "");
  // นับคำแบบไทย+อังกฤษ: ตัดด้วยช่องว่าง (ไทยไม่เว้นวรรค → ใช้จำนวนตัวอักษรเสริม)
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  if (chars < 1200) errs.push(`เนื้อหาสั้นเกินไป (~${chars} ตัวอักษร, ควร ≥ 1200)`);
  const h2 = (a.content.match(/<h2/gi) || []).length;
  if (h2 < 2) errs.push(`มี H2 น้อย (${h2}) — ต้อง ≥ 2`);
  if (!Array.isArray(a.faqs) || a.faqs.length < 5) errs.push(`FAQ < 5 (${a.faqs?.length || 0})`);
  if (!a.metaDescription || a.metaDescription.length < 80) errs.push("metaDescription สั้น/ว่าง (ควร 150–160)");
  return { errs, words, chars, h2 };
}

const prisma = await makePrisma();

let files = [];
try {
  files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
} catch {
  console.error(`ไม่พบโฟลเดอร์ ${DIR} — สร้างไฟล์บทความ (.json) ไว้ที่นี่ก่อน`);
  process.exit(1);
}
console.log(`พบไฟล์บทความ ${files.length} ไฟล์ใน ${DIR}${DRY ? "  [DRY RUN]" : ""}${AS_DRAFT ? "  [DRAFT]" : ""}\n`);

let published = 0, skipped = 0, failed = 0;
for (const f of files) {
  let a;
  try {
    a = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  } catch (e) {
    console.error(`✗ ${f}: JSON พัง — ${e.message}`);
    failed++;
    continue;
  }
  const { errs, chars, h2 } = validate(a, f);
  if (errs.length) {
    console.error(`✗ ${a.slug || f}: ${errs.join(" | ")}`);
    failed++;
    continue;
  }
  const existing = await prisma.article.findUnique({ where: { slug: a.slug }, select: { id: true, title: true } });
  if (!existing) {
    console.warn(`- ${a.slug}: ไม่พบใน backlog (ข้าม — slug ต้องมาจาก content-map)`);
    skipped++;
    continue;
  }
  if (DRY) {
    console.log(`✓ ${a.slug}  (${chars} ตัวอักษร, H2×${h2}, FAQ×${a.faqs.length})  [dry]`);
    published++;
    continue;
  }
  const data = {
    content: a.content,
    format: "html",
    faqJson: JSON.stringify(a.faqs),
    seoTitle: a.seoTitle || existing.title,
    metaDescription: a.metaDescription,
    focusKeyword: a.focusKeyword || "",
    excerpt: a.excerpt || a.metaDescription.slice(0, 200),
    ...(a.coverImage ? { coverImage: a.coverImage } : {}),
    ...(AS_DRAFT
      ? { status: "draft" }
      : { status: "published", publishedAt: new Date() }),
  };
  try {
    await prisma.article.update({ where: { slug: a.slug }, data });
    console.log(`✓ ${a.slug}  (${chars} ตัวอักษร, H2×${h2}, FAQ×${a.faqs.length})${AS_DRAFT ? " [draft]" : " → published"}`);
    published++;
  } catch (e) {
    console.error(`✗ ${a.slug}: บันทึกไม่ได้ — ${e.message}`);
    failed++;
  }
}

console.log(`\nสรุป: publish ${published} | ข้าม ${skipped} | ล้มเหลว ${failed}`);
console.log("ยอดในระบบ — published:", await prisma.article.count({ where: { status: "published" } }),
            "| draft:", await prisma.article.count({ where: { status: "draft" } }));
await prisma.$disconnect();
