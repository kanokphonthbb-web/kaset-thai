import { test } from "node:test";
import assert from "node:assert/strict";

import { computeFeedCost } from "../lib/calc/feedCost";

test("computeFeedCost: 50 animals x 2kg x 12 baht x 30 days", () => {
  const result = computeFeedCost({
    animals: 50,
    feedKgPerAnimalPerDay: 2,
    feedPricePerKg: 12,
    days: 30,
  });
  assert.equal(result.feedKgPerDay, 100);
  assert.equal(result.feedKgTotal, 3000);
  assert.equal(result.totalCost, 36000);
  assert.equal(result.costPerAnimal, 720);
});

test("computeFeedCost returns null costPerAnimal when animals <= 0", () => {
  const result = computeFeedCost({
    animals: 0,
    feedKgPerAnimalPerDay: 2,
    feedPricePerKg: 12,
    days: 30,
  });
  assert.equal(result.feedKgPerDay, 0);
  assert.equal(result.feedKgTotal, 0);
  assert.equal(result.totalCost, 0);
  assert.equal(result.costPerAnimal, null);
});
