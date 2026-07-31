// ─────────────────────────────────────────────────────────────
// Affiliate product matching for tool pages — reuses lib/products.ts'
// Prisma-backed catalog access (already filters status "active").
// ─────────────────────────────────────────────────────────────
import { getAllProducts, type Product } from "@/lib/products";

export type { Product };

const DEFAULT_MAX = 5;
const HARD_CAP = 5;
const MIN_CAP = 3;

/**
 * Pure matching logic over an already-fetched product list — mirrors the
 * findMatchingProducts(text, products, max) pattern in lib/products.ts so
 * this can be unit-tested without a database. Matches products whose
 * category or keywords overlap the given tags (case-insensitive).
 * Defensively re-checks status "active" (never "held") even though the
 * Prisma-backed source query already filters for it.
 */
export function matchProductsFromList(
  products: Product[],
  tags: string[],
  opts?: { max?: number },
): Product[] {
  const normalizedTags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
  if (normalizedTags.length === 0) return [];

  const max = Math.max(MIN_CAP, Math.min(HARD_CAP, opts?.max ?? DEFAULT_MAX));

  const matches = products.filter((p) => {
    if (p.status !== "active") return false;
    const haystack = [p.category, ...p.keywords].map((s) => s.toLowerCase());
    return normalizedTags.some((tag) => haystack.some((h) => h === tag || h.includes(tag) || tag.includes(h)));
  });

  return matches.slice(0, max);
}

/**
 * Matches products whose category or keywords overlap the given tags
 * (case-insensitive). Only ever returns real, active catalog products —
 * never fabricates placeholder data. Returns [] when nothing matches.
 */
export async function matchAffiliateProducts(
  tags: string[],
  opts?: { max?: number },
): Promise<Product[]> {
  const products = await getAllProducts(); // already status: "active" only
  return matchProductsFromList(products, tags, opts);
}
