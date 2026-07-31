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
  whyNeeded: string;
  benefits: string[];
  usage: string;
  shopeeId: string | null;
  status: string;
  howToChoose: string;
  useCases: string[];
  safetyNote: string;
  priceLabel: string;
  priceCheckedAt: Date | null;
  relatedArticles: string[];
  updatedAt?: Date;
};

function toProduct(row: {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  keywords: string;
  whyNeeded: string;
  benefits: string;
  usage: string;
  shopeeId: string | null;
  status: string;
  howToChoose: string;
  useCasesJson: string;
  safetyNote: string;
  priceLabel: string;
  priceCheckedAt: Date | null;
  relatedArticlesJson: string;
  updatedAt: Date;
}): Product {
  let keywords: string[] = [];
  try {
    keywords = JSON.parse(row.keywords);
  } catch {
    keywords = [];
  }
  let benefits: string[] = [];
  try {
    benefits = JSON.parse(row.benefits);
  } catch {
    benefits = [];
  }
  let useCases: string[] = [];
  try {
    useCases = JSON.parse(row.useCasesJson);
  } catch {
    useCases = [];
  }
  let relatedArticles: string[] = [];
  try {
    relatedArticles = JSON.parse(row.relatedArticlesJson);
  } catch {
    relatedArticles = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    affiliateLink: row.affiliateLink,
    category: row.category,
    keywords,
    whyNeeded: row.whyNeeded,
    benefits,
    usage: row.usage,
    shopeeId: row.shopeeId,
    status: row.status,
    howToChoose: row.howToChoose,
    useCases,
    safetyNote: row.safetyNote,
    priceLabel: row.priceLabel,
    priceCheckedAt: row.priceCheckedAt,
    relatedArticles,
    updatedAt: row.updatedAt,
  };
}

// These pages already earned search visibility before the quality gate was added.
// Preserve them while their editorial descriptions are being expanded.
const SEARCH_PERFORMING_THIN_PRODUCTS = new Set([
  "product-404",
  "product-541",
  "product-575",
]);

function hasSubstantiveText(value: string): boolean {
  return value.trim().length >= 40;
}

export function productEditorialScore(product: Product): number {
  return (
    [product.whyNeeded, product.usage, product.howToChoose, product.safetyNote].filter(
      hasSubstantiveText,
    ).length +
    (product.benefits.filter((item) => item.trim()).length >= 2 ? 1 : 0) +
    (product.useCases.filter((item) => item.trim()).length >= 2 ? 1 : 0) +
    (product.relatedArticles.filter((item) => item.trim()).length >= 1 ? 1 : 0)
  );
}

export function isProductIndexable(product: Product): boolean {
  return SEARCH_PERFORMING_THIN_PRODUCTS.has(product.slug) || productEditorialScore(product) >= 2;
}

function compactText(value: string): string {
  return value
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ")
    .replace(/[#*_]+/g, " ")
    .replace(/^\s*[\[(][^\])]*(?:ซื้อ|แถม|ลด|ส่ง|โปรโมชั่น)[^\])]*[\])]\s*/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace >= Math.floor(maxLength * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function productSeoTitle(product: Product): string {
  const cleanedName = compactText(product.name);
  const fallback = product.keywords.find((keyword) => keyword.trim()) ?? "สินค้าเพื่อการเกษตร";
  // Root metadata adds " | เกษตรกรไทย"; 44 keeps the rendered title near 60 chars.
  return truncateAtWord(cleanedName || fallback, 44);
}

export function productSeoDescription(product: Product): string {
  const sections = [
    product.whyNeeded && "เหตุผลที่ควรใช้",
    product.benefits.length > 0 && "ประโยชน์",
    product.usage && "วิธีใช้",
    product.howToChoose && "วิธีเลือกซื้อ",
    product.safetyNote && "ข้อควรระวัง",
    product.relatedArticles.length > 0 && "บทความที่เกี่ยวข้อง",
  ].filter((section): section is string => Boolean(section));
  const details = sections.length > 0 ? sections.join(", ") : "รายละเอียดสินค้าเกษตร";
  return truncateAtWord(
    `ข้อมูล${productSeoTitle(product)}: ${details} พร้อมลิงก์ตรวจสอบรายละเอียดและราคาจากร้านค้า ราคาจริงอาจเปลี่ยนแปลงได้`,
    158,
  );
}

export function schemaPriceFromLabel(label: string): string | null {
  const normalized = label.replace(/,/g, "").replace(/^\s*฿/, "").replace(/บาท\s*$/u, "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? normalized : null;
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { status: "active" }, orderBy: { createdAt: "asc" } });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row || row.status !== "active") return null;
  return toProduct(row);
}

export async function getProductsByShopeeIds(shopeeIds: string[]): Promise<Product[]> {
  if (shopeeIds.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { shopeeId: { in: shopeeIds }, status: "active" },
  });
  const bySlug = new Map(rows.map((r) => [r.shopeeId, toProduct(r)]));
  return shopeeIds.map((id) => bySlug.get(id)).filter((p): p is Product => !!p);
}

export async function getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category, status: "active" },
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
