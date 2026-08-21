export const ARTICLE_CLUSTER_SIZE = 10;
export const CATEGORY_ARCHIVE_PER_PAGE = 24;

export function articleClusterRange(articleNo: number | null | undefined): {
  start: number;
  end: number;
} | null {
  if (!Number.isInteger(articleNo) || !articleNo || articleNo < 1) return null;

  const start = Math.floor((articleNo - 1) / ARTICLE_CLUSTER_SIZE) * ARTICLE_CLUSTER_SIZE + 1;
  return { start, end: start + ARTICLE_CLUSTER_SIZE - 1 };
}

export function categoryArchiveHref(slug: string, page = 1): string {
  const base = `/blog/category/${encodeURIComponent(slug)}`;
  return page > 1 ? `${base}?page=${page}` : base;
}

export function articleContentModifiedAt(article: {
  contentUpdatedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}): Date {
  return article.contentUpdatedAt ?? article.publishedAt ?? article.createdAt;
}
