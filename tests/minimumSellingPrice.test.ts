import { test } from "node:test";
import assert from "node:assert/strict";

import { calculateMinimumSellingPrice, type MSPInput } from "../lib/minimumSellingPrice";

function closeTo(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be close to ${expected}`,
  );
}

const baseInput: MSPInput = {
  rawMaterialCost: 1000,
  laborCost: 500,
  waterCost: 100,
  electricityCost: 150,
  fertilizerFeedCost: 200,
  equipmentCost: 300,
  depreciation: 250,
  packagingCost: 100,
  shippingCost: 200,
  platformFeePct: 20,
  totalYield: 100,
  wasteAmount: 10,
  targetProfitPct: 30,
};

test("total cost is the sum of all cost inputs", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  assert.equal(r.totalCost, 2800);
});

test("sellable yield = total yield - waste", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  assert.equal(r.sellableYield, 90);
});

test("cost per unit = total cost / sellable yield", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  closeTo(r.costPerUnit, 2800 / 90);
});

test("minimum non-loss price matches hand-computed example (costPerUnit / (1 - fee%))", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  // costPerUnit = 280/9 = 31.1111...; minPrice = costPerUnit / 0.8 = 38.8888...
  closeTo(r.minPrice, 38.888889);
});

test("price at target profit matches hand-computed example ((costPerUnit * (1+profit%)) / (1-fee%))", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  // costPerUnit * 1.3 / 0.8 = (280/9 * 1.3) / 0.8 = 50.5555...
  closeTo(r.priceAtTargetProfit, 50.555556);
});

test("profit per unit at target price equals costPerUnit * targetProfitPct%", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  // 280/9 * 0.3 = 9.3333...
  closeTo(r.profitPerUnit, 9.333333);
});

test("break-even units = totalCost / netReceivedPerUnit at target price", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  // netReceivedPerUnit = priceAtTargetProfit * 0.8 = 40.4444...
  // breakEvenUnits = 2800 / 40.4444... = 69.230769...
  closeTo(r.breakEvenUnits, 69.230769, 0.01);
});

test("example wholesale/retail prices are derived from priceAtTargetProfit", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  assert.equal(r.retailPrice, r.priceAtTargetProfit);
  assert.ok(r.wholesalePrice < r.retailPrice);
  closeTo(r.wholesalePrice, r.priceAtTargetProfit * 0.88);
});

test("all 5 sensitivity scenarios are present with expected labels", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  assert.equal(r.scenarios.length, 5);
  const labels = r.scenarios.map((s) => s.label);
  assert.deepEqual(labels, [
    "ผลผลิตลดลง 10%",
    "ผลผลิตลดลง 20%",
    "ผลผลิตลดลง 30%",
    "ต้นทุนเพิ่มขึ้น 10%",
    "ต้นทุนเพิ่มขึ้น 20%",
  ]);
});

test("sensitivity scenarios match hand-computed values", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  const [y10, y20, y30, c10, c20] = r.scenarios;

  closeTo(y10.costPerUnit, 2800 / 81);
  closeTo(y10.minPrice, 2800 / 81 / 0.8);

  closeTo(y20.costPerUnit, 2800 / 72);
  closeTo(y20.minPrice, 2800 / 72 / 0.8);

  closeTo(y30.costPerUnit, 2800 / 63);
  closeTo(y30.minPrice, 2800 / 63 / 0.8);

  closeTo(c10.costPerUnit, 3080 / 90);
  closeTo(c10.minPrice, 3080 / 90 / 0.8);

  closeTo(c20.costPerUnit, 3360 / 90);
  closeTo(c20.minPrice, 3360 / 90 / 0.8);
});

test("every sensitivity scenario's minPrice is never lower than the base case", () => {
  const r = calculateMinimumSellingPrice(baseInput);
  for (const s of r.scenarios) {
    assert.ok(
      s.minPrice >= r.minPrice,
      `scenario "${s.label}" minPrice (${s.minPrice}) should be >= base minPrice (${r.minPrice})`,
    );
  }
});

test("waste >= yield is handled gracefully with an explicit error, no throw, all-zero numeric fields", () => {
  const input: MSPInput = { ...baseInput, totalYield: 50, wasteAmount: 50 };
  assert.doesNotThrow(() => calculateMinimumSellingPrice(input));
  const r = calculateMinimumSellingPrice(input);
  assert.ok(r.error);
  assert.equal(r.sellableYield, 0);
  assert.equal(r.costPerUnit, 0);
  assert.equal(r.minPrice, 0);
  assert.equal(r.scenarios.length, 0);
});

test("waste > yield (not just equal) is also handled without throwing", () => {
  const input: MSPInput = { ...baseInput, totalYield: 50, wasteAmount: 80 };
  assert.doesNotThrow(() => calculateMinimumSellingPrice(input));
  const r = calculateMinimumSellingPrice(input);
  assert.ok(r.error);
  assert.equal(r.sellableYield, 0);
});

test("platformFeePct >= 100 is handled without throwing and returns an explicit error", () => {
  const input: MSPInput = { ...baseInput, platformFeePct: 100 };
  assert.doesNotThrow(() => calculateMinimumSellingPrice(input));
  const r = calculateMinimumSellingPrice(input);
  assert.ok(r.error);
  assert.equal(r.minPrice, 0);
  assert.equal(r.scenarios.length, 0);
  // cost per unit is still a valid, independently-computable figure
  closeTo(r.costPerUnit, 2800 / 90);
});

test("platformFeePct > 100 is also handled without throwing", () => {
  const input: MSPInput = { ...baseInput, platformFeePct: 150 };
  assert.doesNotThrow(() => calculateMinimumSellingPrice(input));
  const r = calculateMinimumSellingPrice(input);
  assert.ok(r.error);
});
