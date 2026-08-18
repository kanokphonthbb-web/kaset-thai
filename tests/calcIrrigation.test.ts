import { test } from "node:test";
import assert from "node:assert/strict";

import { computeIrrigation } from "../lib/calc/irrigation";

test("computeIrrigation computes liters per cycle correctly", () => {
  const result = computeIrrigation({
    plants: 100,
    emittersPerPlant: 2,
    litersPerHourPerEmitter: 4,
    hoursPerCycle: 1,
    cyclesPerDay: 1,
  });
  assert.equal(result.litersPerCycle, 800);
  assert.equal(result.litersPerDay, 800);
  assert.equal(result.cubicMPerDay, 0.8);
});

test("computeIrrigation computes monthly totals with default daysPerMonth = 30", () => {
  const result = computeIrrigation({
    plants: 100,
    emittersPerPlant: 2,
    litersPerHourPerEmitter: 4,
    hoursPerCycle: 1,
    cyclesPerDay: 2,
  });
  assert.equal(result.litersPerDay, 1600);
  assert.equal(result.litersPerMonth, 1600 * 30);
  assert.equal(result.cubicMPerMonth, (1600 * 30) / 1000);
});

test("computeIrrigation respects custom daysPerMonth", () => {
  const result = computeIrrigation({
    plants: 100,
    emittersPerPlant: 2,
    litersPerHourPerEmitter: 4,
    hoursPerCycle: 1,
    cyclesPerDay: 1,
    daysPerMonth: 20,
  });
  assert.equal(result.litersPerMonth, 800 * 20);
});

test("computeIrrigation computes monthly water cost when provided", () => {
  const result = computeIrrigation({
    plants: 100,
    emittersPerPlant: 2,
    litersPerHourPerEmitter: 4,
    hoursPerCycle: 1,
    cyclesPerDay: 1,
    waterCostPerCubicM: 15,
  });
  assert.equal(result.cubicMPerMonth, 24);
  assert.equal(result.monthlyWaterCost, 24 * 15);
});

test("computeIrrigation returns null monthlyWaterCost when not provided", () => {
  const result = computeIrrigation({
    plants: 100,
    emittersPerPlant: 2,
    litersPerHourPerEmitter: 4,
    hoursPerCycle: 1,
    cyclesPerDay: 1,
  });
  assert.equal(result.monthlyWaterCost, null);
});
