import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validateDailyPrice,
  validateDailyPriceBatch,
  validateCropProduction,
  validateLivestockCensus,
  normalizeDailyPrice,
  normalizeCropProduction,
  normalizeLivestockCensus,
} from "../lib/agri-data/schema";

const GOOD_PRICE_ROW = {
  product_id: "rice-jasmine-01",
  product_name: "ข้าวหอมมะลิ",
  category: "ข้าว",
  market_id: "market-bangkok-01",
  market_name: "ตลาดกลางกรุงเทพ",
  province: "กรุงเทพมหานคร",
  market_type: "wholesale",
  price_type: "wholesale",
  price_min: 14.5,
  price_max: 16.2,
  price_avg: 15.35,
  unit: "บาท/กก.",
  source_date: "2026-08-10T00:00:00.000Z",
};

test("validateDailyPrice accepts a well-formed row", () => {
  const result = validateDailyPrice(GOOD_PRICE_ROW);
  assert.equal(result.ok, true);
});

test("validateDailyPrice quarantines negative prices", () => {
  const result = validateDailyPrice({ ...GOOD_PRICE_ROW, price_min: -5 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("negative")));
});

test("validateDailyPrice quarantines priceMin > priceMax", () => {
  const result = validateDailyPrice({ ...GOOD_PRICE_ROW, price_min: 120, price_max: 90 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("price_min is greater than price_max")));
});

test("validateDailyPrice quarantines missing sourceDate", () => {
  const { source_date, ...rest } = GOOD_PRICE_ROW;
  const result = validateDailyPrice(rest);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("source_date")));
});

test("validateDailyPrice quarantines a future sourceDate", () => {
  const result = validateDailyPrice({ ...GOOD_PRICE_ROW, source_date: "2099-01-01T00:00:00.000Z" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("future")));
});

test("validateDailyPrice quarantines an unknown/empty product id", () => {
  const result = validateDailyPrice({ ...GOOD_PRICE_ROW, product_id: "" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("product_id")));
});

test("validateDailyPrice rejects non-object rows", () => {
  const result = validateDailyPrice(null);
  assert.equal(result.ok, false);
});

test("validateDailyPriceBatch partitions valid vs quarantined rows", () => {
  const { valid, quarantined } = validateDailyPriceBatch([
    GOOD_PRICE_ROW,
    { ...GOOD_PRICE_ROW, price_min: -1 },
  ]);
  assert.equal(valid.length, 1);
  assert.equal(quarantined.length, 1);
});

test("normalizeDailyPrice maps raw payload to product/market/snapshot shape", () => {
  const { product, market, snapshot } = normalizeDailyPrice(GOOD_PRICE_ROW);

  assert.deepEqual(product, {
    sourceProductId: "rice-jasmine-01",
    nameTh: "ข้าวหอมมะลิ",
    category: "ข้าว",
    unit: "บาท/กก.",
  });

  assert.deepEqual(market, {
    sourceMarketId: "market-bangkok-01",
    name: "ตลาดกลางกรุงเทพ",
    province: "กรุงเทพมหานคร",
    marketType: "wholesale",
  });

  assert.equal(snapshot.priceType, "wholesale");
  assert.equal(snapshot.priceMin, 14.5);
  assert.equal(snapshot.priceMax, 16.2);
  assert.equal(snapshot.priceAvg, 15.35);
  assert.ok(snapshot.sourceDate instanceof Date);
  assert.equal(snapshot.sourceDate.toISOString(), "2026-08-10T00:00:00.000Z");
});

test("normalizeDailyPrice returns null market when no market_id present", () => {
  const { market_id, market_name, ...rest } = GOOD_PRICE_ROW;
  const { market } = normalizeDailyPrice(rest as typeof GOOD_PRICE_ROW);
  assert.equal(market, null);
});

const GOOD_CROP_ROW = {
  crop_id: "rice-2026",
  crop_name: "ข้าว",
  year: 2026,
  province_id: "th-10",
  province_name: "กรุงเทพมหานคร",
  planted_area_rai: 120000,
  harvested_area_rai: 115000,
  production_ton: 55000,
  yield_per_rai_kg: 478,
  source_date: "2026-06-01T00:00:00.000Z",
};

test("validateCropProduction accepts a well-formed row", () => {
  const result = validateCropProduction(GOOD_CROP_ROW);
  assert.equal(result.ok, true);
});

test("validateCropProduction quarantines a negative area", () => {
  const result = validateCropProduction({ ...GOOD_CROP_ROW, planted_area_rai: -500 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("negative")));
});

test("normalizeCropProduction maps raw payload to CropProduction shape", () => {
  const model = normalizeCropProduction(GOOD_CROP_ROW);
  assert.equal(model.cropSourceId, "rice-2026");
  assert.equal(model.year, 2026);
  assert.equal(model.provinceId, "th-10");
  assert.equal(model.productionTon, 55000);
  assert.ok(model.sourceDate instanceof Date);
});

const GOOD_LIVESTOCK_ROW = {
  year: 2026,
  province_id: "th-40",
  province_name: "ขอนแก่น",
  district_name: "เมืองขอนแก่น",
  livestock_type: "โคเนื้อ",
  farmer_count: 1200,
  animal_count: 8500,
  source_date: "2026-05-01T00:00:00.000Z",
};

test("validateLivestockCensus accepts a well-formed row", () => {
  const result = validateLivestockCensus(GOOD_LIVESTOCK_ROW);
  assert.equal(result.ok, true);
});

test("validateLivestockCensus quarantines a negative farmer_count", () => {
  const result = validateLivestockCensus({ ...GOOD_LIVESTOCK_ROW, farmer_count: -10 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("negative")));
});

test("normalizeLivestockCensus maps raw payload to LivestockCensus shape", () => {
  const model = normalizeLivestockCensus(GOOD_LIVESTOCK_ROW);
  assert.equal(model.provinceId, "th-40");
  assert.equal(model.livestockType, "โคเนื้อ");
  assert.equal(model.farmerCount, 1200);
  assert.equal(model.animalCount, 8500);
  assert.ok(model.sourceDate instanceof Date);
});
