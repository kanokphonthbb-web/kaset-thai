#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'affiliate-v2');
const sourcePath = path.join(dataDir, 'source-workbook.json');
const priorCsvPath = '/Users/bob/Desktop/Kraset Affiliate/kasetkonthai_shopee_affiliate_products_full.csv';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const keyOf = (value) => clean(value).toLocaleLowerCase('th-TH');
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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
  if (!rows.length) return [];
  const headers = rows[0].map((header, index) => clean(index === 0 ? header.replace(/^\uFEFF/, '') : header));
  return rows.slice(1)
    .filter((values) => values.some((value) => clean(value)))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
};
const explicitSearchQueries = new Map(Object.entries({
  'กรมประมง': 'คู่มือการเลี้ยงปลา',
  'กรมปศุสัตว์': 'คู่มือการเลี้ยงสัตว์',
  'กรมส่งเสริมการเกษตร': 'คู่มือการเกษตร',
  'ขอคำปรึกษาเกษตร': 'สมุดบันทึกฟาร์ม',
  'ขายอาหารแปรรูป': 'เครื่องซีลถุงอาหาร',
  'ขึ้นทะเบียนเกษตรกร': 'สมุดบันทึกฟาร์ม เกษตร',
  'เงินช่วยเหลือเกษตร': 'สมุดบัญชีฟาร์ม',
  'มาตรฐานฟาร์มปศุสัตว์': 'สมุดบันทึกฟาร์มปศุสัตว์',
  'มาตรฐาน GAP': 'สมุดบันทึกฟาร์ม GAP',
  'Organic Thailand': 'ป้ายสินค้าออร์แกนิค',
  'ขายไข่ไก่': 'แผงไข่ กล่องไข่',
  'ขายผลไม้หน้าสวน': 'ตะกร้าผลไม้ เครื่องชั่ง',
  'ขายสินค้าเกษตรผ่าน Facebook': 'เครื่องพิมพ์ใบปะหน้า',
  'ขายสินค้าเกษตรให้ร้านอาหาร': 'ลังใส่ผัก ถุงแพ็คผัก',
  'ตั้งราคาสินค้าเกษตร': 'เครื่องชั่งดิจิตอล คิดราคา',
  'แบรนด์สินค้าเกษตร': 'เครื่องพิมพ์สติ๊กเกอร์ ฉลากสินค้า',
  'แปรรูปกล้วย': 'เครื่องสไลด์กล้วย',
  'แปรรูปพริก': 'เครื่องบดพริก เครื่องอบแห้ง',
  'แปรรูปมะม่วง': 'เครื่องสไลด์มะม่วง เครื่องอบแห้ง',
  'แปรรูปสมุนไพร': 'เครื่องบดสมุนไพร เครื่องอบแห้ง',
  'ผักพร้อมปรุง': 'ถุงแพ็คผัก เครื่องซีล',
  'พรีออเดอร์สินค้าเกษตร': 'เครื่องพิมพ์ใบเสร็จ พกพา',
  'มาตรฐานสินค้าเกษตร': 'ฉลากสินค้าเกษตร สติ๊กเกอร์',
  'รวมกลุ่มเกษตรกร': 'สมุดบัญชีกลุ่มเกษตรกร',
  'ราคาสินค้าเกษตรตก': 'เครื่องแปรรูปผลผลิตเกษตร',
  'บัญชีฟาร์ม Google Sheets': 'สมุดบัญชีฟาร์ม',
  'LINE OA เกษตร': 'เครื่องพิมพ์ใบปะหน้า',
  'เพลี้ยแป้ง': 'ชีวภัณฑ์กำจัดเพลี้ยแป้ง',
  'โรคไก่ไข่': 'วิตามินไก่ไข่',
  'ASF หมู': 'น้ำยาฆ่าเชื้อฟาร์มหมู',
  'ฟาร์มรายย่อย': 'อุปกรณ์ฟาร์มขนาดเล็ก',
  'บ่อปลา + ผักสวนครัว': 'ชุดบ่อปลา ผักสวนครัว',
  'ปลูกผัก + เลี้ยงไก่ไข่': 'อุปกรณ์ปลูกผัก เลี้ยงไก่ไข่',
  'ผักอินทรีย์ + ปุ๋ยหมัก': 'ชุดปลูกผักอินทรีย์ ปุ๋ยหมัก',
  'แพะ + หญ้าอาหารสัตว์': 'อาหารแพะ เมล็ดหญ้าอาหารสัตว์',
  'สวนผลไม้ + ไก่บ้าน': 'อุปกรณ์สวนผลไม้ เลี้ยงไก่',
  'หญ้าเนเปียร์ + วัว': 'ท่อนพันธุ์หญ้าเนเปียร์ อาหารวัว',
  'หมูหลุม + ปุ๋ยคอก': 'อุปกรณ์หมูหลุม ปุ๋ยคอก',
  'เห็ด + ไส้เดือน': 'ชุดเพาะเห็ด เลี้ยงไส้เดือน',
}));
const makeSearchQuery = (query, categories, subcategories) => {
  if (explicitSearchQueries.has(query)) return explicitSearchQueries.get(query);
  const category = categories[0] ?? '';
  const subcategory = subcategories[0] ?? '';
  if (subcategory === 'เกษตรผสมผสานตามขนาดพื้นที่') return `ชุดเกษตรผสมผสาน ${query}`;
  if (category === 'ต้นทุน กำไร บัญชีฟาร์ม') return `อุปกรณ์${query}`;
  return query;
};

