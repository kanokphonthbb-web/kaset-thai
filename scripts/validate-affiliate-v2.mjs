import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "affiliate-v2");
const REPORT_PATH = path.join(DATA_DIR, "validation-report.json");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
}

function normalizeId(value) {
  if (typeof value === "number") return String(Math.trunc(value));
  return String(value ?? "").trim().replace(/\.0$/, "");
}

function addCheck(checks, name, actual, expected, ok, details = undefined) {
  checks.push({ name, ok: Boolean(ok), actual, expected, ...(details ? { details } : {}) });
}

function duplicateValues(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

function validImageHeader(file) {
  const fd = fs.openSync(file, "r");
  try {
    const header = Buffer.alloc(12);
    const bytes = fs.readSync(fd, header, 0, header.length, 0);
    if (bytes < 3) return false;
    const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const png = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
    return jpeg || png || webp;
  } finally {
    fs.closeSync(fd);
  }
}

const checks = [];
const failures = [];

try {
  const source = readJson("source-workbook.json");
  const catalogRoot = readJson("products-affiliate-only-v2.json");
  const mappingRoot = readJson("article-product-map.json");
  const queryResults = readJson("query-results-v2.json");
  const coverage = readJson("coverage-summary.json");
  const manualRoot = readJson("manual-review-products.json");
  const mainState = readJson("browser-state.json");
  const fallbackState = readJson("browser-state-fallback.json");
  const fallback2State = readJson("browser-state-fallback2.json");

  const sourceSheet = source.sheets?.find((sheet) => sheet.name === "Content Map 10000");
  const sourceValues = sourceSheet?.values ?? [];
  const headers = sourceValues[0] ?? [];
  const sourceRows = sourceValues.slice(1);
  const col = Object.fromEntries(headers.map((header, index) => [header, index]));
  const sourceIds = sourceRows.map((row) => normalizeId(row[col["No."]]));
  const sourceSlugs = sourceRows.map((row) => String(row[col["Suggested URL Slug"]] ?? "").trim());
  const sourceClusters = new Set(sourceRows.map((row) => String(row[col["Content Cluster"]] ?? "").trim()).filter(Boolean));

  addCheck(checks, "source_rows", sourceRows.length, 10000, sourceRows.length === 10000);
  addCheck(checks, "source_unique_article_ids", new Set(sourceIds).size, 10000, new Set(sourceIds).size === 10000, { duplicates: duplicateValues(sourceIds).slice(0, 20) });
  addCheck(checks, "source_unique_article_slugs", new Set(sourceSlugs).size, 8590, new Set(sourceSlugs).size === 8590, { duplicate_rows: sourceSlugs.length - new Set(sourceSlugs).size, duplicate_examples: duplicateValues(sourceSlugs).slice(0, 20) });
  addCheck(checks, "source_duplicate_slug_rows_to_resolve", sourceSlugs.length - new Set(sourceSlugs).size, 1410, sourceSlugs.length - new Set(sourceSlugs).size === 1410);
  addCheck(checks, "source_content_clusters", sourceClusters.size, 198, sourceClusters.size === 198);

  const products = Array.isArray(catalogRoot.products) ? catalogRoot.products : [];
  const productIds = products.map((product) => String(product.id));
  const affiliateUrls = products.map((product) => String(product.affiliate_url ?? ""));
  const imageFiles = products.map((product) => String(product.image_file ?? ""));
  const heldProducts = products.filter((product) => product.needs_manual_review === true);
  const eligibleProducts = products.filter((product) => product.needs_manual_review !== true);
  const invalidAffiliateUrls = affiliateUrls.filter((url) => !/^https:\/\/s\.shopee\.co\.th\/[A-Za-z0-9]+$/.test(url));
  const backstagePattern = /\b(?:match[_ ]type|fallback|taxonomy|validator|manual[_ ]review|source[_ ]query)\b/i;
  const publicCopyLeaks = products
    .filter((product) => backstagePattern.test(`${product.title ?? ""} ${product.description ?? ""}`))
    .map((product) => product.id);

  addCheck(checks, "catalog_products", products.length, 1074, products.length === 1074);
  addCheck(checks, "catalog_eligible_products", eligibleProducts.length, 1037, eligibleProducts.length === 1037);
  addCheck(checks, "catalog_held_products", heldProducts.length, 37, heldProducts.length === 37);
  addCheck(checks, "catalog_unique_ids", new Set(productIds).size, products.length, new Set(productIds).size === products.length, { duplicates: duplicateValues(productIds).slice(0, 20) });
  addCheck(checks, "catalog_unique_affiliate_urls", new Set(affiliateUrls).size, products.length, new Set(affiliateUrls).size === products.length, { duplicates: duplicateValues(affiliateUrls).slice(0, 20) });
  addCheck(checks, "catalog_affiliate_urls_only", invalidAffiliateUrls.length, 0, invalidAffiliateUrls.length === 0, { invalid: invalidAffiliateUrls.slice(0, 20) });
  addCheck(checks, "catalog_no_public_backstage_copy", publicCopyLeaks.length, 0, publicCopyLeaks.length === 0, { product_ids: publicCopyLeaks.slice(0, 20) });
  addCheck(checks, "catalog_reports_no_ordinary_links", catalogRoot.ordinary_product_links_included, false, catalogRoot.ordinary_product_links_included === false);
  addCheck(checks, "catalog_pending_image_downloads", coverage.pending_image_downloads, 0, coverage.pending_image_downloads === 0);

  const missingImages = [];
  const zeroByteImages = [];
  const badImageHeaders = [];
  for (const file of imageFiles) {
    if (!file || !fs.existsSync(file)) {
      missingImages.push(file);
      continue;
    }
    const stat = fs.statSync(file);
    if (stat.size === 0) {
      zeroByteImages.push(file);
      continue;
    }
    if (!validImageHeader(file)) badImageHeaders.push(file);
  }
  addCheck(checks, "catalog_unique_image_files", new Set(imageFiles).size, products.length, new Set(imageFiles).size === products.length, { duplicates: duplicateValues(imageFiles).slice(0, 20) });
  addCheck(checks, "images_missing", missingImages.length, 0, missingImages.length === 0, { files: missingImages.slice(0, 20) });
  addCheck(checks, "images_zero_bytes", zeroByteImages.length, 0, zeroByteImages.length === 0, { files: zeroByteImages.slice(0, 20) });
  addCheck(checks, "images_invalid_headers", badImageHeaders.length, 0, badImageHeaders.length === 0, { files: badImageHeaders.slice(0, 20) });

  addCheck(checks, "query_result_clusters", queryResults.length, 198, queryResults.length === 198);
  const uncoveredQueries = queryResults.filter((result) => result.product_count < 1 || result.status === "no_results");
  addCheck(checks, "query_results_with_products", uncoveredQueries.length, 0, uncoveredQueries.length === 0, { queries: uncoveredQueries.slice(0, 20).map((item) => item.query) });
  addCheck(checks, "coverage_clusters_with_results", coverage.content_clusters_with_results, 198, coverage.content_clusters_with_results === 198);
  addCheck(checks, "coverage_clusters_without_results", coverage.content_clusters_without_results, 0, coverage.content_clusters_without_results === 0);

  const states = [
    ["main", mainState, 65],
    ["fallback", fallbackState, 12],
    ["fallback2", fallback2State, 3],
  ];
  let totalBrowserQueries = 0;
  let totalBrowserNoResults = 0;
  for (const [label, state, expected] of states) {
    const queries = Array.isArray(state.queries) ? state.queries : [];
    const pending = queries.filter((query) => !["ok", "no_results"].includes(query.status));
    totalBrowserQueries += queries.length;
    totalBrowserNoResults += queries.filter((query) => query.status === "no_results").length;
    addCheck(checks, `${label}_browser_queries`, queries.length, expected, queries.length === expected);
    addCheck(checks, `${label}_browser_pending`, pending.length, 0, pending.length === 0, { queries: pending.slice(0, 20).map((item) => item.query) });
  }
  addCheck(checks, "browser_queries_total", totalBrowserQueries, 80, totalBrowserQueries === 80);
  addCheck(checks, "browser_no_results_total", totalBrowserNoResults, 28, totalBrowserNoResults === 28);

  const articles = Array.isArray(mappingRoot.articles) ? mappingRoot.articles : [];
  const mappedArticleIds = articles.map((article) => normalizeId(article.article_no));
  const mappedArticleSlugs = articles.map((article) => String(article.article_slug ?? "").trim());
  const mappedSourceArticleSlugs = articles.map((article) => String(article.source_article_slug ?? "").trim());
  const catalogById = new Map(products.map((product) => [String(product.id), product]));
  const manualIds = new Set((manualRoot.products ?? []).map((product) => String(product.id)));
  let assignmentCount = 0;
  const badProductCounts = [];
  const duplicateAssignments = [];
  const unknownAssignments = [];
  const heldAssignments = [];
  const affiliateMismatches = [];
  const globalFallbackAssignments = [];

  for (const article of articles) {
    const assignments = Array.isArray(article.products) ? article.products : [];
    assignmentCount += assignments.length;
    const ids = assignments.map((item) => String(item.id));
    if (assignments.length !== 4) badProductCounts.push(article.article_no);
    if (new Set(ids).size !== ids.length) duplicateAssignments.push(article.article_no);
    for (const assignment of assignments) {
      const id = String(assignment.id);
      const product = catalogById.get(id);
      if (!product) unknownAssignments.push({ article_no: article.article_no, product_id: id });
      if (manualIds.has(id) || product?.needs_manual_review === true) heldAssignments.push({ article_no: article.article_no, product_id: id });
      if (product && assignment.affiliate_url !== product.affiliate_url) affiliateMismatches.push({ article_no: article.article_no, product_id: id });
      if (String(assignment.match_type ?? "").includes("global_fallback")) globalFallbackAssignments.push({ article_no: article.article_no, product_id: id });
    }
  }

  addCheck(checks, "mapped_articles", articles.length, 10000, articles.length === 10000);
  addCheck(checks, "mapped_unique_article_ids", new Set(mappedArticleIds).size, 10000, new Set(mappedArticleIds).size === 10000, { duplicates: duplicateValues(mappedArticleIds).slice(0, 20) });
  addCheck(checks, "mapped_unique_article_slugs", new Set(mappedArticleSlugs).size, 10000, new Set(mappedArticleSlugs).size === 10000, { duplicates: duplicateValues(mappedArticleSlugs).slice(0, 20) });
  addCheck(checks, "mapped_source_id_set_matches", mappedArticleIds.filter((id) => !new Set(sourceIds).has(id)).length, 0, mappedArticleIds.every((id) => new Set(sourceIds).has(id)));
  addCheck(checks, "mapped_source_slug_set_matches", mappedSourceArticleSlugs.filter((slug) => !new Set(sourceSlugs).has(slug)).length, 0, mappedSourceArticleSlugs.every((slug) => new Set(sourceSlugs).has(slug)));
  addCheck(checks, "mapped_resolved_slug_changes", articles.filter((article) => article.article_slug !== article.source_article_slug).length, 1410, articles.filter((article) => article.article_slug !== article.source_article_slug).length === 1410);
  addCheck(checks, "article_assignments", assignmentCount, 40000, assignmentCount === 40000);
  addCheck(checks, "articles_with_wrong_product_count", badProductCounts.length, 0, badProductCounts.length === 0, { article_ids: badProductCounts.slice(0, 20) });
  addCheck(checks, "articles_with_duplicate_products", duplicateAssignments.length, 0, duplicateAssignments.length === 0, { article_ids: duplicateAssignments.slice(0, 20) });
  addCheck(checks, "unknown_product_assignments", unknownAssignments.length, 0, unknownAssignments.length === 0, { assignments: unknownAssignments.slice(0, 20) });
  addCheck(checks, "held_product_assignments", heldAssignments.length, 0, heldAssignments.length === 0, { assignments: heldAssignments.slice(0, 20) });
  addCheck(checks, "affiliate_url_mismatches", affiliateMismatches.length, 0, affiliateMismatches.length === 0, { assignments: affiliateMismatches.slice(0, 20) });
  addCheck(checks, "global_fallback_assignments", globalFallbackAssignments.length, 0, globalFallbackAssignments.length === 0, { assignments: globalFallbackAssignments.slice(0, 20) });
  addCheck(checks, "manual_review_file_products", manualIds.size, 37, manualIds.size === 37);

  const downloadDir = "/Users/bob/Downloads";
  const leftoverBatchExports = fs.existsSync(downloadDir)
    ? fs.readdirSync(downloadDir).filter((name) => /^BatchProductLinks.*\.csv$/i.test(name))
    : [];
  addCheck(checks, "leftover_batch_exports", leftoverBatchExports.length, 0, leftoverBatchExports.length === 0, { files: leftoverBatchExports });
} catch (error) {
  failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
}

for (const check of checks) {
  if (!check.ok) failures.push(`${check.name}: expected ${JSON.stringify(check.expected)}, got ${JSON.stringify(check.actual)}`);
}

const report = {
  generated_at: new Date().toISOString(),
  status: failures.length === 0 ? "pass" : "fail",
  checks_passed: checks.filter((check) => check.ok).length,
  checks_failed: checks.filter((check) => !check.ok).length,
  checks,
  failures,
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  status: report.status,
  checks_passed: report.checks_passed,
  checks_failed: report.checks_failed,
  report: REPORT_PATH,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
