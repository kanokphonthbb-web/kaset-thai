import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import { tocFromHtml, stripInlineFaqSection } from "@/lib/blocks";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/lib/data";
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

// เครื่องมือคำนวณที่เกี่ยวข้องตามหมวดหมู่บทความ — เลือก 2-3 ตัวที่ตรงประเด็นที่สุด
// (slug อ้างอิงจาก app/tools/*/ จริง ไม่ใช่ของสมมติ)
const CATEGORY_TOOL_SLUGS: Record<string, string[]> = {
  plants: ["plant-cost", "plant-spacing-calculator", "crop-yield-calculator"],
  animals: ["animal-cost", "livestock-feed-cost-calculator", "fcr-calculator"],
  fishery: ["fcr-calculator", "livestock-feed-cost-calculator"],
  "cost-profit": ["farm-break-even-calculator", "minimum-selling-price", "farm-income-calculator"],
  "soil-water-fertilizer": ["fertilizer-calculator", "irrigation-calculator", "fertilizer-cost-comparison"],
  diseases: ["disease-check"],
  "mixed-farming": ["farm-planner", "farm-record"],
  market: ["minimum-selling-price", "farm-income-calculator"],
};
const DEFAULT_TOOL_SLUGS = ["farm-income-calculator", "farm-break-even-calculator", "minimum-selling-price"];

function getRelatedTools(categorySlug: string | undefined) {
  const slugs = (categorySlug && CATEGORY_TOOL_SLUGS[categorySlug]) || DEFAULT_TOOL_SLUGS;
  return slugs
    .map((slug) => TOOLS.find((t) => t.href === `/tools/${slug}`))
    .filter((t): t is (typeof TOOLS)[number] => Boolean(t));
}

/** ดึงย่อหน้าแรกจาก HTML เป็นข้อความล้วน — fallback สุดท้ายสำหรับกล่อง "คำตอบสั้น" */
function firstParagraphText(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return "";
  return m[1]
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

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

  // กล่อง "คำตอบสั้น" สำหรับ AEO — เรียงลำดับแหล่งข้อมูล: excerpt > metaDescription > ย่อหน้าแรกในเนื้อหา
  const shortAnswer =
    post.excerpt.trim() ||
    post.metaDescription.trim() ||
    truncate(firstParagraphText(content), 280);

  const relatedTools = getRelatedTools(post.category?.slug);

  const modifiedAt = articleContentModifiedAt(post);
  const thaiDateFmt = new Intl.DateTimeFormat("th-TH", { dateStyle: "long" });
  const modifiedLabel = thaiDateFmt.format(modifiedAt);
  const publishedLabel = post.publishedAt ? thaiDateFmt.format(post.publishedAt) : null;
  const differsMeaningfully =
    post.publishedAt && Math.abs(modifiedAt.getTime() - post.publishedAt.getTime()) > 24 * 60 * 60 * 1000;
  const dateLine = !publishedLabel
    ? `อัปเดต ${modifiedLabel}`
    : differsMeaningfully
      ? `เผยแพร่ ${publishedLabel} · อัปเดต ${modifiedLabel}`
      : `เผยแพร่ ${publishedLabel}`;

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
      ...(post.coverImage
        ? {
            image: {
              "@type": "ImageObject",
              url: post.coverImage.startsWith("http") ? post.coverImage : `${SITE_URL}${post.coverImage}`,
              width: 1200,
              height: 630,
            },
          }
        : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
      dateModified: modifiedAt.toISOString(),
      author: { "@id": `${SITE_URL}/#editorial-team` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: shortAnswer ? ["h1", ".article-answer"] : ["h1"],
      },
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {post.category && <span className="tag-chip text-xs">{post.category.name}</span>}
              <span className="text-sm text-stone">{dateLine}</span>
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              {post.title}
            </h1>
            {post.metaDescription && (
              <p className="mt-4 max-w-4xl text-lg text-stone">{post.metaDescription}</p>
            )}
            {post.coverImage && (
              <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[21/9]">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1160px"
                  className="object-cover"
                />
              </div>
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
                {shortAnswer && (
                  <div className="article-answer mb-8 rounded-2xl border border-linen bg-mist p-5">
                    <p className="eyebrow">คำตอบสั้น ๆ</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink">{shortAnswer}</p>
                  </div>
                )}

                <div
                  className="cc-article"
                  dangerouslySetInnerHTML={{ __html: linkedContent }}
                />

                {relatedTools.length > 0 && (
                  <section aria-labelledby="related-tools-heading" className="mt-12 rounded-2xl border border-linen p-6">
                    <h2 id="related-tools-heading" className="font-display text-2xl font-bold text-ink">
                      เครื่องมือช่วยคำนวณที่เกี่ยวข้อง
                    </h2>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                      {relatedTools.map((tool) => (
                        <li key={tool.href}>
                          <Link
                            href={tool.href}
                            className="block h-full rounded-xl bg-mist p-4 transition-colors hover:bg-linen"
                          >
                            <span aria-hidden className="text-2xl">{tool.icon}</span>
                            <h3 className="mt-2 font-display font-bold text-ink">{tool.title}</h3>
                            <p className="mt-1 text-sm text-stone">{tool.description}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

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
