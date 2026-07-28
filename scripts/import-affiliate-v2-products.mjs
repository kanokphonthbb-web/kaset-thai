// นำเข้า Shopee Affiliate catalog v2 เข้า Product table (idempotent, dry-run capable)
// Usage: node scripts/import-affiliate-v2-products.mjs [--dry]
//
// Match priority: shopeeId (already-imported) -> exact affiliateLink (prior catalog overlap) -> create new.
// Non-negotiable: only https://s.shopee.co.th/... affiliate_url values are ever written. Anything else is
// skipped and reported as an error, never published, never falls back to image_url or a guessed link.
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");
const SHOPEE_URL_RE = /^https:\/\/s\.shopee\.co\.th\//;
const IMAGE_DEST_DIR = path.join(ROOT, "public", "images", "products");

const CATEGORY_MAP = {
  "ประมง / สัตว์น้ำ": "fishery",
  "ปลูกพืช": "plants",
  "ต้นทุน กำไร บัญชีฟาร์ม": "cost-profit",
  "ข่าวสาร กฎหมาย หน่วยงาน และมาตรฐาน": "agri-news-law-standards",
  "เทคโนโลยี อุปกรณ์ และเครื่องมือ": "agri-tech-tools",
  "ตลาด แปรรูป และการขาย": "market",
  "เกษตรผสมผสาน / จัดการฟาร์ม": "mixed-farming",
  "โรคและการดูแล": "diseases",
  "เลี้ยงสัตว์ / ปศุสัตว์": "animals",
  "ดิน น้ำ ปุ๋ย": "soil-water-fertilizer",
};

async function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}

function dedupe(arr) {
  return [...new Set(arr.filter(Boolean).map((s) => String(s).trim()).filter(Boolean))];
}

function extractNumericPrice(label) {
  if (!label) return "";
  const m = String(label).replace(/,/g, "").match(/[\d.]+/);
  return m ? m[0] : "";
}

const prisma = await makePrisma();
const catalog = JSON.parse(
  readFileSync(path.join(ROOT, "data/affiliate-v2/products-affiliate-only-v2.json"), "utf8")
);

console.log(`Catalog: ${catalog.products.length} products (${DRY ? "DRY RUN" : "LIVE"})`);

if (!DRY) mkdirSync(IMAGE_DEST_DIR, { recursive: true });

const existingByShopeeId = new Map();
const existingByAffiliateLink = new Map();
for (const row of await prisma.product.findMany()) {
  if (row.shopeeId) existingByShopeeId.set(row.shopeeId, row);
  existingByAffiliateLink.set(row.affiliateLink, row);
}

let created = 0;
let updated = 0;
let unchanged = 0;
let skippedInvalidUrl = 0;
let skippedMissingImage = 0;
let heldCount = 0;
const errors = [];

for (const p of catalog.products) {
  // Non-negotiable allowlist rule: reject anything not an exact s.shopee.co.th catalog URL.
  if (!p.affiliate_url || !SHOPEE_URL_RE.test(p.affiliate_url)) {
    skippedInvalidUrl++;
    errors.push({ id: p.id, title: p.title, reason: "invalid_affiliate_url", affiliate_url: p.affiliate_url });
    continue;
  }

  const status = p.needs_manual_review ? "held" : "active";
  if (status === "held") heldCount++;

  const srcImage = p.image_file;
  const destImage = path.join(IMAGE_DEST_DIR, `${p.id}.webp`);
  if (!srcImage || !existsSync(srcImage)) {
    skippedMissingImage++;
    errors.push({ id: p.id, title: p.title, reason: "missing_source_image", image_file: srcImage });
    continue;
  }

  const category = CATEGORY_MAP[p.category] || "";
  const keywords = dedupe([...(p.primary_keywords || []), ...(p.keywords || []), ...(p.core_topics || [])]);
  const useCases = dedupe(p.core_topics || []);
  const priceLabel = extractNumericPrice(p.price_label);
  const priceCheckedAt = p.checked_at ? new Date(p.checked_at) : null;
  const safetyNote = p.regulated_or_high_risk
    ? "สินค้านี้อยู่ในกลุ่มที่ควรตรวจสอบข้อกำหนดด้านความปลอดภัย/กฎหมายก่อนใช้งาน"
    : "";
  const localImageUrl = `/images/products/${p.id}.webp`;

  const existing = existingByShopeeId.get(p.id) || existingByAffiliateLink.get(p.affiliate_url);

  if (!existing) {
    if (!DRY) {
      copyFileSync(srcImage, destImage);
      await prisma.product.create({
        data: {
          slug: `product-${p.id}`,
          name: p.title,
          imageUrl: localImageUrl,
          affiliateLink: p.affiliate_url,
          category,
          keywords: JSON.stringify(keywords),
          whyNeeded: p.description || "",
          benefits: "[]",
          usage: "",
          shopeeId: p.id,
          status,
          howToChoose: "",
          useCasesJson: JSON.stringify(useCases),
          safetyNote,
          priceLabel,
          priceCheckedAt,
          relatedArticlesJson: "[]",
        },
      });
    }
    created++;
    continue;
  }

  // Update: only backfill genuinely-empty fields + refresh the fields that are meant to be
  // refreshed on every run (price, status, image, shopeeId). Never touch existing editorial
  // copy (whyNeeded/benefits/usage) or the public slug once a product row exists.
  const data = {};
  if (!existing.shopeeId) data.shopeeId = p.id;
  if (existing.status !== status) data.status = status;
  if (existing.imageUrl !== localImageUrl) data.imageUrl = localImageUrl;
  if (!existing.category) data.category = category;
  if (existing.keywords === "[]" || !existing.keywords) data.keywords = JSON.stringify(keywords);
  if (!existing.whyNeeded) data.whyNeeded = p.description || "";
  if (existing.useCasesJson === "[]" || !existing.useCasesJson) data.useCasesJson = JSON.stringify(useCases);
  if (!existing.safetyNote && safetyNote) data.safetyNote = safetyNote;
  if (existing.priceLabel !== priceLabel) {
    data.priceLabel = priceLabel;
    if (priceCheckedAt) data.priceCheckedAt = priceCheckedAt;
  }

  if (Object.keys(data).length === 0) {
    unchanged++;
    continue;
  }

  if (!DRY) {
    copyFileSync(srcImage, destImage);
    await prisma.product.update({ where: { id: existing.id }, data });
  }
  updated++;
}

console.log("---");
console.log(`created:        ${created}`);
console.log(`updated:        ${updated}`);
console.log(`unchanged:      ${unchanged}`);
console.log(`held (status):  ${heldCount}`);
console.log(`skipped (bad url):    ${skippedInvalidUrl}`);
console.log(`skipped (no image):   ${skippedMissingImage}`);
console.log(`total processed: ${catalog.products.length}`);
if (errors.length > 0) {
  console.log(`\n${errors.length} errors:`);
  for (const e of errors.slice(0, 20)) console.log("  ", JSON.stringify(e));
  if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
}
if (!DRY) console.log("\nFinal Product count:", await prisma.product.count());
await prisma.$disconnect();
