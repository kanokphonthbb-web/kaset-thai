import { test } from "node:test";
import assert from "node:assert/strict";

import { SQM_PER_RAI } from "../lib/landArea";
import { computePlantCount } from "../lib/calc/plantSpacing";

test("computePlantCount: durian 8x8m spacing on 1 rai gives 25 plants/rai", () => {
  const result = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: 8,
    plantSpacingM: 8,
  });
  assert.equal(result.areaPerPlantSqm, 64);
  assert.equal(result.usableAreaSqm, SQM_PER_RAI);
  assert.equal(result.plantCount, 25);
  assert.equal(result.plantsPerRai, 25);
});

test("computePlantCount returns null plant counts when spacing is zero", () => {
  const result = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: 0,
    plantSpacingM: 8,
  });
  assert.equal(result.areaPerPlantSqm, 0);
  assert.equal(result.plantCount, null);
  assert.equal(result.plantsPerRai, null);
});

test("computePlantCount returns null plant counts when spacing is negative", () => {
  const result = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: -3,
    plantSpacingM: 3,
  });
  assert.equal(result.plantCount, null);
  assert.equal(result.plantsPerRai, null);
});

test("computePlantCount applies usablePct correctly", () => {
  const result = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: 8,
    plantSpacingM: 8,
    usablePct: 80,
  });
  assert.equal(result.usableAreaSqm, SQM_PER_RAI * 0.8);
  assert.equal(result.plantCount, Math.floor((SQM_PER_RAI * 0.8) / 64));
});

test("computePlantCount clamps usablePct out of range", () => {
  const over = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: 8,
    plantSpacingM: 8,
    usablePct: 150,
  });
  assert.equal(over.usableAreaSqm, SQM_PER_RAI);

  const under = computePlantCount({
    areaSqm: SQM_PER_RAI,
    rowSpacingM: 8,
    plantSpacingM: 8,
    usablePct: -50,
  });
  assert.equal(under.usableAreaSqm, 0);
  assert.equal(under.plantCount, 0);
});
