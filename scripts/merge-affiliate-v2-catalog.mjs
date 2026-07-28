#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'affiliate-v2');
const priorCsvPath = '/Users/bob/Desktop/Kraset Affiliate/kasetkonthai_shopee_affiliate_products_full.csv';
const imageDir = '/Users/bob/Documents/Codex/2026-07-28/kasettakonthai-affiliate/images';
const generatedAt = new Date().toISOString();

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalize = (value) => clean(value).toLocaleLowerCase('th-TH');
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const writeCsv = (filePath, rows, fields) => {
  const lines = [fields.join(',')];
  for (const row of rows) lines.push(fields.map((field) => csvCell(row[field])).join(','));
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
};
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows[0].map((header, index) => clean(index === 0 ? header.replace(/^\uFEFF/, '') : header));
  return rows.slice(1)
    .filter((values) => values.some((value) => clean(value)))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
};
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
const readOptionalJson = (name, fallback) => {
  const filePath = path.join(dataDir, name);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
};
const isAffiliateUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 's.shopee.co.th';
  } catch {
    return false;
  }
};
const riskyPattern = /(ยาฆ่า|ยากำจัด|สารกำจัด|กำจัดแมลง|กำจัดวัชพืช|ฆ่าเชื้อ|วัคซีน|ยาปฏิชีวนะ|ยาถ่ายพยาธิ|ยารักษา|ยาแก้|ฮอร์โมน|อีมาเมกติน|อะบาเมกติน|ไกลโฟเซต|พาราควอต|คาร์โบฟูราน|เมทัลดีไฮด์|คลอร์ไพริฟอส|ฟิโพรนิล|อะทราซีน|ไดยูรอน|ยาฆ่าหญ้า|ยากำจัดหอย|สารเร่ง|ป้องกันและกำจัดโรค)/iu;

const plan = readJson('query-plan.json');
const mainQueue = readJson('query-queue.json');
const fallbackQueue = readOptionalJson('query-fallback-queue.json', []);
const fallback2Queue = readOptionalJson('query-fallback2-queue.json', []);
const mainState = readJson('browser-state.json');
const fallbackState = readOptionalJson('browser-state-fallback.json', { queries: [], products: {} });
const fallback2State = readOptionalJson('browser-state-fallback2.json', { queries: [], products: {} });
const priorRows = parseCsv(fs.readFileSync(priorCsvPath, 'utf8'));

const planByTopic = new Map(plan.map((row) => [normalize(row.query), row]));
const provenanceBySearch = new Map();
for (const row of [...mainQueue, ...fallbackQueue, ...fallback2Queue]) {
  provenanceBySearch.set(normalize(row.query), row);
}

const catalogById = new Map();
const putProduct = (input) => {
  const existing = catalogById.get(input.id);
  if (!existing) {
    catalogById.set(input.id, input);
    return;
  }
  existing.title = input.prefer_new_title && input.title ? input.title : existing.title || input.title;
  existing.image_url = input.prefer_new_image && input.image_url ? input.image_url : existing.image_url || input.image_url;
  existing.affiliate_url = input.prefer_new_link && input.affiliate_url ? input.affiliate_url : existing.affiliate_url || input.affiliate_url;
  existing.categories = unique([...existing.categories, ...input.categories]);
  existing.subcategories = unique([...existing.subcategories, ...input.subcategories]);
  existing.core_topics = unique([...existing.core_topics, ...input.core_topics]);
  existing.search_queries = unique([...existing.search_queries, ...input.search_queries]);
  existing.primary_keywords = unique([...existing.primary_keywords, ...input.primary_keywords]);
  existing.source_row_ids = unique([...existing.source_row_ids, ...input.source_row_ids]);
  existing.source_slugs = unique([...existing.source_slugs, ...input.source_slugs]);
  existing.sources = unique([...existing.sources, ...input.sources]);
  for (const field of ['price_label', 'sales_label', 'shop_name', 'commission_rate', 'commission_amount', 'relevance_score']) {
    if (!existing[field] && input[field]) existing[field] = input[field];
  }
};

