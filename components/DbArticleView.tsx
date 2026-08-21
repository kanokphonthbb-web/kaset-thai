import Link from "next/link";
import type { Prisma } from "@prisma/client";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import { tocFromHtml, stripInlineFaqSection } from "@/lib/blocks";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { REDIRECTED_ARTICLE_SLUGS } from "@/lib/articleSeoRules.mjs";
import {
  articleClusterRange,
  articleContentModifiedAt,
  categoryArchiveHref,
} from "@/lib/articleDiscovery";
import {
  getAllProducts,
  injectProductLinks,
  findMatchingProducts,
  getProductsByCategory,
  getProductsByShopeeIds,
  isProductIndexable,
  type Product,
} from "@/lib/products";

type DbPost = {
  title: string;
  slug: string;
  content: string;
  format: string;
  coverImage: string;
  metaDescription: string;
  excerpt: string;
  blocksJson: string;
  faqJson: string;
  focusKeyword: string;
  subcategory: string;
  productsJson: string;
  articleNo: number | null;
  publishedAt: Date | null;
  contentUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string; slug: string } | null;
};

type RelatedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  articleNo: number | null;
};

async function getRelatedArticles(post: DbPost): Promise<RelatedArticle[]> {
  const cluster = articleClusterRange(post.articleNo);
  const commonWhere = {
    status: "published",
    slug: { notIn: [post.slug, ...REDIRECTED_ARTICLE_SLUGS] },
  } satisfies Prisma.ArticleWhereInput;
  const select = { title: true, slug: true, excerpt: true, articleNo: true } as const;

  try {
    const [clusterPosts, topicalPosts] = await Promise.all([
      cluster
        ? prisma.article.findMany({
            where: {
              ...commonWhere,
              articleNo: { gte: cluster.start, lte: cluster.end },
            },
            orderBy: { articleNo: "asc" },
            take: 8,
            select,
          })
        : Promise.resolve([]),
      prisma.article.findMany({
        where: {
          ...commonWhere,
          ...(post.subcategory
            ? { subcategory: post.subcategory }
            : post.category?.slug
              ? { category: { slug: post.category.slug } }
              : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: 8,
        select,
      }),
    ]);

    const unique = new Map<string, RelatedArticle>();
    for (const article of [...clusterPosts, ...topicalPosts]) {
      if (unique.size >= 6) break;
      unique.set(article.slug, article);
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

export default async function DbArticleView({ post }: { post: DbPost }) {
  let faqs: { q: string; a: string }[] = [];
  try {
    faqs = JSON.parse(post.faqJson) as { q: string; a: string }[];
  } catch {}
  // ตัด FAQ แบบข้อความล้วนออกจาก body — จะ render เป็น accordion แยกด้านล่างแทน กันขึ้นซ้ำสองที่
  const content = faqs.length > 0 ? stripInlineFaqSection(post.content) : post.content;
  const toc = tocFromHtml(content);
  const relatedArticlesPromise = getRelatedArticles(post);

  // สินค้าเพื่อการเกษตรที่อาจเกี่ยวข้องกับบทความนี้ — ใช้ชุดที่เตรียมไว้ล่วงหน้า
  // (Article.productsJson, join ผ่าน articleNo) ถ้ามี ไม่งั้น fallback ไปที่ระบบจับคู่คำสำคัญทั่วไป
  let curatedShopeeIds: string[] = [];
  try {
    curatedShopeeIds = JSON.parse(post.productsJson || "[]");
  } catch {
    curatedShopeeIds = [];
  }

  let related: Product[];
  let linkedContent: string;

  if (curatedShopeeIds.length > 0) {
    related = (await getProductsByShopeeIds(curatedShopeeIds)).filter(isProductIndexable);
    linkedContent = injectProductLinks(content, related, related.length);
  } else {
    const products = (await getAllProducts()).filter(isProductIndexable);
    linkedContent = injectProductLinks(content, products, 3);

    related = findMatchingProducts(
      `${post.title} ${post.focusKeyword} ${post.subcategory}`,
      products,
      3,
    );
    if (related.length < 3 && post.category?.slug) {
      const topUp = (await getProductsByCategory(post.category.slug, 3)).filter(
        isProductIndexable,
      );
      const seen = new Set(related.map((p) => p.id));
      for (const p of topUp) {
        if (related.length >= 3) break;
        if (!seen.has(p.id)) {
          related.push(p);
          seen.add(p.id);
        }
      }
    }
  }

  const relatedArticles = await relatedArticlesPromise;

  const url = `${SITE_URL}/articles/${post.slug}`;
  const categoryUrl = post.category
    ? `${SITE_URL}${categoryArchiveHref(post.category.slug)}`
    : `${SITE_URL}/blog`;
  const categoryName = post.category?.name ?? "บทความ";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      inLanguage: "th-TH",
      mainEntityOfPage: url,
      ...(post.coverImage ? { image: post.coverImage.startsWith("http") ? post.coverImage : `${SITE_URL}${post.coverImage}` } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
      dateModified: articleContentModifiedAt(post).toISOString(),
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-14">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">หน้าแรก</Link>
              <span className="mx-2" aria-hidden>/</span>
              <Link
                href={post.category ? categoryArchiveHref(post.category.slug) : "/blog"}
                className="hover:text-ink"
              >
                {categoryName}
              </Link>
            </nav>
            <div className="mt-4 flex items-center gap-3">
              {post.category && <span className="tag-chip text-xs">{post.category.name}</span>}
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              {post.title}
            </h1>
            {post.metaDescription && (
              <p className="mt-4 max-w-4xl text-lg text-stone">{post.metaDescription}</p>
            )}
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover sm:aspect-[21/9]"
              />
            )}
          </div>
        </section>

        <div className="bg-paper py-16">
          <div className="container-x">
            <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
              {toc.length > 0 && (
                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <div className="rounded-2xl bg-mist p-5">
                    <p className="eyebrow">สารบัญบทความ</p>
                    <nav className="mt-3 space-y-1" aria-label="สารบัญ">
                      {toc.map((t) => (
                        <a
                          key={t.id}
                          href={`#${t.id}`}
                          className={`block rounded-lg px-3 py-1.5 text-sm text-stone hover:bg-linen hover:text-ink ${t.level === 3 ? "pl-6" : ""}`}
                        >
                          {t.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              <article className="min-w-0">
                <div
                  className="cc-article"
                  dangerouslySetInnerHTML={{ __html: linkedContent }}
                />

                {relatedArticles.length > 0 && (
                  <section aria-labelledby="related-articles-heading" className="mt-12 rounded-2xl border border-linen p-6">
                    <h2 id="related-articles-heading" className="font-display text-2xl font-bold text-ink">
                      อ่านต่อในหัวข้อใกล้เคียง
                    </h2>
                    <p className="mt-2 text-[15px] text-stone">
                      บทความชุดเดียวกันและเรื่องต่อยอดที่ช่วยให้เห็นภาพครบขึ้น
                    </p>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {relatedArticles.map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/articles/${article.slug}`}
                            className="block h-full rounded-xl bg-mist p-4 transition-colors hover:bg-linen"
                          >
                            <h3 className="font-display font-bold text-ink">{article.title}</h3>
                            {article.excerpt && (
                              <p className="mt-2 line-clamp-2 text-sm text-stone">{article.excerpt}</p>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {related.length > 0 && (
                  <div className="mt-12 rounded-2xl bg-mist p-6">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      สินค้าที่อาจเป็นประโยชน์
                    </h2>
                    <p className="mt-2 text-[15px] text-stone">
                      หากคุณยังไม่รู้จะเริ่มหาอุปกรณ์หรือปัจจัยการผลิตที่เกี่ยวข้องยังไง สินค้าด้านล่างนี้อาจช่วยให้คุณไม่ต้องเสียเวลาหาใหม่
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {related.map((p) => (
                        <ProductCard key={p.id} product={p} compact />
                      ))}
                    </div>
                  </div>
                )}

                {faqs.length > 0 && (
                  <section id="faq" className="mt-12">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      คำถามที่พบบ่อย
                    </h2>
                    <div className="mt-5 space-y-3">
                      {faqs.map((f) => (
                        <details key={f.q} className="group rounded-2xl bg-mist p-5 [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                            {f.q}
                            <span className="shrink-0 text-lg text-stone transition-transform group-open:rotate-45" aria-hidden>+</span>
                          </summary>
                          <p className="mt-3 text-[15px] text-ink/90">{f.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                <div className="mt-10">
                  <Link
                    href={post.category ? categoryArchiveHref(post.category.slug) : "/blog"}
                    className="btn-secondary"
                  >
                    ← ดูบทความในหมวดนี้
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
