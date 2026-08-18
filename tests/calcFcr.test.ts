import { test } from "node:test";
import assert from "node:assert/strict";

import { computeFcr } from "../lib/calc/fcr";

test("computeFcr: 150kg feed, 100kg -> 200kg gives FCR 1.5", () => {
  const result = computeFcr({
    feedConsumedKg: 150,
    startWeightKg: 100,
    endWeightKg: 200,
  });
  assert.equal(result.weightGainKg, 100);
  assert.equal(result.fcr, 1.5);
});

test("computeFcr returns null fcr on zero weight gain", () => {
  const result = computeFcr({
    feedConsumedKg: 50,
    startWeightKg: 100,
    endWeightKg: 100,
  });
  assert.equal(result.weightGainKg, 0);
  assert.equal(result.fcr, null);
});

test("computeFcr returns null fcr on negative weight gain", () => {
  const result = computeFcr({
    feedConsumedKg: 50,
    startWeightKg: 100,
    endWeightKg: 80,
  });
  assert.equal(result.weightGainKg, -20);
  assert.equal(result.fcr, null);
  assert.equal(result.feedCostPerKgGain, null);
});

test("computeFcr computes feedCostPerKgGain when feedCostTotal provided", () => {
  const result = computeFcr({
    feedConsumedKg: 150,
    startWeightKg: 100,
    endWeightKg: 200,
    feedCostTotal: 3000,
  });
  assert.equal(result.feedCostPerKgGain, 30);
});

test("computeFcr returns null feedCostPerKgGain when feedCostTotal not provided", () => {
  const result = computeFcr({
    feedConsumedKg: 150,
    startWeightKg: 100,
    endWeightKg: 200,
  });
  assert.equal(result.feedCostPerKgGain, null);
});
