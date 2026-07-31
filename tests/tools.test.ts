import { test } from "node:test";
import assert from "node:assert/strict";

import { track, TOOL_EVENTS } from "../lib/analytics";
import { matchProductsFromList, type Product } from "../lib/affiliateMatch";

// ── analytics ──────────────────────────────────────────
test("track no-ops safely when window is undefined (SSR)", () => {
  const originalWindow = (globalThis as any).window;
  delete (globalThis as any).window;
  try {
    assert.doesNotThrow(() => track(TOOL_EVENTS.tool_view, { tool: "plant-cost" }));
  } finally {
    if (originalWindow !== undefined) (globalThis as any).window = originalWindow;
  }
});

test("track no-ops safely when window.dataLayer is undefined (no GTM configured)", () => {
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  try {
    assert.doesNotThrow(() => track(TOOL_EVENTS.tool_start));
  } finally {
    if (originalWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = originalWindow;
  }
});

test("track pushes { event, ...params } onto window.dataLayer when present", () => {
  const originalWindow = (globalThis as any).window;
  const dataLayer: unknown[] = [];
  (globalThis as any).window = { dataLayer };
  try {
    track(TOOL_EVENTS.tool_submit, { tool: "animal-cost", result_group: "medium" });
    assert.deepEqual(dataLayer, [
      { event: "tool_submit", tool: "animal-cost", result_group: "medium" },
    ]);
  } finally {
    if (originalWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = originalWindow;
  }
});

// ── affiliateMatch ─────────────────────────────────────
function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: overrides.id ?? "p1",
    slug: overrides.slug ?? "p1",
    name: overrides.name ?? "สินค้า",
    imageUrl: "",
    affiliateLink: "https://s.shopee.co.th/xxx",
    category: overrides.category ?? "",
    keywords: overrides.keywords ?? [],
    whyNeeded: "",
    benefits: [],
    usage: "",
    shopeeId: null,
    status: overrides.status ?? "active",
    howToChoose: "",
    useCases: [],
    safetyNote: "",
    priceLabel: "",
    priceCheckedAt: null,
    relatedArticles: [],
    ...overrides,
  };
}

test("matchProductsFromList returns products whose category/keywords overlap tags (case-insensitive)", () => {
  const products = [
    makeProduct({ id: "1", category: "Poultry", keywords: ["กรงไก่"] }),
    makeProduct({ id: "2", category: "plants", keywords: ["ปุ๋ย"] }),
  ];
  const result = matchProductsFromList(products, ["POULTRY"]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});

test("matchProductsFromList returns empty array when nothing matches", () => {
  const products = [makeProduct({ id: "1", category: "poultry", keywords: ["กรงไก่"] })];
  const result = matchProductsFromList(products, ["ปศุสัตว์ไม่เกี่ยว"]);
  assert.deepEqual(result, []);
});

test("matchProductsFromList respects opts.max (capped between 3 and 5)", () => {
  const products = Array.from({ length: 8 }, (_, i) =>
    makeProduct({ id: `p${i}`, category: "poultry" }),
  );
  assert.equal(matchProductsFromList(products, ["poultry"], { max: 2 }).length, 3); // floor at 3
  assert.equal(matchProductsFromList(products, ["poultry"], { max: 10 }).length, 5); // cap at 5
  assert.equal(matchProductsFromList(products, ["poultry"], { max: 4 }).length, 4);
});

test("matchProductsFromList excludes products with status 'held'", () => {
  const products = [
    makeProduct({ id: "1", category: "poultry", status: "held" }),
    makeProduct({ id: "2", category: "poultry", status: "active" }),
  ];
  const result = matchProductsFromList(products, ["poultry"]);
  assert.deepEqual(
    result.map((p) => p.id),
    ["2"],
  );
});