for (const row of priorRows) {
  const id = clean(row.product_id);
  if (!id || !isAffiliateUrl(clean(row.affiliate_link))) continue;
  const topicPlan = planByTopic.get(normalize(row.content_cluster));
  putProduct({
    id,
    title: clean(row.product_name),
    image_url: clean(row.image_url),
    affiliate_url: clean(row.affiliate_link),
    categories: unique([row.main_category, ...(topicPlan?.categories ?? [])]),
    subcategories: unique([row.subcategory, ...(topicPlan?.subcategories ?? [])]),
    core_topics: unique([row.content_cluster]),
    search_queries: unique([row.searched_query]),
    primary_keywords: unique([row.keyword, ...(topicPlan?.primary_keywords ?? [])]),
    source_row_ids: topicPlan?.source_rows?.map((sourceRow) => sourceRow.no) ?? [],
    source_slugs: unique([row.example_slug, ...(topicPlan?.source_rows?.map((sourceRow) => sourceRow.slug) ?? [])]),
    price_label: clean(row.price),
    sales_label: clean(row.sold_estimate),
    shop_name: '',
    commission_rate: clean(row.commission),
    commission_amount: '',
    relevance_score: clean(row.relevance_score),
    sources: ['prior_kaset_affiliate_catalog'],
    prefer_new_title: false,
    prefer_new_image: false,
    prefer_new_link: false,
  });
}

const browserStates = [
  ['main_browser_run', mainState],
  ['fallback_browser_run', fallbackState],
  ['fallback2_browser_run', fallback2State],
];
for (const [stateSource, state] of browserStates) {
  for (const raw of Object.values(state.products ?? {})) {
    if (!clean(raw.item_id) || !isAffiliateUrl(clean(raw.affiliate_url))) continue;
    const provenanceRows = unique(raw.search_queries ?? []).map((query) => provenanceBySearch.get(normalize(query))).filter(Boolean);
    putProduct({
      id: clean(raw.item_id),
      title: clean(raw.title),
      image_url: clean(raw.image_url),
      affiliate_url: clean(raw.affiliate_url),
      categories: unique([...(raw.categories ?? []), ...provenanceRows.flatMap((row) => row.categories ?? [])]),
      subcategories: unique(provenanceRows.flatMap((row) => row.subcategories ?? [])),
      core_topics: unique(provenanceRows.flatMap((row) => row.core_topics ?? [])),
      search_queries: unique(raw.search_queries ?? []),
      primary_keywords: unique(provenanceRows.flatMap((row) => row.primary_keywords ?? [])),
      source_row_ids: unique([...(raw.source_row_ids ?? []), ...provenanceRows.flatMap((row) => row.source_row_ids ?? [])]),
      source_slugs: unique(provenanceRows.flatMap((row) => row.source_slugs ?? [])),
      price_label: clean(raw.price),
      sales_label: clean(raw.sales),
      shop_name: clean(raw.shop_name),
      commission_rate: clean(raw.commission_rate),
      commission_amount: clean(raw.commission),
      relevance_score: '',
      sources: [stateSource],
      prefer_new_title: true,
      prefer_new_image: true,
      prefer_new_link: true,
    });
  }
}

fs.mkdirSync(imageDir, { recursive: true });
let products = [...catalogById.values()];
const affiliateSeen = new Map();
const duplicateAffiliateRows = [];
products = products.filter((product) => {
  const prior = affiliateSeen.get(product.affiliate_url);
  if (!prior) {
    affiliateSeen.set(product.affiliate_url, product.id);
    return true;
  }
  duplicateAffiliateRows.push({ dropped_product_id: product.id, kept_product_id: prior, affiliate_url: product.affiliate_url });
  return false;
});

for (const product of products) {
  product.categories = unique(product.categories);
  product.subcategories = unique(product.subcategories);
  product.core_topics = unique(product.core_topics);
  product.search_queries = unique(product.search_queries);
  product.primary_keywords = unique(product.primary_keywords);
  product.source_row_ids = unique(product.source_row_ids).sort((a, b) => Number(a) - Number(b));
  product.source_slugs = unique(product.source_slugs);
  product.sources = unique(product.sources);
  product.category = product.categories[0] ?? 'อื่นๆ';
  product.keywords = unique([
    ...product.core_topics,
    ...product.search_queries,
    ...product.primary_keywords,
    ...product.title.split(/[\s,()\[\]\/]+/u).filter((part) => part.length >= 2),
  ]).slice(0, 30);
  const riskText = [product.title, ...product.search_queries, ...product.core_topics].join(' ');
  product.regulated_or_high_risk = riskyPattern.test(riskText);
  product.needs_manual_review = product.regulated_or_high_risk || !product.image_url || !isAffiliateUrl(product.affiliate_url);
  product.description = `สินค้าเกษตรที่เกี่ยวข้องกับ ${product.core_topics.slice(0, 3).join(', ') || product.category} ควรตรวจสอบชื่อสินค้า รุ่น ขนาด วิธีใช้ ราคา และเงื่อนไขล่าสุดจากร้านค้าก่อนสั่งซื้อผ่านลิงก์ Affiliate`;
  product.affiliate_link_status = 'verified_affiliate_offer_link';
  product.image_file = path.join(imageDir, `${product.id}.webp`);
  product.image_download_status = fs.existsSync(product.image_file) && fs.statSync(product.image_file).size > 0 ? 'downloaded' : 'pending';
  product.checked_at = generatedAt;
  delete product.prefer_new_title;
  delete product.prefer_new_image;
  delete product.prefer_new_link;
}
products.sort((a, b) => Number(a.id) - Number(b.id));