if (!fs.existsSync(sourcePath)) throw new Error(`Source extraction missing: ${sourcePath}`);
if (!fs.existsSync(priorCsvPath)) throw new Error(`Prior affiliate CSV missing: ${priorCsvPath}`);

const sourceDoc = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const contentSheet = sourceDoc.sheets.find((sheet) => sheet.name === 'Content Map 10000');
if (!contentSheet) throw new Error('Content Map 10000 sheet is missing');
const headers = contentSheet.values[0].map(clean);
const column = Object.fromEntries(headers.map((header, index) => [header, index]));
const required = [
  'No.', 'Main Category', 'Subcategory', 'Content Cluster', 'Article Title / H1',
  'Primary Keyword', 'Suggested URL Slug', 'Parent Topic / Entity', 'Priority',
];
for (const name of required) {
  if (column[name] === undefined) throw new Error(`Missing source column: ${name}`);
}

const sourceRows = contentSheet.values.slice(1).filter((row) => clean(row[column['No.']]) && clean(row[column['Article Title / H1']]));
const priorRows = parseCsv(fs.readFileSync(priorCsvPath, 'utf8').replace(/^\uFEFF/, ''));
const priorByCluster = new Map();
const priorSearchQueries = new Set();
for (const row of priorRows) {
  const clusterKey = keyOf(row.content_cluster);
  if (clusterKey) {
    if (!priorByCluster.has(clusterKey)) priorByCluster.set(clusterKey, []);
    priorByCluster.get(clusterKey).push(row);
  }
  if (clean(row.searched_query)) priorSearchQueries.add(keyOf(row.searched_query));
}

const taxonomy = new Map();
for (const row of sourceRows) {
  const query = clean(row[column['Content Cluster']]);
  if (!query) continue;
  const key = keyOf(query);
  const entry = taxonomy.get(key) ?? {
    query,
    categories: new Set(),
    subcategories: new Set(),
    parent_topics: new Set(),
    primary_keywords: new Set(),
    priorities: {},
    source_rows: [],
  };
  const priority = clean(row[column.Priority]) || 'ไม่ระบุ';
  entry.categories.add(clean(row[column['Main Category']]));
  entry.subcategories.add(clean(row[column.Subcategory]));
  entry.parent_topics.add(clean(row[column['Parent Topic / Entity']]));
  entry.primary_keywords.add(clean(row[column['Primary Keyword']]));
  entry.priorities[priority] = (entry.priorities[priority] ?? 0) + 1;
  entry.source_rows.push({
    no: clean(row[column['No.']]).replace(/\.0$/, ''),
    title: clean(row[column['Article Title / H1']]),
    primary_keyword: clean(row[column['Primary Keyword']]),
    slug: clean(row[column['Suggested URL Slug']]),
  });
  taxonomy.set(key, entry);
}

const queryPlan = [...taxonomy.entries()].map(([key, entry]) => {
  const prior = priorByCluster.get(key) ?? [];
  const categories = [...entry.categories].filter(Boolean).sort((a, b) => a.localeCompare(b, 'th'));
  const subcategories = [...entry.subcategories].filter(Boolean).sort((a, b) => a.localeCompare(b, 'th'));
  return {
    query: entry.query,
    search_query: prior.length ? '' : makeSearchQuery(entry.query, categories, subcategories),
    categories,
    subcategories,
    parent_topics: [...entry.parent_topics].filter(Boolean).sort((a, b) => a.localeCompare(b, 'th')),
    primary_keywords: [...entry.primary_keywords].filter(Boolean).sort((a, b) => a.localeCompare(b, 'th')),
    source: path.basename(sourceDoc.source_path),
    source_row_count: entry.source_rows.length,
    source_rows: entry.source_rows,
    priority_counts: entry.priorities,
    status: prior.length ? 'processed_existing_catalog' : 'pending',
    prior_product_count: new Set(prior.map((row) => clean(row.product_id)).filter(Boolean)).size,
    prior_search_queries: [...new Set(prior.map((row) => clean(row.searched_query)).filter(Boolean))],
  };
}).sort((a, b) => a.categories.join('|').localeCompare(b.categories.join('|'), 'th') || a.query.localeCompare(b.query, 'th'));

