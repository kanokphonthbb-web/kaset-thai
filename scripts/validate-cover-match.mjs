// validate-cover-match.mjs — cover/content-image topical-match validator.
//
// Rule: if an article's slug matches a KEYWORD_IMAGE_POOLS key, or (for cost-profit articles)
// its title matches a COST_PROFIT_TITLE_POOLS key, its coverImage AND every in-body content
// image MUST be one of that narrow pool's URLs — never a generic category-pool image. This is
// the structural, always-checkable half of "the image must match the content": we can't verify
// pixel content without vision, but we CAN guarantee a durian article never gets a random
// "plants" category photo when a durian-specific pool exists.
//
// Usage:
//   npx tsx scripts/validate-cover-match.mjs                 # audit only, no writes
//   npx tsx scripts/validate-cover-match.mjs --fix            # reassign mismatched covers to a
//                                                              # topical pool image and write it
//   npx tsx scripts/validate-cover-match.mjs --slug=<slug>    # check/fix a single article
//
// Import this module's `checkArticle()` from any pre-publish gate to fail loud before an
// article with a mismatched cover/content image ever reaches the DB.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { KEYWORD_IMAGE_POOLS, COST_PROFIT_TITLE_POOLS, matchKeywordPool, matchTitlePool } from "./publish-batch.mts";

function loadEnv() {
  const t = readFileSync(new URL("../.env.vercel", import.meta.url), "utf8");
  const e = {};
  for (const l of t.split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) e[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return e;
}

function toCoverUrl(entry) {
  return entry.startsWith("http") ? entry : `https://images.unsplash.com/photo-${entry}?auto=format&fit=crop&w=1400&q=70`;
}

/** Returns null if no narrow pool applies (nothing to check structurally) or an object describing the mismatch. */
export function checkArticle({ slug, title, catSlug, coverImage, contentImageUrls = [] }) {
  const narrowPool = matchKeywordPool(slug) || (catSlug === "cost-profit" ? matchTitlePool(title || "") : undefined);
  if (!narrowPool || narrowPool.length === 0) return null; // no topical pool defined for this article — nothing to enforce

  const narrowUrls = new Set(narrowPool.map(toCoverUrl));
  const coverMismatch = coverImage && !narrowUrls.has(coverImage);
  const mismatchedContentImages = contentImageUrls.filter((u) => u && !narrowUrls.has(u));
  if (!coverMismatch && mismatchedContentImages.length === 0) return null;

  return {
    slug,
    narrowPoolUrls: [...narrowUrls],
    coverImage,
    coverMismatch,
    mismatchedContentImages,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix");
  const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

  const env = loadEnv();
  const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

  const rows = await db.execute({
    sql: `SELECT a.id, a.slug, a.title, a.coverImage, a.content, c.slug as catSlug
          FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id
          WHERE a.status='published' ${slugArg ? "AND a.slug=?" : ""}`,
    args: slugArg ? [slugArg] : [],
  });

  const mismatches = [];
  for (const r of rows.rows) {
    const slug = String(r.slug);
    const title = String(r.title || "");
    const catSlug = r.catSlug ? String(r.catSlug) : undefined;
    const coverImage = String(r.coverImage || "");
    const content = String(r.content || "");
    const contentImageUrls = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);

    const result = checkArticle({ slug, title, catSlug, coverImage, contentImageUrls });
    if (result) mismatches.push({ ...result, id: r.id, catSlug });
  }

  console.log(`Checked ${rows.rows.length} published articles (structural topical-pool check only).`);
  console.log(`Mismatches found: ${mismatches.length}`);

  if (mismatches.length === 0) {
    console.log("PASS — no topical-pool mismatches.");
    return;
  }

  for (const m of mismatches) {
    console.log(`  X ${m.slug} (cat=${m.catSlug})`);
    if (m.coverMismatch) console.log(`      cover: ${m.coverImage}  -> should be one of: ${m.narrowPoolUrls.join(", ")}`);
    if (m.mismatchedContentImages.length) console.log(`      ${m.mismatchedContentImages.length} in-body image(s) not from topical pool`);
  }

  if (!fix) {
    console.log("\nRun with --fix to reassign covers to a topical-pool image (in-body images not auto-fixed, cover only).");
    process.exitCode = mismatches.length > 0 ? 1 : 0;
    return;
  }

  console.log("\nApplying fixes (cover only)...");
  let fixed = 0;
  for (const m of mismatches) {
    if (!m.coverMismatch) continue;
    let hash = 0;
    for (const ch of m.slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const newUrl = m.narrowPoolUrls[hash % m.narrowPoolUrls.length];
    await db.execute({ sql: `UPDATE Article SET coverImage=? WHERE id=?`, args: [newUrl, m.id] });
    console.log(`  fixed ${m.slug}: -> ${newUrl}`);
    fixed++;
  }
  console.log(`\nFixed ${fixed} cover(s). In-body content images were NOT auto-fixed (would require re-running content-image insertion against article HTML) — flagged above for manual/agent follow-up if any.`);
}

main();
