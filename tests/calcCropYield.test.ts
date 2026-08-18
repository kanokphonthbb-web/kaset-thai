import { test } from "node:test";
import assert from "node:assert/strict";

import { yieldFromPlants, yieldFromArea } from "../lib/calc/cropYield";

test("yieldFromPlants: 1000 plants, 90% survival, 2kg/plant gives 900 plants and 1800kg", () => {
  const result = yieldFromPlants({
    plants: 1000,
    survivalRatePct: 90,
    yieldPerPlantKg: 2,
  });
  assert.equal(result.survivingPlants, 900);
  assert.equal(result.totalYieldKg, 1800);
  assert.equal(result.estimatedRevenue, null);
});

test("yieldFromPlants computes estimatedRevenue when price provided", () => {
  const result = yieldFromPlants({
    plants: 1000,
    survivalRatePct: 90,
    yieldPerPlantKg: 2,
    pricePerKg: 10,
  });
  assert.equal(result.estimatedRevenue, 18000);
});

test("yieldFromPlants clamps survivalRatePct at 100 when given 150", () => {
  const result = yieldFromPlants({
    plants: 1000,
    survivalRatePct: 150,
    yieldPerPlantKg: 2,
  });
  assert.equal(result.survivingPlants, 1000);
});

test("yieldFromPlants clamps survivalRatePct at 0 when given negative", () => {
  const result = yieldFromPlants({
    plants: 1000,
    survivalRatePct: -10,
    yieldPerPlantKg: 2,
  });
  assert.equal(result.survivingPlants, 0);
  assert.equal(result.totalYieldKg, 0);
});

test("yieldFromArea computes total yield and revenue", () => {
  const result = yieldFromArea({
    areaRai: 5,
    yieldPerRaiKg: 500,
    pricePerKg: 8,
  });
  assert.equal(result.totalYieldKg, 2500);
  assert.equal(result.estimatedRevenue, 20000);
});

test("yieldFromArea returns null revenue without price", () => {
  const result = yieldFromArea({
    areaRai: 5,
    yieldPerRaiKg: 500,
  });
  assert.equal(result.totalYieldKg, 2500);
  assert.equal(result.estimatedRevenue, null);
});
