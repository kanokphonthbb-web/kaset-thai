import { test } from "node:test";
import assert from "node:assert/strict";

import { compareFertilizers } from "../lib/calc/fertilizerCompare";

test("compareFertilizers: 46-0-0 50kg bag 1100 baht", () => {
  const [result] = compareFertilizers([
    { name: "ยูเรีย 46-0-0", n: 46, p: 0, k: 0, bagWeightKg: 50, bagPrice: 1100 },
  ]);
  assert.equal(result.costPerKgFertilizer, 1100 / 50);
  assert.ok(Math.abs((result.costPerKgN as number) - 1100 / (50 * 0.46)) < 1e-9);
  assert.equal(result.costPerKgP2O5, null);
  assert.equal(result.costPerKgK2O, null);
});

test("compareFertilizers: 15-15-15 case", () => {
  const [result] = compareFertilizers([
    { name: "สูตรเสมอ 15-15-15", n: 15, p: 15, k: 15, bagWeightKg: 50, bagPrice: 900 },
  ]);
  const expectedNutrientCost = 900 / (50 * 0.15);
  assert.ok(Math.abs((result.costPerKgN as number) - expectedNutrientCost) < 1e-9);
  assert.ok(Math.abs((result.costPerKgP2O5 as number) - expectedNutrientCost) < 1e-9);
  assert.ok(Math.abs((result.costPerKgK2O as number) - expectedNutrientCost) < 1e-9);
});

test("compareFertilizers returns null nutrient cost when nutrient content is 0", () => {
  const [result] = compareFertilizers([
    { name: "0-0-60", n: 0, p: 0, k: 60, bagWeightKg: 50, bagPrice: 700 },
  ]);
  assert.equal(result.costPerKgN, null);
  assert.equal(result.costPerKgP2O5, null);
  assert.ok(result.costPerKgK2O !== null);
});

test("compareFertilizers returns null costPerKgFertilizer when bagWeightKg <= 0", () => {
  const [result] = compareFertilizers([
    { name: "invalid", n: 15, p: 15, k: 15, bagWeightKg: 0, bagPrice: 900 },
  ]);
  assert.equal(result.costPerKgFertilizer, null);
  assert.equal(result.costPerKgN, null);
});

test("compareFertilizers returns [] for empty array", () => {
  assert.deepEqual(compareFertilizers([]), []);
});

test("compareFertilizers throws RangeError on out-of-range percentage", () => {
  assert.throws(
    () =>
      compareFertilizers([
        { name: "bad", n: 101, p: 0, k: 0, bagWeightKg: 50, bagPrice: 900 },
      ]),
    RangeError
  );
  assert.throws(
    () =>
      compareFertilizers([
        { name: "bad", n: 0, p: -5, k: 0, bagWeightKg: 50, bagPrice: 900 },
      ]),
    RangeError
  );
});
