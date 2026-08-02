import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { CATEGORIES } from "@/lib/data";
import {
  getAllProducts,
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
} from "@/lib/products";
import {
  normalizeCatalogQuery,
  PRODUCT_OTHER_CATEGORY,
  productCatalogCategory,
  productCatalogPage,
  productMatchesCatalogQuery,
} from "@/lib/productCatalog";
import { pageMeta } from "@/lib/seo";

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  page?: string | string[];
};

type PageProps = { searchParams?: SearchParams };

const OTHER_GROUP = {
  slug: PRODUCT_OTHER_CATEGORY,
  icon: "🧰",
  title: "อื่นๆ",
};
const GROUPS = [
  ...CATEGORIES.map((category) => ({
    slug: category.slug,
    icon: category.icon,
    title: category.title,
  })),
  OTHER_GROUP,
];
const GROUP_SLUGS = new Set(GROUPS.map((group) => group.slug));

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function catalogUrl({
  query,
  category,
  page,
}: {
  query?: string;
  category?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/products?${search}` : "/products";
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const hasFilters = Boolean(
    normalizeCatalogQuery(firstParam(searchParams?.q)) ||
      firstParam(searchParams?.category) ||
      firstParam(searchParams?.page),
  );

  return pageMeta({
    title: "สินค้าและอุปกรณ์การเกษตร",
    description:
      "รวมสินค้าและอุปกรณ์การเกษตร พร้อมข้อมูลประโยชน์ วิธีใช้ วิธีเลือก และข้อควรระวัง ค้นหาและกรองตามหมวดความรู้ได้",
    path: "/products",
    noindex: hasFilters,
  });
}

// ISR: สินค้าจาก DB (Turso) อัปเดตได้ — regenerate ทุก 5 นาที
export const revalidate = 300;

export default async function ProductsPage({ searchParams }: PageProps) {
  const query = normalizeCatalogQuery(firstParam(searchParams?.q));
  const requestedCategory = firstParam(searchParams?.category) ?? "";
  const activeCategory = GROUP_SLUGS.has(requestedCategory) ? requestedCategory : "";

  // Keep the full catalog on the server. Only the current 24 results become HTML;
  // no 1,000+ product array is serialized into the browser hydration payload.
  const allProducts = (await getAllProducts()).sort(
    (left, right) =>
      Number(isProductIndexable(right)) - Number(isProductIndexable(left)) ||
      productEditorialScore(right) - productEditorialScore(left) ||
      productDisplayName(left).localeCompare(productDisplayName(right), "th"),
  );
  const queryMatches = query
    ? allProducts.filter((product) => productMatchesCatalogQuery(product, query))
    : allProducts;

  const categoryCounts = new Map<string, number>();
  for (const product of queryMatches) {
    const category = productCatalogCategory(product);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  const filteredProducts = activeCategory
    ? queryMatches.filter((product) => productCatalogCategory(product) === activeCategory)
    : queryMatches;
  const pagination = productCatalogPage(
    firstParam(searchParams?.page),
    filteredProducts.length,
  );
  const visibleProducts = filteredProducts.slice(pagination.start, pagination.end);
  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    products: visibleProducts.filter(
      (product) => productCatalogCategory(product) === group.slug,
    ),
  })).filter((group) => group.products.length > 0);

  return (
    <>
      <Header />
      <main>
        <section className="bg-paper py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="เลือกสรรมาให้"
              title="สินค้าและอุปกรณ์การเกษตร"
              desc="ค้นหาตามงานที่ต้องทำ พร้อมอ่านประโยชน์ วิธีใช้ วิธีเลือก และข้อควรระวังก่อนออกไปตรวจสอบรายละเอียดกับร้านค้า"
              headingLevel={1}
            />

            <div className="mt-12">
              <div className="sticky top-[72px] z-30 -mx-4 rounded-2xl bg-paper/95 px-4 py-4 shadow-sm ring-1 ring-ash/15 backdrop-blur sm:top-20">
                <form action="/products" method="get" className="flex max-w-xl gap-2">
                  {activeCategory && (
                    <input type="hidden" name="category" value={activeCategory} />
                  )}
                  <label htmlFor="product-search" className="sr-only">
                    ค้นหาสินค้า
                  </label>
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-mist px-4 py-1 ring-1 ring-transparent transition-shadow focus-within:ring-lime-deep">
                    <span aria-hidden className="text-lg text-stone">
                      🔍
                    </span>
                    <input
                      id="product-search"
                      name="q"
                      type="search"
                      defaultValue={query}
                      placeholder="ค้นหาสินค้า เช่น ปุ๋ย, สปริงเกลอร์, กรงไก่"
                      className="min-h-[44px] w-full bg-transparent px-1 text-base text-ink placeholder:text-stone focus:outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit" className="btn-primary px-5 py-2 text-sm">
                    ค้นหา
                  </button>
                </form>

                <div
                  className="scrollbar-none -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
                  aria-label="กรองตามหมวด"
                >
                  <Link
                    href={catalogUrl({ query })}
                    aria-current={!activeCategory ? "page" : undefined}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      !activeCategory
                        ? "bg-lime-canopy text-ink ring-1 ring-lime-deep"
                        : "bg-linen text-ink hover:bg-ash/30"
                    }`}
                  >
                    ทั้งหมด
                    <span className={`ml-1.5 ${!activeCategory ? "text-ink" : "text-stone"}`}>
                      ({queryMatches.length.toLocaleString("th-TH")})
                    </span>
                  </Link>
                  {GROUPS.map((group) => {
                    const count = categoryCounts.get(group.slug) ?? 0;
                    if (count === 0) return null;
                    const isActive = activeCategory === group.slug;
                    return (
                      <Link
                        key={group.slug}
                        href={
                          !query && group.slug !== PRODUCT_OTHER_CATEGORY
                            ? `/products/category/${group.slug}`
                            : catalogUrl({ query, category: group.slug })
                        }
                        aria-current={isActive ? "page" : undefined}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-lime-canopy text-ink ring-1 ring-lime-deep"
                            : "bg-linen text-ink hover:bg-ash/30"
                        }`}
                      >
                        <span aria-hidden className="mr-1.5">
                          {group.icon}
                        </span>
                        {group.title}
                        <span className={`ml-1.5 ${isActive ? "text-ink" : "text-stone"}`}>
                          ({count.toLocaleString("th-TH")})
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-stone">
                <p aria-live="polite">
                  {filteredProducts.length > 0
                    ? `แสดง ${pagination.start + 1}–${pagination.end} จาก ${filteredProducts.length.toLocaleString("th-TH")} รายการ`
                    : "ไม่พบสินค้าที่ตรงกับคำค้นหา"}
                </p>
                {query && (
                  <Link
                    href={catalogUrl({ category: activeCategory })}
                    className="font-medium text-ink underline underline-offset-4"
                  >
                    ล้างคำค้นหา
                  </Link>
                )}
              </div>

              {visibleGroups.length === 0 ? (
                <div className="mt-10 rounded-2xl bg-mist p-8 text-center text-stone">
                  ไม่พบสินค้าที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น
                </div>
              ) : (
                <div className="mt-10 space-y-16">
                  {visibleGroups.map((group) => (
                    <section key={group.slug}>
                      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                        <span aria-hidden>{group.icon}</span>
                        {group.title}
                      </h2>
                      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {group.products.map((product, index) => (
                          <ProductCard
                            key={product.id}
                            product={{ ...product, name: productDisplayName(product) }}
                            priority={pagination.page === 1 && index === 0 && group === visibleGroups[0]}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <nav
                  aria-label="หน้ารายการสินค้า"
                  className="mt-14 flex flex-wrap items-center justify-center gap-2"
                >
                  {pagination.page > 1 && (
                    <Link
                      href={catalogUrl({
                        query,
                        category: activeCategory,
                        page: pagination.page - 1,
                      })}
                      rel="prev"
                      className="btn-secondary px-5 py-2 text-sm"
                    >
                      ← ก่อนหน้า
                    </Link>
                  )}
                  <span className="px-3 text-sm text-stone">
                    หน้า {pagination.page.toLocaleString("th-TH")} จาก{" "}
                    {pagination.totalPages.toLocaleString("th-TH")}
                  </span>
                  {pagination.page < pagination.totalPages && (
                    <Link
                      href={catalogUrl({
                        query,
                        category: activeCategory,
                        page: pagination.page + 1,
                      })}
                      rel="next"
                      className="btn-secondary px-5 py-2 text-sm"
                    >
                      ถัดไป →
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
