// ─────────────────────────────────────────────────────────────
// สินค้าเพื่อการเกษตร (affiliate) — data access + safe in-article keyword linking
// ─────────────────────────────────────────────────────────────
import { parse, HTMLElement } from "node-html-parser";
import { prisma } from "@/lib/prisma";

export type Product = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  keywords: string[];
};

function toProduct(row: {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  keywords: string;
}): Product {
  let keywords: string[] = [];
  try {
    keywords = JSON.parse(row.keywords);
  } catch {
    keywords = [];
  }
  return { ...row, keywords };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? toProduct(row) : null;
}

export async function getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows.map(toProduct);
}

/**
 * Find products whose keyword(s) appear in `text`, longest-keyword-match first
 * so a specific match ("ปุ๋ยข้าวหอมมะลิ") outranks a generic one ("ปุ๋ย").
 * One entry per product (never returns the same product twice).
 */
export function findMatchingProducts(text: string, products: Product[], max = 3): Product[] {
  type Hit = { product: Product; keyword: string };
  const hits: Hit[] = [];
  for (const product of products) {
    for (const keyword of product.keywords) {
      if (keyword && text.includes(keyword)) {
        hits.push({ product, keyword });
        break; // one hit per product is enough to qualify it
      }
    }
  }
  hits.sort((a, b) => b.keyword.length - a.keyword.length);
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const hit of hits) {
    if (seen.has(hit.product.id)) continue;
    seen.add(hit.product.id);
    result.push(hit.product);
    if (result.length >= max) break;
  }
  return result;
}

const SKIP_TAGS = new Set(["a", "script", "style", "h1", "h2", "h3", "h4", "h5", "h6"]);

/**
 * Wraps the first occurrence of each matched product keyword in article HTML
 * with a link to /products/[slug] — an internal link, not the raw affiliate URL.
 * Walks text nodes only via node-html-parser (never touches tag markup/attributes),
 * so it can safely run on stored HTML at render time without risk of corrupting it.
 * Capped at `max` inserted links total to keep the tone editorial, not sales-heavy.
 */
export function injectProductLinks(html: string, products: Product[], max = 3): string {
  if (!html || products.length === 0) return html;

  // Sort candidate keywords longest-first across all products for specific-match priority.
  const candidates = products
    .flatMap((p) => p.keywords.map((k) => ({ keyword: k, product: p })))
    .filter((c) => c.keyword && c.keyword.length >= 2)
    .sort((a, b) => b.keyword.length - a.keyword.length);

  const root = parse(html);
  const usedProductIds = new Set<string>();
  let inserted = 0;

  function walk(node: HTMLElement) {
    if (inserted >= max) return;
    for (const child of [...node.childNodes]) {
      if (inserted >= max) return;
      if (child.nodeType === 1) {
        // element node
        const el = child as HTMLElement;
        const tagName = el.tagName?.toLowerCase();
        if (tagName && SKIP_TAGS.has(tagName)) continue;
        walk(el);
      } else if (child.nodeType === 3) {
        // text node — no replaceWith on TextNode, so swap it for a <span> wrapper
        // via the parent's exchangeChild (parent is always an HTMLElement here).
        const text = child.rawText;
        if (!text || !text.trim()) continue;
        for (const { keyword, product } of candidates) {
          if (usedProductIds.has(product.id)) continue;
          const idx = text.indexOf(keyword);
          if (idx === -1) continue;
          const before = text.slice(0, idx);
          const after = text.slice(idx + keyword.length);
          const link = `<a href="/products/${product.slug}" class="cc-product-link">${keyword}</a>`;
          const wrapperRoot = parse(`<span>${before}${link}${after}</span>`);
          const wrapperSpan = wrapperRoot.childNodes[0] as HTMLElement;
          node.exchangeChild(child, wrapperSpan);
          usedProductIds.add(product.id);
          inserted++;
          break;
        }
        if (inserted >= max) return;
      }
    }
  }

  walk(root);
  return inserted > 0 ? root.toString() : html;
}
