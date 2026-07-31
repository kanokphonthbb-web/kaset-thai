export const ARTICLE_REDIRECTS: Readonly<Record<string, string>>;
export const REDIRECTED_ARTICLE_SLUGS: readonly string[];
export const ARTICLE_SEO_TITLES: Readonly<Record<string, string>>;
export function canonicalArticleSlug(slug: string): string;
export function articleSeoTitle(slug: string, fallbackTitle: string): string;
