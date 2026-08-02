import assert from "node:assert/strict";
import test from "node:test";
import categoryOverrides from "../data/productCategoryOverrides.json";
import { PRODUCT_CATEGORIES } from "../lib/productCategories";

test("reviewed product category overrides are complete and valid", () => {
  const allowedCategories = new Set(PRODUCT_CATEGORIES.map((category) => category.slug));
  const entries = Object.entries(categoryOverrides);

  assert.equal(entries.length, 54);
  for (const [slug, category] of entries) {
    assert.match(slug, /^product-\d+$/u);
    assert.equal(allowedCategories.has(category), true, `${slug}: ${category}`);
  }
});
