import { test } from "node:test";
import assert from "node:assert/strict";

import { computeFarmIncome } from "../lib/calc/farmIncome";

test("computeFarmIncome computes revenue, cost, profit for a normal case", () => {
  const result = computeFarmIncome({
    areaRai: 10,
    yieldPerRai: 500,
    pricePerKg: 8,
    totalCost: 30000,
  });
  assert.equal(result.totalYieldKg, 5000);
  assert.equal(result.revenue, 40000);
  assert.equal(result.cost, 30000);
  assert.equal(result.profit, 10000);
  assert.equal(result.profitMarginPct, 25);
  assert.equal(result.revenuePerRai, 4000);
  assert.equal(result.profitPerRai, 1000);
  assert.equal(result.breakEvenPricePerKg, 6);
});

test("computeFarmIncome handles zero area", () => {
  const result = computeFarmIncome({
    areaRai: 0,
    yieldPerRai: 500,
    pricePerKg: 8,
    totalCost: 1000,
  });
  assert.equal(result.totalYieldKg, 0);
  assert.equal(result.revenue, 0);
  assert.equal(result.revenuePerRai, null);
  assert.equal(result.profitPerRai, null);
  assert.equal(result.profitMarginPct, null);
  assert.equal(result.breakEvenPricePerKg, null);
});

test("computeFarmIncome handles zero yield", () => {
  const result = computeFarmIncome({
    areaRai: 5,
    yieldPerRai: 0,
    pricePerKg: 8,
    totalCost: 1000,
  });
  assert.equal(result.totalYieldKg, 0);
  assert.equal(result.revenue, 0);
  assert.equal(result.breakEvenPricePerKg, null);
  assert.equal(result.profitMarginPct, null);
  assert.equal(result.revenuePerRai, 0);
});

test("computeFarmIncome handles zero price", () => {
  const result = computeFarmIncome({
    areaRai: 5,
    yieldPerRai: 500,
    pricePerKg: 0,
    totalCost: 1000,
  });
  assert.equal(result.revenue, 0);
  assert.equal(result.profit, -1000);
  assert.equal(result.profitMarginPct, null);
});

test("computeFarmIncome handles negative profit (loss)", () => {
  const result = computeFarmIncome({
    areaRai: 10,
    yieldPerRai: 100,
    pricePerKg: 5,
    totalCost: 10000,
  });
  assert.equal(result.revenue, 5000);
  assert.equal(result.profit, -5000);
  assert.equal(result.profitMarginPct, -100);
  assert.equal(result.profitPerRai, -500);
});
