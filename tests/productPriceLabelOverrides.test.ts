import assert from "node:assert/strict";
import test from "node:test";
import priceLabelOverrides from "../data/productPriceLabelOverrides.json";
import { schemaPriceFromLabel } from "../lib/products";

test("abbreviated source prices stay visible but never become exact schema prices", () => {
  const entries = Object.entries(priceLabelOverrides);

  assert.equal(entries.length, 90);
  for (const [shopeeId, label] of entries) {
    assert.match(shopeeId, /^\d+$/u);
    assert.match(label, /^\d+(?:\.\d+)?พัน$/u);
    assert.equal(schemaPriceFromLabel(label), null, `${shopeeId}: ${label}`);
  }
});
