import { test } from "node:test";
import assert from "node:assert/strict";

import { computeSolarPumpEstimate } from "../lib/calc/solarPump";

test("computeSolarPumpEstimate: 750W x 4h = 3000 Wh", () => {
  const result = computeSolarPumpEstimate({ pumpWatts: 750, hoursPerDay: 4, sunHoursPerDay: 4.5 });
  assert.equal(result.energyWhPerDay, 3000);
});

test("computeSolarPumpEstimate: sun 4.5h loss 30% -> ~952.38W", () => {
  const result = computeSolarPumpEstimate({ pumpWatts: 750, hoursPerDay: 4, sunHoursPerDay: 4.5 });
  assert.ok(result.requiredPanelWatts !== null);
  assert.ok(Math.abs((result.requiredPanelWatts as number) - 3000 / (4.5 * 0.7)) < 1e-9);
});

test("computeSolarPumpEstimate returns null requiredPanelWatts when sunHoursPerDay <= 0", () => {
  const result = computeSolarPumpEstimate({ pumpWatts: 750, hoursPerDay: 4, sunHoursPerDay: 0 });
  assert.equal(result.requiredPanelWatts, null);
});

test("computeSolarPumpEstimate clamps systemLossPct to max 90", () => {
  const result = computeSolarPumpEstimate({
    pumpWatts: 750,
    hoursPerDay: 4,
    sunHoursPerDay: 4.5,
    systemLossPct: 95,
  });
  assert.ok(Math.abs((result.requiredPanelWatts as number) - 3000 / (4.5 * 0.1)) < 1e-9);
});
