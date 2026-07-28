#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'affiliate-v2');
const plan = JSON.parse(fs.readFileSync(path.join(dataDir, 'query-plan.json'), 'utf8'));
const catalogDoc = JSON.parse(fs.readFileSync(path.join(dataDir, 'products-affiliate-only-v2.json'), 'utf8'));
const products = catalogDoc.products;
const generatedAt = new Date().toISOString();
const productsPerArticle = 4;

const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('th-TH');
const uniqueProducts = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const writeCsv = (filePath, rows, fields) => {
  const lines = [fields.join(',')];
  for (const row of rows) lines.push(fields.map((field) => csvCell(row[field])).join(','));
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
};
const salesCount = (label) => {
  const text = normalize(label).replaceAll(',', '').replaceAll('+', '');
  const number = Number.parseFloat(text.match(/[\d.]+/)?.[0] ?? '0');
  if (text.includes('ล้าน')) return number * 1_000_000;
  if (text.includes('แสน')) return number * 100_000;
  if (text.includes('หมื่น')) return number * 10_000;
  if (text.includes('พัน')) return number * 1_000;
  return number;
};
const relevanceScore = (product, topic) => {
  const title = normalize(product.title);
  const tokens = normalize(topic).split(/\s+/u).filter((token) => token.length >= 2);
  const overlap = tokens.reduce((score, token) => score + (title.includes(token) ? 1 : 0), 0);
  return (title.includes(normalize(topic)) ? 100_000_000 : 0)
    + overlap * 1_000_000
    + (Number.parseFloat(product.relevance_score) || 0)
    + Math.min(salesCount(product.sales_label), 999_999);
};
const sortForTopic = (items, topic) => [...items].sort((a, b) => {
  const scoreDiff = relevanceScore(b, topic) - relevanceScore(a, topic);
  return scoreDiff || String(a.id).localeCompare(String(b.id));
});
const rotate = (items, offset) => items.length
  ? [...items.slice(offset % items.length), ...items.slice(0, offset % items.length)]
  : [];

// The source workbook contains repeated Suggested URL Slugs even though every
// article number is unique. Preserve the original value for traceability and
// generate a deterministic, globally unique public slug for implementation.
const allSourceRows = plan
  .flatMap((topic) => topic.source_rows)
  .sort((a, b) => Number(a.no) - Number(b.no));
const resolvedSlugByArticleNo = new Map();
const usedResolvedSlugs = new Set();
let resolvedSlugChanges = 0;
for (const sourceRow of allSourceRows) {
  const sourceSlug = String(sourceRow.slug ?? '').trim();
  let resolvedSlug = sourceSlug;
  if (usedResolvedSlugs.has(resolvedSlug)) {
    resolvedSlug = `${sourceSlug}-${sourceRow.no}`;
    let suffix = 2;
    while (usedResolvedSlugs.has(resolvedSlug)) {
      resolvedSlug = `${sourceSlug}-${sourceRow.no}-${suffix}`;
      suffix += 1;
    }
  }
  if (resolvedSlug !== sourceSlug) resolvedSlugChanges += 1;
  usedResolvedSlugs.add(resolvedSlug);
  resolvedSlugByArticleNo.set(String(sourceRow.no), resolvedSlug);
}

const eligible = products.filter((product) => !product.needs_manual_review);
const manualReview = products.filter((product) => product.needs_manual_review);
const byTopic = new Map();
const byCategory = new Map();
for (const product of eligible) {
  for (const topic of product.core_topics ?? []) {
    const key = normalize(topic);
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push(product);
  }
  for (const category of product.categories ?? [product.category]) {
    const key = normalize(category);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(product);
  }
}

