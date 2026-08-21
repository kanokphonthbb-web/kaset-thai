import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CATEGORIES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { pageMeta } from "@/lib/seo";
import { REDIRECTED_ARTICLE_SLUGS } from "@/lib/articleSeoRules.mjs";
import {
  CATEGORY_ARCHIVE_PER_PAGE,
  categoryArchiveHref,
} from "@/lib/articleDiscovery";

export const revalidate = 300;

type PageProps = {
  params: { slug: string };
  searchParams?: { page?: string };
};

function pageNumber(value?: string): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  const category = getCategory(params.slug);
  if (!category) return { title: "ไม่พบหมวดบทความ" };

  const currentPage = pageNumber(searchParams?.page);
  return pageMeta({
    title:
      currentPage === 1
        ? `บทความ${category.title}`
        : `บทความ${category.title} หน้า ${currentPage}`,
    description: `รวมบทความ${category.title}สำหรับเกษตรกรไทย ${category.description}`,
    path: categoryArchiveHref(category.slug, currentPage),
  });
}

export default async function CategoryArchive({ params, searchParams }: PageProps) {
  const category = getCategory(params.slug);
  if (!category) notFound();

  const currentPage = pageNumber(searchParams?.page);
  const publishedWhere = {
    status: "published",
    slug: { notIn: [...REDIRECTED_ARTICLE_SLUGS] },
    category: { slug: category.slug },
  } satisfies Prisma.ArticleWhereInput;

  let posts: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    subcategory: string;
  }[] = [];
  let total = 0;

  try {
    [total, posts] = await Promise.all([
      prisma.article.count({ where: publishedWhere }),
      prisma.article.findMany({
        where: publishedWhere,
        orderBy: [{ publishedAt: "desc" }, { articleNo: "asc" }],
        skip: (currentPage - 1) * CATEGORY_ARCHIVE_PER_PAGE,
        take: CATEGORY_ARCHIVE_PER_PAGE,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          subcategory: true,
        },
      }),
    ]);
  } catch {
    posts = [];
  }

  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_ARCHIVE_PER_PAGE));
  if (total > 0 && currentPage > totalPages) notFound();

  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-14">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">หน้าแรก</Link>
              <span className="mx-2" aria-hidden>/</span>
              <Link href={category.href} className="hover:text-ink">{category.title}</Link>
              <span className="mx-2" aria-hidden>/</span>
              <span className="font-medium text-ink">บทความทั้งหมด</span>
            </nav>
            <div className="mt-6 flex items-start gap-4">
              <span className="text-5xl" aria-hidden>{category.icon}</span>
              <div>
                <h1 className="font-display text-4xl font-bold text-ink">
                  บทความ{category.title}
                  {currentPage > 1 ? ` หน้า ${currentPage}` : ""}
                </h1>
                <p className="mt-3 max-w-3xl text-stone">{category.description}</p>
                {total > 0 && (
                  <p className="mt-2 text-sm text-stone">ทั้งหมด {total.toLocaleString("th-TH")} บทความ</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">
            {posts.length === 0 ? (
              <div className="rounded-2xl bg-mist p-12 text-center text-stone">
                ยังไม่มีบทความที่เผยแพร่ในหมวดนี้
              </div>
            ) : (
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/articles/${post.slug}`} className="group flex h-full flex-col">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-linen">
                        {post.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-4xl" aria-hidden>🌾</span>
                        )}
                        {post.subcategory && (
                          <span className="absolute left-3 top-3 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
                            {post.subcategory}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-4 font-display text-lg font-bold text-ink">{post.title}</h2>
                      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-stone">{post.excerpt}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="เปลี่ยนหน้าหมวดบทความ" className="mt-12">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Link
                      key={page}
                      href={categoryArchiveHref(category.slug, page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors ${
                        page === currentPage
                          ? "bg-ink text-paper"
                          : "bg-mist text-ink hover:bg-linen"
                      }`}
                    >
                      {page}
                    </Link>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-center gap-4">
                  {currentPage > 1 && (
                    <Link href={categoryArchiveHref(category.slug, currentPage - 1)} className="btn-secondary">
                      ← ก่อนหน้า
                    </Link>
                  )}
                  {currentPage < totalPages && (
                    <Link href={categoryArchiveHref(category.slug, currentPage + 1)} className="btn-secondary">
                      ถัดไป →
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
