import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_CANONICAL_GROUPS,
  PRODUCT_REDIRECTS,
  canonicalProductGroup,
  canonicalProductSlug,
  isCanonicalProductSlug,
} from "../lib/productCanonical.mjs";
import { PRODUCT_CATEGORIES, getProductCategoryInfo } from "../lib/productCategories";

test("reviewed product consolidation map is complete and cycle-free", () => {
  assert.equal(PRODUCT_CANONICAL_GROUPS.length, 48);
  assert.equal(Object.keys(PRODUCT_REDIRECTS).length, 61);

  const allSlugs = PRODUCT_CANONICAL_GROUPS.flatMap((group) => [
    group.canonical,
    ...group.duplicates,
  ]);
  assert.equal(new Set(allSlugs).size, allSlugs.length);

  for (const group of PRODUCT_CANONICAL_GROUPS) {
    assert.equal(canonicalProductSlug(group.canonical), group.canonical);
    assert.equal(isCanonicalProductSlug(group.canonical), true);
    assert.equal(canonicalProductGroup(group.canonical)?.canonical, group.canonical);
    for (const duplicate of group.duplicates) {
      assert.equal(canonicalProductSlug(duplicate), group.canonical);
      assert.equal(isCanonicalProductSlug(duplicate), false);
      assert.equal(PRODUCT_REDIRECTS[group.canonical], undefined);
    }
  }
});

test("product category landing pages have unique reviewed SEO content", () => {
  assert.equal(PRODUCT_CATEGORIES.length, 10);
  assert.equal(
    new Set(PRODUCT_CATEGORIES.map((category) => category.slug)).size,
    PRODUCT_CATEGORIES.length,
  );
  for (const category of PRODUCT_CATEGORIES) {
    assert.equal(getProductCategoryInfo(category.slug), category);
    assert.ok(category.description.length >= 80);
    assert.ok(category.intro.length >= 80);
    assert.ok(category.selectionTips.length >= 3);
  }
});