const relatedCategoryFallbacks = new Map([
  ['ข่าวสาร กฎหมาย หน่วยงาน และมาตรฐาน', ['เทคโนโลยี อุปกรณ์ และเครื่องมือ', 'ตลาด แปรรูป และการขาย']],
  ['โรคและการดูแล', ['ปลูกพืช', 'เลี้ยงสัตว์ / ปศุสัตว์', 'ประมง / สัตว์น้ำ']],
]);
const globalFallback = [...eligible].sort((a, b) => salesCount(b.sales_label) - salesCount(a.sales_label) || String(a.id).localeCompare(String(b.id)));
const articles = [];
const flatRows = [];
const assignedIds = new Set();
let directOnlyArticles = 0;
let sameCategoryFallbackArticles = 0;
let relatedCategoryFallbackArticles = 0;
let globalFallbackArticles = 0;

for (const topic of plan) {
  const directCandidates = sortForTopic(uniqueProducts(byTopic.get(normalize(topic.query)) ?? []), topic.query);
  const categoryCandidates = sortForTopic(uniqueProducts(
    topic.categories.flatMap((category) => byCategory.get(normalize(category)) ?? []),
  ), topic.query);
  const relatedCategoryCandidates = sortForTopic(uniqueProducts(
    topic.categories.flatMap((category) => (relatedCategoryFallbacks.get(category) ?? [])
      .flatMap((related) => byCategory.get(normalize(related)) ?? [])),
  ), topic.query);

  for (const sourceRow of topic.source_rows) {
    const sourceArticleSlug = sourceRow.slug;
    const resolvedArticleSlug = resolvedSlugByArticleNo.get(String(sourceRow.no));
    if (!resolvedArticleSlug) throw new Error(`Missing resolved slug for article ${sourceRow.no}`);
    const rotationSeed = Math.max(0, Number.parseInt(sourceRow.no, 10) - 1);
    const selected = [];
    const selectedIds = new Set();
    const take = (candidates, matchType) => {
      for (const product of rotate(candidates, rotationSeed)) {
        if (selected.length >= productsPerArticle) break;
        if (selectedIds.has(product.id)) continue;
        selectedIds.add(product.id);
        selected.push({ product, match_type: matchType });
      }
    };
    take(directCandidates, 'direct_content_cluster');
    if (selected.length < productsPerArticle) take(categoryCandidates, 'fallback_same_category');
    if (selected.length < productsPerArticle) take(relatedCategoryCandidates, 'fallback_related_category');
    if (selected.length < productsPerArticle) take(globalFallback, 'fallback_global');
    if (selected.length !== productsPerArticle) throw new Error(`Article ${sourceRow.no} received ${selected.length} products`);

    const usedSame = selected.some((item) => item.match_type === 'fallback_same_category');
    const usedRelated = selected.some((item) => item.match_type === 'fallback_related_category');
    const usedGlobal = selected.some((item) => item.match_type === 'fallback_global');
    if (usedGlobal) globalFallbackArticles += 1;
    else if (usedRelated) relatedCategoryFallbackArticles += 1;
    else if (usedSame) sameCategoryFallbackArticles += 1;
    else directOnlyArticles += 1;

    const mappedProducts = selected.map(({ product, match_type: matchType }, index) => {
      assignedIds.add(product.id);
      const mapped = {
        rank: index + 1,
        match_type: matchType,
        id: product.id,
        title: product.title,
        affiliate_url: product.affiliate_url,
        image_url: product.image_url,
        image_file: product.image_file,
        category: product.category,
        price_label: product.price_label,
        sales_label: product.sales_label,
        shop_name: product.shop_name,
        commission_rate: product.commission_rate,
        commission_amount: product.commission_amount,
      };
      flatRows.push({
        article_no: sourceRow.no,
        article_slug: resolvedArticleSlug,
        source_article_slug: sourceArticleSlug,
        article_title: sourceRow.title,
        primary_keyword: sourceRow.primary_keyword,
        content_cluster: topic.query,
        article_category: topic.categories,
        article_subcategory: topic.subcategories,
        product_rank: mapped.rank,
        match_type: mapped.match_type,
        product_id: mapped.id,
        product_title: mapped.title,
        affiliate_url: mapped.affiliate_url,
        image_url: mapped.image_url,
        image_file: mapped.image_file,
        product_category: mapped.category,
        price_label: mapped.price_label,
        sales_label: mapped.sales_label,
        shop_name: mapped.shop_name,
        commission_rate: mapped.commission_rate,
        commission_amount: mapped.commission_amount,
      });
      return mapped;
    });

    articles.push({
      article_no: sourceRow.no,
      article_slug: resolvedArticleSlug,
      source_article_slug: sourceArticleSlug,
      article_title: sourceRow.title,
      primary_keyword: sourceRow.primary_keyword,
      content_cluster: topic.query,
      categories: topic.categories,
      subcategories: topic.subcategories,
      assignment_strategy: usedGlobal
        ? 'global_fallback'
        : usedRelated
          ? 'related_category_fallback'
          : usedSame
            ? 'same_category_fallback'
            : 'direct_content_cluster',
      products: mappedProducts,
    });
  }
}

