import { test } from "node:test";
import assert from "node:assert/strict";

import { computeFertilizerPlan, computeNpkContent } from "../lib/calc/fertilizer";

test("computeFertilizerPlan computes bags with ceil rounding", () => {
  const result = computeFertilizerPlan({
    areaRai: 2.4,
    ratePerRaiKg: 50,
    bagSizeKg: 50,
    bagPrice: 600,
  });
  assert.equal(result.totalKg, 120);
  assert.equal(result.bags, 3);
  assert.equal(result.totalCost, 1800);
  assert.equal(result.costPerRai, 1800 / 2.4);
});

test("computeFertilizerPlan returns null bags/cost when bagSizeKg <= 0", () => {
  const result = computeFertilizerPlan({
    areaRai: 2,
    ratePerRaiKg: 50,
    bagSizeKg: 0,
    bagPrice: 600,
  });
  assert.equal(result.totalKg, 100);
  assert.equal(result.bags, null);
  assert.equal(result.totalCost, null);
  assert.equal(result.costPerRai, null);
});

test("computeFertilizerPlan returns null costPerRai when areaRai <= 0", () => {
  const result = computeFertilizerPlan({
    areaRai: 0,
    ratePerRaiKg: 50,
    bagSizeKg: 50,
    bagPrice: 600,
  });
  assert.equal(result.costPerRai, null);
});

test("computeNpkContent: 46-0-0 (urea) at 50kg gives 23kg N", () => {
  const result = computeNpkContent({ formula: { n: 46, p: 0, k: 0 }, amountKg: 50 });
  assert.equal(result.nKg, 23);
  assert.equal(result.p2o5Kg, 0);
  assert.equal(result.k2oKg, 0);
});

test("computeNpkContent: 15-15-15 at 100kg gives 15/15/15", () => {
  const result = computeNpkContent({ formula: { n: 15, p: 15, k: 15 }, amountKg: 100 });
  assert.equal(result.nKg, 15);
  assert.equal(result.p2o5Kg, 15);
  assert.equal(result.k2oKg, 15);
});

test("computeNpkContent throws RangeError on out-of-range percentage", () => {
  assert.throws(
    () => computeNpkContent({ formula: { n: 101, p: 0, k: 0 }, amountKg: 50 }),
    RangeError
  );
  assert.throws(
    () => computeNpkContent({ formula: { n: 0, p: -5, k: 0 }, amountKg: 50 }),
    RangeError
  );
});