const pendingImages = products.filter((product) => product.image_download_status !== 'downloaded');
const configBlocks = pendingImages.map((product) => [
  `url = "${product.image_url}"`,
  `output = "${product.image_file}"`,
].join('\n'));
fs.writeFileSync(path.join(dataDir, 'image-download-config.txt'), configBlocks.join('\nnext\n') + (configBlocks.length ? '\n' : ''));

const catalogDoc = {
  generated_at: generatedAt,
  source_keyword_file: 'kasetkonthai_10000_seo_aeo_ai_search_titles (1).xlsx',
  source: 'Shopee Affiliate Product Offer and prior kasettakonthai affiliate catalog',
  link_policy: 'affiliate_only_https_s_shopee_co_th',
  ordinary_product_links_included: false,
  total_products: products.length,
  products,
};
fs.writeFileSync(path.join(dataDir, 'products-affiliate-only-v2.json'), `${JSON.stringify(catalogDoc, null, 2)}\n`);
writeCsv(path.join(dataDir, 'products-affiliate-only-v2.csv'), products, [
  'id', 'title', 'category', 'categories', 'subcategories', 'core_topics', 'search_queries',
  'primary_keywords', 'source_row_ids', 'source_slugs', 'price_label', 'sales_label',
  'shop_name', 'commission_rate', 'commission_amount', 'affiliate_url', 'image_url',
  'image_file', 'image_download_status', 'regulated_or_high_risk', 'needs_manual_review',
  'description', 'sources',
]);
fs.writeFileSync(path.join(dataDir, 'duplicate-affiliate-rows.json'), `${JSON.stringify(duplicateAffiliateRows, null, 2)}\n`);

const queryResults = plan.map((topic) => {
  const topicProducts = products.filter((product) => product.core_topics.some((value) => normalize(value) === normalize(topic.query)));
  return {
    query: topic.query,
    categories: topic.categories,
    subcategories: topic.subcategories,
    source_row_count: topic.source_row_count,
    source_row_ids: topic.source_rows.map((row) => row.no),
    status: topicProducts.length ? (topic.status === 'processed_existing_catalog' ? 'existing_catalog' : 'ok') : 'no_results',
    result_source: topic.status === 'processed_existing_catalog' ? 'prior_catalog' : 'v2_browser_runs',
    product_count: topicProducts.length,
    processed_at: generatedAt,
  };
});
fs.writeFileSync(path.join(dataDir, 'query-results-v2.json'), `${JSON.stringify(queryResults, null, 2)}\n`);
writeCsv(path.join(dataDir, 'query-results-v2.csv'), queryResults, [
  'query', 'categories', 'subcategories', 'source_row_count', 'source_row_ids',
  'status', 'result_source', 'product_count', 'processed_at',
]);

const categoryCounts = {};
for (const product of products) {
  for (const category of product.categories) categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
}
const rawNewIds = new Set(browserStates.flatMap(([, state]) => Object.keys(state.products ?? {})));
const priorIds = new Set(priorRows.map((row) => clean(row.product_id)).filter(Boolean));
const coverage = {
  generated_at: generatedAt,
  source_rows: 10_000,
  unique_content_clusters: plan.length,
  content_clusters_with_results: queryResults.filter((row) => row.status !== 'no_results').length,
  content_clusters_without_results: queryResults.filter((row) => row.status === 'no_results').length,
  main_queries_processed: mainState.queries.length,
  fallback_queries_processed: fallbackState.queries.length,
  fallback2_queries_processed: fallback2State.queries.length,
  browser_queries_total: browserStates.reduce((total, [, state]) => total + state.queries.length, 0),
  browser_no_results_total: browserStates.reduce((total, [, state]) => total + state.queries.filter((row) => row.status === 'no_results').length, 0),
  prior_catalog_products: priorIds.size,
  raw_new_unique_products: rawNewIds.size,
  overlap_with_prior_by_id: [...rawNewIds].filter((id) => priorIds.has(id)).length,
  merged_unique_products: products.length,
  duplicate_affiliate_rows_dropped: duplicateAffiliateRows.length,
  regulated_or_high_risk_products: products.filter((product) => product.regulated_or_high_risk).length,
  needs_manual_review: products.filter((product) => product.needs_manual_review).length,
  pending_image_downloads: pendingImages.length,
  category_counts: categoryCounts,
  curl_config: path.join(dataDir, 'image-download-config.txt'),
  image_directory: imageDir,
};
fs.writeFileSync(path.join(dataDir, 'coverage-summary.json'), `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(coverage, null, 2));
