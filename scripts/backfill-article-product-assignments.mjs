// Backfill articleNo + productsJson on existing Article rows by matching against the
// affiliate-v2 article-product-map (10,000 source-workbook rows), and rebuild each
// assigned Product's relatedArticlesJson reverse index.
//
// Join key: EXACT article title match only. Both the map (10,000 rows) and the live
// Article table were checked for slug overlap first (0% hit — this site's Phase 1/2/3
// pipeline uses its own independent slug convention, unrelated to the source workbook's
// suggested slugs) and for fuzzy/normalized title overlap (found real false-positive risk:
// many near-duplicate rice/crop titles differ only in phrasing, e.g. "ปฏิทินปลูกข้าวหอมมะลิ:
// ช่วงปลูก เก็บเกี่ยว..." vs the map's "ปฏิทินข้าวหอมมะลิ: งานที่ต้องทำรายเดือน..." — genuinely
// different articles, not the same one written differently). Exact title match is the only
// zero-false-positive rule available, so unmatched rows are left alone (still covered by the
// existing generic findMatchingProducts/injectProductLinks fallback) rather than guessed.
//
// Usage: node scripts/backfill-article-product-assignments.mjs [--dry]
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");

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

const prisma = await makePrisma();
const map = JSON.parse(
  readFileSync(path.join(ROOT, "data/affiliate-v2/article-product-map.json"), "utf8")
);

const byTitle = new Map();
for (const e of map.articles) byTitle.set(e.article_title, e);

const products = await prisma.product.findMany({
  select: { id: true, shopeeId: true, slug: true, status: true },
});
const activeByShopeeId = new Map(products.filter((p) => p.shopeeId && p.status === "active").map((p) => [p.shopeeId, p]));

const articles = await prisma.article.findMany({
  select: { id: true, title: true, slug: true, status: true, articleNo: true, productsJson: true },
});

// Title is only a safe join key when it's unique within the local Article table. This DB
// has 147 pre-existing title collisions (same title, different slug — an existing content
// issue, not introduced by this script), so matching by title alone would non-deterministically
// pick one of several distinct articles. Skip those rather than guessing.
const titleCounts = new Map();
for (const a of articles) titleCounts.set(a.title, (titleCounts.get(a.title) || 0) + 1);

let alreadyBackfilled = 0;
let matched = 0;
let unmatched = 0;
let skippedAmbiguousTitle = 0;
let errorMissingProduct = 0;
const errors = [];
const relatedArticles = new Map(); // shopeeId -> Set<article slug> (published only)

const writes = [];
const usedArticleNos = new Set(articles.filter((a) => a.articleNo != null).map((a) => String(a.articleNo)));

for (const a of articles) {
  if (a.articleNo != null) {
    alreadyBackfilled++;
    // Still contribute to the reverse index if published.
    if (a.status === "published") {
      try {
        for (const id of JSON.parse(a.productsJson || "[]")) {
          if (!relatedArticles.has(id)) relatedArticles.set(id, new Set());
          relatedArticles.get(id).add(a.slug);
        }
      } catch {
        // ignore malformed productsJson on already-backfilled rows
      }
    }
    continue;
  }

  if (titleCounts.get(a.title) > 1) {
    skippedAmbiguousTitle++;
    continue;
  }

  const entry = byTitle.get(a.title);
  if (!entry) {
    unmatched++;
    continue;
  }
  if (usedArticleNos.has(String(entry.article_no))) {
    // Defensive: should be unreachable now that map titles are globally unique and DB
    // duplicate titles are filtered above, but never risk a UNIQUE constraint crash mid-run.
    skippedAmbiguousTitle++;
    continue;
  }

  const shopeeIds = [];
  let missing = false;
  for (const p of entry.products) {
    const prod = activeByShopeeId.get(p.id);
    if (!prod) {
      missing = true;
      break;
    }
    shopeeIds.push(prod.shopeeId);
  }
  if (missing) {
    errorMissingProduct++;
    errors.push({ articleId: a.id, title: a.title, article_no: entry.article_no });
    continue;
  }

  matched++;
  writes.push({ id: a.id, articleNo: Number(entry.article_no), productsJson: JSON.stringify(shopeeIds) });
  usedArticleNos.add(String(entry.article_no));
  if (a.status === "published") {
    for (const id of shopeeIds) {
      if (!relatedArticles.has(id)) relatedArticles.set(id, new Set());
      relatedArticles.get(id).add(a.slug);
    }
  }
}

console.log(`Articles total: ${articles.length}`);
console.log(`already backfilled (skipped, idempotent): ${alreadyBackfilled}`);
console.log(`matched (to be written): ${matched}`);
console.log(`unmatched (left on generic fallback system): ${unmatched}`);
console.log(`skipped (ambiguous duplicate title in DB): ${skippedAmbiguousTitle}`);
console.log(`errors (map entry references a missing/held product): ${errorMissingProduct}`);
if (errors.length > 0) {
  console.log("error samples:", JSON.stringify(errors.slice(0, 10), null, 2));
}
console.log(`Products to receive a relatedArticlesJson update: ${relatedArticles.size}`);

if (DRY) {
  console.log("\n(dry run — no writes performed)");
  await prisma.$disconnect();
  process.exit(0);
}

for (const w of writes) {
  await prisma.article.update({ where: { id: w.id }, data: { articleNo: w.articleNo, productsJson: w.productsJson } });
}

let relatedUpdated = 0;
for (const [shopeeId, slugSet] of relatedArticles) {
  const prod = activeByShopeeId.get(shopeeId);
  if (!prod) continue;
  const slugs = [...slugSet].slice(0, 6);
  await prisma.product.update({ where: { id: prod.id }, data: { relatedArticlesJson: JSON.stringify(slugs) } });
  relatedUpdated++;
}

console.log(`\nWrote articleNo/productsJson for ${writes.length} articles.`);
console.log(`Updated relatedArticlesJson for ${relatedUpdated} products.`);
await prisma.$disconnect();
