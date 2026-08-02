export type ProductCanonicalGroup = {
  canonical: string;
  duplicates: readonly string[];
  category: string;
};

export const PRODUCT_CANONICAL_GROUPS: readonly ProductCanonicalGroup[];
export const PRODUCT_REDIRECTS: Readonly<Record<string, string>>;
export function canonicalProductSlug(slug: string): string;
export function canonicalProductGroup(slug: string): ProductCanonicalGroup | null;
export function isCanonicalProductSlug(slug: string): boolean;
