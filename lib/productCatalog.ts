import {
  productDisplayName,
  productPublicKeywords,
  type Product,
} from "@/lib/products";

export const PRODUCT_CATALOG_PAGE_SIZE = 24;
export const PRODUCT_OTHER_CATEGORY = "other";

export function normalizeCatalogQuery(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export function productMatchesCatalogQuery(product: Product, query: string): boolean {
  const normalizedQuery = normalizeCatalogQuery(query).toLocaleLowerCase("th-TH");
  if (!normalizedQuery) return true;

  const searchableText = [
    productDisplayName(product),
    ...productPublicKeywords(product, 12),
  ]
    .join(" ")
    .toLocaleLowerCase("th-TH");

  return searchableText.includes(normalizedQuery);
}

export function productCatalogCategory(product: Pick<Product, "category">): string {
  return product.category || PRODUCT_OTHER_CATEGORY;
}

export function productCatalogPage(
  rawPage: string | undefined,
  totalItems: number,
  pageSize = PRODUCT_CATALOG_PAGE_SIZE,
): { page: number; totalPages: number; start: number; end: number } {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const parsed = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), totalPages) : 1;
  const start = (page - 1) * pageSize;
  return { page, totalPages, start, end: Math.min(start + pageSize, totalItems) };
}
