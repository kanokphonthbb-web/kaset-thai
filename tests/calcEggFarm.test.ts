import { test } from "node:test";
import assert from "node:assert/strict";

import { computeEggFarmProfit } from "../lib/calc/eggFarm";

test("computeEggFarmProfit: 1000 hens, 85% lay rate", () => {
  const result = computeEggFarmProfit({
    hens: 1000,
    layRatePct: 85,
    eggPrice: 4,
    feedKgPerHenPerDay: 0.11,
    feedPricePerKg: 15,
  });
  assert.equal(result.eggsPerDay, 850);
  assert.equal(result.revenuePerDay, 3400);
  assert.equal(result.feedCostPerDay, 1650);
  assert.equal(result.otherCostPerDay, 0);
  assert.equal(result.profitPerDay, 1750);
  assert.equal(result.profitPerMonth, 52500);
});

test("computeEggFarmProfit includes otherCostPerDay when provided", () => {
  const result = computeEggFarmProfit({
    hens: 1000,
    layRatePct: 85,
    eggPrice: 4,
    feedKgPerHenPerDay: 0.11,
    feedPricePerKg: 15,
    otherCostPerDay: 200,
  });
  assert.equal(result.otherCostPerDay, 200);
  assert.equal(result.profitPerDay, 1550);
  assert.equal(result.profitPerMonth, 46500);
});

test("computeEggFarmProfit clamps layRatePct to 0-100", () => {
  const over = computeEggFarmProfit({
    hens: 100,
    layRatePct: 150,
    eggPrice: 4,
    feedKgPerHenPerDay: 0.11,
    feedPricePerKg: 15,
  });
  assert.equal(over.eggsPerDay, 100);

  const under = computeEggFarmProfit({
    hens: 100,
    layRatePct: -10,
    eggPrice: 4,
    feedKgPerHenPerDay: 0.11,
    feedPricePerKg: 15,
  });
  assert.equal(under.eggsPerDay, 0);
});
