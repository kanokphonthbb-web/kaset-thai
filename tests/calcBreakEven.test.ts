import { test } from "node:test";
import assert from "node:assert/strict";

import { computeBreakEven } from "../lib/calc/breakEven";

test("computeBreakEven computes the normal case", () => {
  const result = computeBreakEven({
    fixedCosts: 10000,
    variableCosts: 20000,
    expectedYieldKg: 5000,
    sellingPricePerKg: 8,
  });
  assert.equal(result.totalCost, 30000);
  assert.equal(result.breakEvenPricePerKg, 6);
  assert.equal(result.breakEvenYieldKg, 3750);
  assert.equal(result.expectedRevenue, 40000);
  assert.equal(result.expectedProfit, 10000);
  assert.ok(result.roiPct !== null);
  assert.ok(Math.abs((result.roiPct as number) - (10000 / 30000) * 100) < 1e-9);
});

test("computeBreakEven returns null breakEvenPricePerKg when expectedYieldKg is 0", () => {
  const result = computeBreakEven({
    fixedCosts: 10000,
    variableCosts: 20000,
    expectedYieldKg: 0,
    sellingPricePerKg: 8,
  });
  assert.equal(result.breakEvenPricePerKg, null);
  assert.equal(result.expectedRevenue, 0);
  assert.equal(result.expectedProfit, -30000);
});

test("computeBreakEven returns null breakEvenYieldKg when sellingPricePerKg is 0", () => {
  const result = computeBreakEven({
    fixedCosts: 10000,
    variableCosts: 20000,
    expectedYieldKg: 5000,
    sellingPricePerKg: 0,
  });
  assert.equal(result.breakEvenYieldKg, null);
  assert.equal(result.expectedRevenue, 0);
});

test("computeBreakEven returns null roiPct when totalCost is 0", () => {
  const result = computeBreakEven({
    fixedCosts: 0,
    variableCosts: 0,
    expectedYieldKg: 5000,
    sellingPricePerKg: 8,
  });
  assert.equal(result.totalCost, 0);
  assert.equal(result.roiPct, null);
  assert.equal(result.breakEvenPricePerKg, 0);
});
