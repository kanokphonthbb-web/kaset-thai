import assert from "node:assert/strict";
import test from "node:test";
import {
  articleClusterRange,
  articleContentModifiedAt,
  categoryArchiveHref,
} from "../lib/articleDiscovery";

test("articleClusterRange groups workbook article numbers in sets of ten", () => {
  assert.deepEqual(articleClusterRange(1), { start: 1, end: 10 });
  assert.deepEqual(articleClusterRange(9751), { start: 9751, end: 9760 });
  assert.deepEqual(articleClusterRange(9760), { start: 9751, end: 9760 });
  assert.equal(articleClusterRange(null), null);
  assert.equal(articleClusterRange(0), null);
});

test("categoryArchiveHref keeps page one clean and canonicalizes later pages", () => {
  assert.equal(categoryArchiveHref("plants"), "/blog/category/plants");
  assert.equal(categoryArchiveHref("plants", 2), "/blog/category/plants?page=2");
});

test("articleContentModifiedAt ignores unrelated database updatedAt changes", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const publishedAt = new Date("2026-01-02T00:00:00.000Z");
  const contentUpdatedAt = new Date("2026-01-03T00:00:00.000Z");

  assert.equal(
    articleContentModifiedAt({ contentUpdatedAt, publishedAt, createdAt }),
    contentUpdatedAt,
  );
  assert.equal(
    articleContentModifiedAt({ contentUpdatedAt: null, publishedAt, createdAt }),
    publishedAt,
  );
  assert.equal(
    articleContentModifiedAt({ contentUpdatedAt: null, publishedAt: null, createdAt }),
    createdAt,
  );
});
