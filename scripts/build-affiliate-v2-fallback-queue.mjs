#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'affiliate-v2');
const queue = JSON.parse(fs.readFileSync(path.join(dataDir, 'query-queue.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(path.join(dataDir, 'browser-state.json'), 'utf8'));
const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('th-TH');

const fallbackByQuery = new Map(Object.entries({
  'ชุดเกษตรผสมผสาน 1 ไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน 2 ไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน 3 ไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน 5 ไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน ครึ่งไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน ที่ดินต่างจังหวัด': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน พื้นที่เช่า': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดเกษตรผสมผสาน พื้นที่หลังบ้าน': 'อุปกรณ์เกษตรผสมผสาน',
  'อุปกรณ์ทำเกษตรผสมผสาน 1 ไร่': 'อุปกรณ์เกษตรผสมผสาน',
  'ชุดบ่อปลา ผักสวนครัว': 'บ่อผ้าใบเลี้ยงปลา',
  'ชุดปลูกผักอินทรีย์ ปุ๋ยหมัก': 'ชุดปลูกผัก ปุ๋ยหมัก',
  'ชุดเพาะเห็ด เลี้ยงไส้เดือน': 'ชุดเลี้ยงไส้เดือน',
  'ท่อนพันธุ์หญ้าเนเปียร์ อาหารวัว': 'ท่อนพันธุ์หญ้าเนเปียร์',
  'อุปกรณ์หมูหลุม ปุ๋ยคอก': 'อุปกรณ์คอกหมู',
  'สมุดบันทึกฟาร์ม': 'สมุดบัญชีรายรับรายจ่าย',
  'สมุดบันทึกฟาร์ม เกษตร': 'สมุดบัญชีรายรับรายจ่าย',
  'สมุดบันทึกฟาร์มปศุสัตว์': 'สมุดบัญชีรายรับรายจ่าย',
  'สมุดบันทึกฟาร์ม GAP': 'แบบบันทึก GAP',
  'สมุดบัญชีฟาร์ม': 'สมุดบัญชีรายรับรายจ่าย',
  'สมุดบัญชีกลุ่มเกษตรกร': 'สมุดบัญชีรายรับรายจ่าย',
  'อุปกรณ์เพาะเห็ดนางฟ้า': 'ชุดเพาะเห็ด',
  'อุปกรณ์เลี้ยงหมูขุน': 'อุปกรณ์คอกหมู',
  'เครื่องสไลด์มะม่วง เครื่องอบแห้ง': 'เครื่องอบแห้งผลไม้',
  'ฉลากสินค้าเกษตร สติ๊กเกอร์': 'สติ๊กเกอร์ฉลากสินค้า',
  'ลังใส่ผัก ถุงแพ็คผัก': 'ลังพลาสติกใส่ผัก',
}));

const queuedByQuery = new Map(queue.map((row) => [normalize(row.query), row]));
const noResults = state.queries.filter((row) => row.status === 'no_results');
const aggregate = new Map();
for (const result of noResults) {
  const original = queuedByQuery.get(normalize(result.query));
  if (!original) throw new Error(`No queue provenance for ${result.query}`);
  const fallbackQuery = fallbackByQuery.get(result.query);
  if (!fallbackQuery) throw new Error(`No fallback query for ${result.query}`);
  const key = normalize(fallbackQuery);
  const row = aggregate.get(key) ?? {
    query: fallbackQuery,
    fallback_for_queries: [],
    core_topics: new Set(),
    categories: new Set(),
    subcategories: new Set(),
    parent_topics: new Set(),
    primary_keywords: new Set(),
    source: original.source,
    source_row_ids: new Set(),
    source_slugs: new Set(),
    priority_counts: {},
  };
  row.fallback_for_queries.push(original.query);
  (original.core_topics ?? []).forEach((value) => row.core_topics.add(value));
  (original.categories ?? []).forEach((value) => row.categories.add(value));
  (original.subcategories ?? []).forEach((value) => row.subcategories.add(value));
  (original.parent_topics ?? []).forEach((value) => row.parent_topics.add(value));
  (original.primary_keywords ?? []).forEach((value) => row.primary_keywords.add(value));
  (original.source_row_ids ?? []).forEach((value) => row.source_row_ids.add(value));
  (original.source_slugs ?? []).forEach((value) => row.source_slugs.add(value));
  for (const [priority, count] of Object.entries(original.priority_counts ?? {})) {
    row.priority_counts[priority] = (row.priority_counts[priority] ?? 0) + count;
  }
  aggregate.set(key, row);
}

const fallbackQueue = [...aggregate.values()].map((row) => ({
  query: row.query,
  fallback_for_queries: row.fallback_for_queries,
  core_topics: [...row.core_topics],
  categories: [...row.categories],
  subcategories: [...row.subcategories],
  parent_topics: [...row.parent_topics],
  primary_keywords: [...row.primary_keywords],
  source: row.source,
  source_row_count: row.source_row_ids.size,
  source_row_ids: [...row.source_row_ids],
  source_slugs: [...row.source_slugs],
  priority_counts: row.priority_counts,
})).sort((a, b) => a.query.localeCompare(b.query, 'th'));

fs.writeFileSync(path.join(dataDir, 'query-fallback-queue.json'), `${JSON.stringify(fallbackQueue, null, 2)}\n`);
console.log(JSON.stringify({ original_no_results: noResults.length, fallback_queries: fallbackQueue.length }, null, 2));
