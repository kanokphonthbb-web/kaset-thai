import Link from "next/link";
import { freshSchemaPrice, getAllProducts, isProductIndexable, productDisplayName, productEditorialScore } from "@/lib/products";
import { normalizeCatalogQuery, productCatalogPage, productMatchesCatalogQuery } from "@/lib/productCatalog";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function listUrl({ q, status, page }: { q?: string; status?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "thin") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: SearchParams }) {
  const products = await getAllProducts();
  const query = normalizeCatalogQuery(firstParam(searchParams?.q));
  const requestedStatus = firstParam(searchParams?.status) ?? "thin";
  const status = ["thin", "indexable", "stale-price", "fresh-price", "all"].includes(requestedStatus)
    ? requestedStatus
    : "thin";

  const indexableCount = products.filter(isProductIndexable).length;
  const thinCount = products.length - indexableCount;
  const freshPriceCount = products.filter((product) => Boolean(freshSchemaPrice(product))).length;
  const stalePriceCount = products.filter(
    (product) => product.priceLabel && !freshSchemaPrice(product),
  ).length;

  const queryMatches = query
    ? products.filter((product) => productMatchesCatalogQuery(product, query))
    : products;
  const filtered = queryMatches
    .filter((product) => {
      if (status === "thin") return !isProductIndexable(product);
      if (status === "indexable") return isProductIndexable(product);
      if (status === "fresh-price") return Boolean(freshSchemaPrice(product));
      if (status === "stale-price") return Boolean(product.priceLabel) && !freshSchemaPrice(product);
      return true;
    })
    .sort(
      (left, right) =>
        productEditorialScore(right) - productEditorialScore(left) ||
        productDisplayName(left).localeCompare(productDisplayName(right), "th"),
    );
  const pagination = productCatalogPage(firstParam(searchParams?.page), filtered.length, 30);
  const visible = filtered.slice(pagination.start, pagination.end);

  const filters = [
    { key: "thin", label: `ต้องเติมเนื้อหา (${thinCount.toLocaleString("th-TH")})` },
    { key: "indexable", label: `พร้อมให้เก็บข้อมูล (${indexableCount.toLocaleString("th-TH")})` },
    { key: "stale-price", label: `ราคาต้องตรวจใหม่ (${stalePriceCount.toLocaleString("th-TH")})` },
    { key: "fresh-price", label: `ราคายังใหม่ (${freshPriceCount.toLocaleString("th-TH")})` },
    { key: "all", label: `ทั้งหมด (${products.length.toLocaleString("th-TH")})` },
  ];

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">สินค้าและ SEO</h1>
        <p className="mt-1 text-sm text-stone">
          เติมข้อมูลเฉพาะสินค้าจริง ระบบจะเปิด Index เมื่อมีสัญญาณเนื้อหาอย่างน้อย 2 ส่วน
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "สินค้าทั้งหมด", value: products.length },
          { label: "พร้อมให้เก็บข้อมูล", value: indexableCount },
          { label: "ต้องเติมเนื้อหา", value: thinCount },
          { label: "ราคาตรวจไม่เกิน 30 วัน", value: freshPriceCount },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-paper p-5">
            <p className="font-display text-3xl font-bold text-ink">{item.value.toLocaleString("th-TH")}</p>
            <p className="mt-1 text-sm text-stone">{item.label}</p>
          </div>
        ))}
      </div>

      <form action="/admin/products" method="get" className="mt-7 flex max-w-xl gap-2">
        {status !== "thin" && <input type="hidden" name="status" value={status} />}
        <label htmlFor="admin-product-search" className="sr-only">ค้นหาสินค้า</label>
        <input
          id="admin-product-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="ค้นหาชื่อหรือคำเกี่ยวข้อง"
          className="min-h-[44px] min-w-0 flex-1 rounded-full border border-ash bg-paper px-4 text-base text-ink focus:outline-none"
        />
        <button className="rounded-full bg-lime-canopy px-5 py-2 text-sm font-semibold text-ink hover:bg-lime-deep">
          ค้นหา
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={listUrl({ q: query, status: filter.key })}
            aria-current={status === filter.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              status === filter.key
                ? "bg-lime-canopy text-ink ring-1 ring-lime-deep"
                : "bg-paper text-ink hover:bg-linen"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-stone">
        แสดง {visible.length > 0 ? pagination.start + 1 : 0}–{pagination.end} จาก {filtered.length.toLocaleString("th-TH")} รายการ
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl bg-paper">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-stone">ไม่พบสินค้าในคิวนี้</p>
        ) : (
          <div className="divide-y divide-mist">
            {visible.map((product) => {
              const score = productEditorialScore(product);
              const indexable = isProductIndexable(product);
              return (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="grid gap-2 px-5 py-4 hover:bg-mist sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{productDisplayName(product)}</p>
                    <p className="mt-1 text-xs text-stone">/{product.slug} · {product.category || "ยังไม่จัดหมวด"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${indexable ? "bg-lime-canopy text-ink" : "bg-linen text-stone"}`}>
                      SEO {score}/7
                    </span>
                    <span className="text-stone">แก้ไข →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <nav aria-label="หน้าคิวสินค้า" className="mt-7 flex items-center justify-center gap-3">
          {pagination.page > 1 ? (
            <Link href={listUrl({ q: query, status, page: pagination.page - 1 })} className="rounded-full border border-ink px-4 py-2 text-sm text-ink">
              ← ก่อนหน้า
            </Link>
          ) : <span />}
          <span className="text-sm text-stone">หน้า {pagination.page} จาก {pagination.totalPages}</span>
          {pagination.page < pagination.totalPages ? (
            <Link href={listUrl({ q: query, status, page: pagination.page + 1 })} className="rounded-full border border-ink px-4 py-2 text-sm text-ink">
              ถัดไป →
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