articles.sort((a, b) => Number(a.article_no) - Number(b.article_no));
flatRows.sort((a, b) => Number(a.article_no) - Number(b.article_no) || a.product_rank - b.product_rank);
const summary = {
  total_articles: articles.length,
  total_assignments: flatRows.length,
  unique_source_article_slugs: new Set(allSourceRows.map((row) => row.slug)).size,
  duplicate_source_slug_rows_resolved: resolvedSlugChanges,
  unique_resolved_article_slugs: usedResolvedSlugs.size,
  direct_only_articles: directOnlyArticles,
  same_category_fallback_articles: sameCategoryFallbackArticles,
  related_category_fallback_articles: relatedCategoryFallbackArticles,
  global_fallback_articles: globalFallbackArticles,
  zero_product_articles: articles.filter((article) => article.products.length === 0).length,
  unique_products_assigned: assignedIds.size,
};
const mappingDoc = {
  generated_at: generatedAt,
  source: 'kasetkonthai_10000_seo_aeo_ai_search_titles (1).xlsx',
  product_catalog: 'products-affiliate-only-v2.json',
  products_per_article: productsPerArticle,
  policy: {
    affiliate_links_only: true,
    manual_review_products_excluded: true,
    fallback_order: ['direct_content_cluster', 'fallback_same_category', 'fallback_related_category', 'fallback_global'],
    related_category_fallbacks: Object.fromEntries(relatedCategoryFallbacks),
  },
  summary,
  articles,
};
fs.writeFileSync(path.join(dataDir, 'article-product-map.json'), `${JSON.stringify(mappingDoc, null, 2)}\n`);
writeCsv(path.join(dataDir, 'article-product-assignments.csv'), flatRows, [
  'article_no', 'article_slug', 'source_article_slug', 'article_title', 'primary_keyword', 'content_cluster',
  'article_category', 'article_subcategory', 'product_rank', 'match_type', 'product_id',
  'product_title', 'affiliate_url', 'image_url', 'image_file', 'product_category',
  'price_label', 'sales_label', 'shop_name', 'commission_rate', 'commission_amount',
]);

const manualReviewDoc = {
  generated_at: generatedAt,
  reason: 'Excluded from automatic article assignments pending human review for regulated or high-risk agricultural claims/products.',
  total_products: manualReview.length,
  products: manualReview,
};
fs.writeFileSync(path.join(dataDir, 'manual-review-products.json'), `${JSON.stringify(manualReviewDoc, null, 2)}\n`);
writeCsv(path.join(dataDir, 'manual-review-products.csv'), manualReview, [
  'id', 'title', 'category', 'categories', 'subcategories', 'core_topics', 'search_queries',
  'affiliate_url', 'image_url', 'image_file', 'price_label', 'sales_label', 'shop_name',
  'commission_rate', 'commission_amount', 'description',
]);

const coveragePath = path.join(dataDir, 'coverage-summary.json');
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
coverage.article_mapping = {
  ...summary,
  products_per_article: productsPerArticle,
  manual_review_products_excluded: manualReview.length,
};
fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
