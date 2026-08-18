import { test } from "node:test";
import assert from "node:assert/strict";

import { computeSeedPlan } from "../lib/calc/seedRate";

test("computeSeedPlan: 10 rai x 15 kg/rai = 150kg", () => {
  const result = computeSeedPlan({ areaRai: 10, seedRatePerRaiKg: 15 });
  assert.equal(result.totalSeedKg, 150);
  assert.equal(result.totalCost, null);
  assert.equal(result.costPerRai, null);
});

test("computeSeedPlan computes cost when pricePerKg given", () => {
  const result = computeSeedPlan({ areaRai: 10, seedRatePerRaiKg: 15, pricePerKg: 20 });
  assert.equal(result.totalSeedKg, 150);
  assert.equal(result.totalCost, 3000);
  assert.equal(result.costPerRai, 300);
});

test("computeSeedPlan returns null costPerRai when areaRai <= 0", () => {
  const result = computeSeedPlan({ areaRai: 0, seedRatePerRaiKg: 15, pricePerKg: 20 });
  assert.equal(result.totalSeedKg, 0);
  assert.equal(result.totalCost, 0);
  assert.equal(result.costPerRai, null);
});

test("computeSeedPlan returns null cost fields without price", () => {
  const result = computeSeedPlan({ areaRai: 5, seedRatePerRaiKg: 8 });
  assert.equal(result.totalSeedKg, 40);
  assert.equal(result.totalCost, null);
  assert.equal(result.costPerRai, null);
});
