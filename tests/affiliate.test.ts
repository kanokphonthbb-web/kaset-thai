import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

// Non-negotiable rule (data/affiliate-v2/CLAUDE-CODE-HANDOFF.md): every outbound Shopee link
// anywhere in the system must be an exact catalog affiliate_url matching this pattern — never
// a self-generated, guessed, or rewritten link. Must stay in sync with SHOPEE_URL_RE in
// scripts/import-affiliate-v2-products.mjs, the script that actually enforces this on write.
const SHOPEE_URL_RE = /^https:\/\/s\.shopee\.co\.th\//;

const ROOT = path.resolve(__dirname, "..");
const catalog = JSON.parse(
  readFileSync(path.join(ROOT, "data/affiliate-v2/products-affiliate-only-v2.json"), "utf8"),
);

test("affiliate allowlist regex accepts only s.shopee.co.th links", () => {
  assert.ok(SHOPEE_URL_RE.test("https://s.shopee.co.th/9fJJe0fbtY"));
  assert.ok(!SHOPEE_URL_RE.test("http://s.shopee.co.th/9fJJe0fbtY")); // must be https
  assert.ok(!SHOPEE_URL_RE.test("https://shopee.co.th/product/123")); // missing s. subdomain
  assert.ok(!SHOPEE_URL_RE.test("https://shope.co.th/9fJJe0fbtY")); // typosquat domain
  assert.ok(!SHOPEE_URL_RE.test("https://s.shopee.co.th.evil.com/9fJJe0fbtY")); // domain suffix trick
  assert.ok(!SHOPEE_URL_RE.test("")); // empty
});

test("every catalog product with an affiliate_url uses only the allowlisted Shopee format", () => {
  assert.ok(catalog.products.length > 0, "catalog should not be empty");
  const violations = catalog.products
    .filter((p: any) => p.affiliate_url)
    .filter((p: any) => !SHOPEE_URL_RE.test(p.affiliate_url))
    .map((p: any) => ({ id: p.id, affiliate_url: p.affiliate_url }));
  assert.deepEqual(violations, []);
});

test("every catalog product eligible for auto-publish (not flagged for manual review) has a valid affiliate_url", () => {
  const violations = catalog.products
    .filter((p: any) => !p.needs_manual_review)
    .filter((p: any) => !p.affiliate_url || !SHOPEE_URL_RE.test(p.affiliate_url))
    .map((p: any) => ({ id: p.id, affiliate_url: p.affiliate_url }));
  assert.deepEqual(violations, []);
});

// Opportunistic live-DB check: only runs when Turso credentials are present in the environment
// (they aren't by default for `npm test`; scripts load them from .env.vercel explicitly). When
// available, this is the strongest guarantee — it checks what's actually live, not just the
// source catalog.
test("live Product.affiliateLink values match the allowlist (skipped without TURSO_DATABASE_URL)", async (t) => {
  if (!process.env.TURSO_DATABASE_URL) {
    t.skip("TURSO_DATABASE_URL not set in this environment");
    return;
  }
  const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
  const { createClient } = await import("@libsql/client");
  const { PrismaClient } = await import("@prisma/client");
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  try {
    const rows = await prisma.product.findMany({ select: { id: true, affiliateLink: true } });
    const violations = rows.filter((r) => !SHOPEE_URL_RE.test(r.affiliateLink));
    assert.deepEqual(violations, []);
  } finally {
    await prisma.$disconnect();
  }
});
