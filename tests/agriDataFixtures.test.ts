import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  validateDailyPriceBatch,
  validateCropProductionBatch,
  validateLivestockCensusBatch,
} from "../lib/agri-data/schema";
import { computeChange } from "../lib/agri-data/service";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures/nabc");

function loadFixture(name: string): { rows: unknown[] } {
  return JSON.parse(readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
}

test("daily-prices-good.json fixture rows all pass validation", () => {
  const fixture = loadFixture("daily-prices-good.json");
  const { valid, quarantined } = validateDailyPriceBatch(fixture.rows);
  assert.equal(quarantined.length, 0);
  assert.equal(valid.length, fixture.rows.length);
});

test("daily-prices-bad.json fixture rows are all quarantined", () => {
  const fixture = loadFixture("daily-prices-bad.json");
  const { valid, quarantined } = validateDailyPriceBatch(fixture.rows);
  assert.equal(valid.length, 0);
  assert.equal(quarantined.length, fixture.rows.length);
});

test("daily-prices-bad.json fixture rows quarantine for the expected reasons", () => {
  const fixture = loadFixture("daily-prices-bad.json");
  const { quarantined } = validateDailyPriceBatch(fixture.rows);

  const rows = fixture.rows as Array<Record<string, unknown>>;
  const byCase = new Map(quarantined.map((q, i) => [rows[i]._case as string, q.errors]));

  assert.ok(byCase.get("negative price")?.some((e) => e.includes("negative")));
  assert.ok(byCase.get("min greater than max")?.some((e) => e.includes("price_min is greater than price_max")));
  assert.ok(byCase.get("missing source_date")?.some((e) => e.includes("source_date")));
  assert.ok(byCase.get("future source_date")?.some((e) => e.includes("future")));
  assert.ok(byCase.get("empty product_id")?.some((e) => e.includes("product_id")));
});

test("crop-production.json fixture: valid row passes, negative-area row is quarantined", () => {
  const fixture = loadFixture("crop-production.json");
  const { valid, quarantined } = validateCropProductionBatch(fixture.rows);
  assert.equal(valid.length, 1);
  assert.equal(quarantined.length, 1);
  assert.ok(quarantined[0].errors.some((e) => e.includes("negative")));
});

test("livestock-census.json fixture: valid row passes, negative farmer_count row is quarantined", () => {
  const fixture = loadFixture("livestock-census.json");
  const { valid, quarantined } = validateLivestockCensusBatch(fixture.rows);
  assert.equal(valid.length, 1);
  assert.equal(quarantined.length, 1);
  assert.ok(quarantined[0].errors.some((e) => e.includes("negative")));
});

// Integration: computeChange must never fabricate a trend. With no prior snapshot for a
// product (the current, pre-sync state of the DB — no NABC data has ever been ingested),
// it must return { absolute: null, percent: null }, never a guessed number.
test("computeChange returns null change when there is no previous snapshot", async () => {
  const result = await computeChange("nonexistent-product-id-for-testing");
  assert.deepEqual(result, { absolute: null, percent: null });
});
