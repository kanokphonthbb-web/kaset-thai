import { test } from "node:test";
import assert from "node:assert/strict";

import { computeRequiredFlow } from "../lib/calc/pumpFlow";

test("computeRequiredFlow: 8000L over 2h = 4000 L/h = 4 m3/h", () => {
  const result = computeRequiredFlow({ totalLitersPerCycle: 8000, operatingHours: 2 });
  assert.ok(result);
  assert.equal(result?.litersPerHour, 4000);
  assert.equal(result?.cubicMPerHour, 4);
});

test("computeRequiredFlow returns null when operatingHours <= 0", () => {
  assert.equal(computeRequiredFlow({ totalLitersPerCycle: 8000, operatingHours: 0 }), null);
  assert.equal(computeRequiredFlow({ totalLitersPerCycle: 8000, operatingHours: -1 }), null);
});