const queueMap = new Map();
for (const row of queryPlan.filter((planRow) => planRow.status === 'pending')) {
  const queryKey = keyOf(row.search_query);
  const queued = queueMap.get(queryKey) ?? {
    query: row.search_query,
    core_topics: [],
    categories: new Set(),
    subcategories: new Set(),
    parent_topics: new Set(),
    primary_keywords: new Set(),
    source: row.source,
    source_row_ids: new Set(),
    source_slugs: new Set(),
    priority_counts: {},
  };
  queued.core_topics.push(row.query);
  row.categories.forEach((value) => queued.categories.add(value));
  row.subcategories.forEach((value) => queued.subcategories.add(value));
  row.parent_topics.forEach((value) => queued.parent_topics.add(value));
  row.primary_keywords.forEach((value) => queued.primary_keywords.add(value));
  row.source_rows.forEach((sourceRow) => {
    queued.source_row_ids.add(sourceRow.no);
    queued.source_slugs.add(sourceRow.slug);
  });
  for (const [priority, count] of Object.entries(row.priority_counts)) {
    queued.priority_counts[priority] = (queued.priority_counts[priority] ?? 0) + count;
  }
  queueMap.set(queryKey, queued);
}
const queue = [...queueMap.values()].map((row) => ({
  query: row.query,
  core_topics: row.core_topics,
  categories: [...row.categories],
  subcategories: [...row.subcategories],
  parent_topics: [...row.parent_topics],
  primary_keywords: [...row.primary_keywords],
  source: row.source,
  source_row_count: row.source_row_ids.size,
  source_row_ids: [...row.source_row_ids],
  source_slugs: [...row.source_slugs],
  priority_counts: row.priority_counts,
})).sort((a, b) => a.categories.join('|').localeCompare(b.categories.join('|'), 'th') || a.query.localeCompare(b.query, 'th'));

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'query-plan.json'), `${JSON.stringify(queryPlan, null, 2)}\n`);
fs.writeFileSync(path.join(dataDir, 'query-queue.json'), `${JSON.stringify(queue, null, 2)}\n`);

const planFields = [
  'query', 'search_query', 'categories', 'subcategories', 'parent_topics', 'primary_keywords',
  'source_row_count', 'source_row_ids', 'source_slugs', 'priority_counts', 'status',
  'prior_product_count', 'prior_search_queries',
];
const csvRows = [planFields.join(',')];
for (const row of queryPlan) {
  csvRows.push(planFields.map((field) => {
    if (field === 'source_row_ids') return csvCell(row.source_rows.map((sourceRow) => sourceRow.no));
    if (field === 'source_slugs') return csvCell(row.source_rows.map((sourceRow) => sourceRow.slug));
    if (field === 'priority_counts') return csvCell(Object.entries(row.priority_counts).map(([label, count]) => `${label}:${count}`));
    return csvCell(row[field]);
  }).join(','));
}
fs.writeFileSync(path.join(dataDir, 'query-plan.csv'), `${csvRows.join('\n')}\n`);

const statusCounts = queryPlan.reduce((counts, row) => {
  counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}, {});
const coverage = {
  generated_at: new Date().toISOString(),
  source_workbook: sourceDoc.source_path,
  extraction_mode: sourceDoc.extraction_mode,
  source_sheets: sourceDoc.sheets.map((sheet) => ({ name: sheet.name, rows: sheet.rows, columns: sheet.columns })),
  source_rows: sourceRows.length,
  unique_content_clusters: queryPlan.length,
  prior_catalog_rows: priorRows.length,
  prior_unique_products: new Set(priorRows.map((row) => clean(row.product_id)).filter(Boolean)).size,
  prior_content_clusters: priorByCluster.size,
  prior_search_queries: priorSearchQueries.size,
  status_counts: statusCounts,
  pending_core_topics: queryPlan.filter((row) => row.status === 'pending').length,
  pending_queries: queue.length,
};
fs.writeFileSync(path.join(dataDir, 'coverage-initial.json'), `${JSON.stringify(coverage, null, 2)}\n`);
console.log(JSON.stringify(coverage, null, 2));
