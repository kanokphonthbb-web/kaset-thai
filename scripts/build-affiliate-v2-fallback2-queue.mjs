#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'affiliate-v2');
const priorQueue = JSON.parse(fs.readFileSync(path.join(dataDir, 'query-fallback-queue.json'), 'utf8'));
const priorState = JSON.parse(fs.readFileSync(path.join(dataDir, 'browser-state-fallback.json'), 'utf8'));
const rowByQuery = new Map(priorQueue.map((row) => [row.query, row]));
const fallbackMap = new Map(Object.entries({
  'ชุดปลูกผัก ปุ๋ยหมัก': 'ชุดปลูกผัก',
  'แบบบันทึก GAP': 'สมุดบันทึกการเกษตร',
  'อุปกรณ์เกษตรผสมผสาน': 'อุปกรณ์การเกษตร',
}));

const queue = priorState.queries.filter((row) => row.status === 'no_results').map((result) => {
  const source = rowByQuery.get(result.query);
  const query = fallbackMap.get(result.query);
  if (!source || !query) throw new Error(`Missing second fallback provenance for ${result.query}`);
  return { ...source, query, second_fallback_for_query: result.query };
});

fs.writeFileSync(path.join(dataDir, 'query-fallback2-queue.json'), `${JSON.stringify(queue, null, 2)}\n`);
console.log(JSON.stringify({ second_fallback_queries: queue.length, queries: queue.map((row) => row.query) }, null, 2));
