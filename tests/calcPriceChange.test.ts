import { test } from "node:test";
import assert from "node:assert/strict";

import { computePriceChange } from "../lib/calc/priceChange";

test("computePriceChange detects price increase", () => {
  const result = computePriceChange(120, 100);
  assert.equal(result.absolute, 20);
  assert.equal(result.percent, 20);
});

test("computePriceChange detects price decrease", () => {
  const result = computePriceChange(80, 100);
  assert.equal(result.absolute, -20);
  assert.equal(result.percent, -20);
});

test("computePriceChange returns zero change for unchanged price", () => {
  const result = computePriceChange(100, 100);
  assert.equal(result.absolute, 0);
  assert.equal(result.percent, 0);
});

test("computePriceChange returns null when previous is 0", () => {
  const result = computePriceChange(100, 0);
  assert.equal(result.absolute, null);
  assert.equal(result.percent, null);
});

test("computePriceChange returns null when previous is null", () => {
  const result = computePriceChange(100, null);
  assert.equal(result.absolute, null);
  assert.equal(result.percent, null);
});

test("computePriceChange returns null when previous is undefined", () => {
  const result = computePriceChange(100, undefined);
  assert.equal(result.absolute, null);
  assert.equal(result.percent, null);
});
