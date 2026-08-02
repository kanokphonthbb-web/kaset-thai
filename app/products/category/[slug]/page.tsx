import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { productCatalogPage } from "@/lib/productCatalog";
import {
  getProductsByCategory,
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
} from "@/lib/products";
import {
  getProductCategoryInfo,
  PRODUCT_CATEGORIES,
} from "@/lib/productCategories";
import { pageMeta } from "@/lib/seo";

type PageProps = {
  params: { slug: string };
  searchParams?: { page?: string | string[] };
};

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const pageNumber = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const categoryUrl = (slug: string, page = 1) =>
  page > 1 ? `/products/category/${slug}?page=${page}` : `/products/category/${slug}`;

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  const category = getProductCategoryInfo(params.slug);
  if (!category) return { title: "ไม่พบหมวดสินค้า", robots: { index: false, follow: true } };
  const page = pageNumber(firstParam(searchParams?.page));
  const suffix = page > 1 ? ` หน้า ${page.toLocaleString("th-TH")}` : "";
  return pageMeta({
    title: `${category.seoTitle}${suffix}`,
    description: category.description,
    path: categoryUrl(category.slug, page),
  });
}

export const revalidate = 300;

export default async function ProductCategoryPage({ params, searchParams }: PageProps) {
  const category = getProductCategoryInfo(params.slug);
  if (!category) notFound();

  const products = (await getProductsByCategory(category.slug))
    .filter(isProductIndexable)
    .sort(
      (left, right) =>
        productEditorialScore(right) - productEditorialScore(left) ||
        productDisplayName(left).localeCompare(productDisplayName(right), "th"),
    );
  if (products.length === 0) notFound();

  const requestedPage = pageNumber(firstParam(searchParams?.page));
  const pagination = productCatalogPage(String(requestedPage), products.length);
  if (requestedPage > pagination.totalPages) notFound();
  const visibleProducts = products.slice(pagination.start, pagination.end);

  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-10">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">หน้าแรก</Link>
              <span className="mx-2" aria-hidden>/</span>
              <Link href="/products" prefetch={false} className="hover:text-ink">
                สินค้าเพื่อการเกษตร
              </Link>
              <span className="mx-2" aria-hidden>/</span>
              <span aria-current="page">{category.name}</span>
            </nav>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">
            <SectionHeader
              eyebrow={`${category.icon} เลือกตามงานที่ทำ`}
              title={category.seoTitle}
              desc={category.intro}
              headingLevel={1}
            />

            <div className="mt-8 grid gap-6 rounded-2xl bg-mist p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">หลักเลือกก่อนสั่งซื้อ</h2>
                <ul className="mt-4 space-y-2">
                  {category.selectionTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-[15px] leading-relaxed text-ink/90">
                      <span aria-hidden className="mt-1 text-lime-deep">●</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={category.knowledgeHref} className="btn-secondary whitespace-nowrap px-5 py-2 text-sm">
                {category.knowledgeLabel}
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">
                รายการที่มีข้อมูลพร้อมเปรียบเทียบ
              </h2>
              <p className="text-sm text-stone">
                {products.length.toLocaleString("th-TH")} รายการ
              </p>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, name: productDisplayName(product) }}
                  priority={pagination.page === 1 && index === 0}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <nav aria-label="หน้ารายการสินค้า" className="mt-14 flex flex-wrap items-center justify-center gap-2">
                {pagination.page > 1 && (
                  <Link
                    href={categoryUrl(category.slug, pagination.page - 1)}
                    rel="prev"
                    className="btn-secondary px-5 py-2 text-sm"
                  >
                    ← ก่อนหน้า
                  </Link>
                )}
                <span className="px-3 text-sm text-stone">
                  หน้า {pagination.page.toLocaleString("th-TH")} จาก {pagination.totalPages.toLocaleString("th-TH")}
                </span>
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={categoryUrl(category.slug, pagination.page + 1)}
                    rel="next"
                    className="btn-secondary px-5 py-2 text-sm"
                  >
                    ถัดไป →
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
