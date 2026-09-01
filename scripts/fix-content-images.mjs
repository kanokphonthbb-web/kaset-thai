// fix-content-images.mjs — replaces mismatched in-body <img> illustrations with topical-pool
// images, for articles that validate-cover-match.mjs flagged as having a defined narrow pool
// (keyword/title match) but content images drawn from the generic category pool instead.
// Cover image is handled separately by validate-cover-match.mjs --fix; this script only rewrites
// <img src="..."> occurrences inside the article HTML, nothing else about the content changes.
//
// Usage:
//   npx tsx scripts/fix-content-images.mjs             # audit + fix all mismatched articles
//   npx tsx scripts/fix-content-images.mjs --slug=<s>   # single article
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { matchKeywordPool, matchTitlePool } from "./publish-batch.mts";

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

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

  const env = loadEnv();
  const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

  const rows = await db.execute({
    sql: `SELECT a.id, a.slug, a.title, a.coverImage, a.content, c.slug as catSlug
          FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id
          WHERE a.status='published' ${slugArg ? "AND a.slug=?" : ""}`,
    args: slugArg ? [slugArg] : [],
  });

  let checked = 0, fixedArticles = 0, fixedImages = 0, skippedNoPool = 0;
  for (const r of rows.rows) {
    checked++;
    const slug = String(r.slug);
    const title = String(r.title || "");
    const catSlug = r.catSlug ? String(r.catSlug) : undefined;
    const coverImage = String(r.coverImage || "");
    let content = String(r.content || "");

    const narrowPool = matchKeywordPool(slug) || (catSlug === "cost-profit" ? matchTitlePool(title) : undefined);
    if (!narrowPool || narrowPool.length === 0) { skippedNoPool++; continue; }

    const narrowUrls = [...new Set(narrowPool.map(toCoverUrl))];
    const narrowSet = new Set(narrowUrls);

    const imgMatches = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)];
    const mismatched = imgMatches.map((m) => m[1]).filter((u) => u && u !== coverImage && !narrowSet.has(u));
    if (mismatched.length === 0) continue;

    // rotate through the narrow pool per-article (slug-hashed start) so a 5-article cluster
    // sharing one narrow pool doesn't all pick the same single image
    let hash = 0;
    for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    let idx = hash % narrowUrls.length;

    let newContent = content;
    let changedHere = 0;
    for (const oldUrl of new Set(mismatched)) {
      const newUrl = narrowUrls[idx % narrowUrls.length];
      idx++;
      const before = newContent;
      newContent = newContent.split(`src="${oldUrl}"`).join(`src="${newUrl}"`);
      if (newContent !== before) changedHere++;
    }
    if (changedHere === 0) continue;

    await db.execute({ sql: `UPDATE Article SET content=? WHERE id=?`, args: [newContent, r.id] });
    fixedArticles++;
    fixedImages += changedHere;
    console.log(`  fixed ${slug}: ${changedHere} image(s) reassigned to topical pool`);
  }

  console.log(`\nChecked ${checked} published articles.`);
  console.log(`Skipped (no topical pool defined): ${skippedNoPool}`);
  console.log(`Articles with content images fixed: ${fixedArticles}`);
  console.log(`Total in-body images reassigned: ${fixedImages}`);
}

main();
