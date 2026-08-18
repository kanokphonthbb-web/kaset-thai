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

// รูปจริงจาก agriapi.nabc.go.th (verified 2026-08-18) — หนึ่งแถว = ราคาหนึ่งสินค้า ณ หนึ่งตลาด
const GOOD_PRICE_ROW = {
  data_date: "2026-08-10",
  day: "10",
  month: "8",
  year_th: "2569",
  product_category: "ข้าวหอมมะลิ",
  product_name: "ข้าวเปลือกเจ้าหอมมะลิ 105",
  market_name: "ท่าข้าว ธ.ก.ส.",
  province: "ขอนแก่น",
  day_price: 18600,
  unit: "บาท/ตัน",
};

test("validateDailyPrice accepts a well-formed row", () => {
  const result = validateDailyPrice(GOOD_PRICE_ROW);
  assert.equal(result.ok, true);
});

test("validateDailyPrice quarantines non-positive prices", () => {
  const neg = validateDailyPrice({ ...GOOD_PRICE_ROW, day_price: -5 });
  assert.equal(neg.ok, false);
  if (!neg.ok) assert.ok(neg.errors.some((e) => e.includes("not positive")));
  const zero = validateDailyPrice({ ...GOOD_PRICE_ROW, day_price: 0 });
  assert.equal(zero.ok, false);
});

test("validateDailyPrice quarantines missing data_date", () => {
  const { data_date, ...rest } = GOOD_PRICE_ROW;
  const result = validateDailyPrice(rest);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("data_date")));
});

test("validateDailyPrice quarantines a future data_date", () => {
  const result = validateDailyPrice({ ...GOOD_PRICE_ROW, data_date: "2099-01-01" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("future")));
});

test("validateDailyPrice quarantines an empty product name/category", () => {
  const noName = validateDailyPrice({ ...GOOD_PRICE_ROW, product_name: "" });
  assert.equal(noName.ok, false);
  if (!noName.ok) assert.ok(noName.errors.some((e) => e.includes("product_name")));
  const noCat = validateDailyPrice({ ...GOOD_PRICE_ROW, product_category: "" });
  assert.equal(noCat.ok, false);
});

test("validateDailyPrice rejects non-object rows", () => {
  const result = validateDailyPrice(null);
  assert.equal(result.ok, false);
});

test("validateDailyPriceBatch partitions valid vs quarantined rows", () => {
  const { valid, quarantined } = validateDailyPriceBatch([
    GOOD_PRICE_ROW,
    { ...GOOD_PRICE_ROW, day_price: -1 },
  ]);
  assert.equal(valid.length, 1);
  assert.equal(quarantined.length, 1);
});

test("normalizeDailyPrice maps raw payload to product/market/snapshot shape", () => {
  const { product, market, snapshot } = normalizeDailyPrice(GOOD_PRICE_ROW);

  assert.deepEqual(product, {
    sourceProductId: "ข้าวเปลือกเจ้าหอมมะลิ 105",
    nameTh: "ข้าวเปลือกเจ้าหอมมะลิ 105",
    category: "ข้าวหอมมะลิ",
    unit: "บาท/ตัน",
  });

  assert.deepEqual(market, {
    sourceMarketId: "ท่าข้าว ธ.ก.ส.|ขอนแก่น",
    name: "ท่าข้าว ธ.ก.ส.",
    province: "ขอนแก่น",
    marketType: null,
  });

  assert.equal(snapshot.priceType, "market");
  assert.equal(snapshot.priceMin, null);
  assert.equal(snapshot.priceMax, null);
  assert.equal(snapshot.priceAvg, 18600);
  assert.ok(snapshot.sourceDate instanceof Date);
});

test("normalizeDailyPrice returns null market when no market_name present", () => {
  const { market_name, ...rest } = GOOD_PRICE_ROW;
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
