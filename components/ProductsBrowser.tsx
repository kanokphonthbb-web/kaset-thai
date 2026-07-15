"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import ProductCard from "./ProductCard";

// Deliberately omits affiliateLink — this component hydrates on the client with
// the full catalog for instant search/filter, and the outbound link must never
// be serialized into that payload (it would leak into page source as plain text).
export type BrowsableProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  category: string;
  keywords: string[];
};

const OTHER_GROUP = { slug: "", icon: "🧰", title: "อื่นๆ" };
const GROUPS = [
  ...CATEGORIES.map((c) => ({ slug: c.slug, icon: c.icon, title: c.title })),
  OTHER_GROUP,
];

export default function ProductsBrowser({ products }: { products: BrowsableProduct[] }) {
  // null = "ทั้งหมด" — ต่างจาก "" ซึ่งหมายถึงหมวด "อื่นๆ" (สินค้าที่ยังไม่ได้จัดหมวด)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== null && p.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = `${p.name} ${p.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, activeCategory, query]);

  const groups = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: filtered.filter((p) => p.category === g.slug),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  return (
    <div>
      {/* Sticky search + filter bar — stays reachable while browsing a long catalog */}
      <div className="sticky top-[72px] z-30 -mx-4 rounded-2xl bg-paper/95 px-4 py-4 shadow-sm ring-1 ring-ash/15 backdrop-blur sm:top-20">
        <label htmlFor="product-search" className="sr-only">
          ค้นหาสินค้า
        </label>
        <div className="flex max-w-md items-center gap-2 rounded-full bg-mist px-4 py-1 ring-1 ring-transparent transition-shadow focus-within:ring-lime-deep">
          <span aria-hidden className="text-lg text-stone">
            🔍
          </span>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาสินค้า เช่น ปุ๋ย, สปริงเกลอร์, กรงไก่"
            className="min-h-[44px] w-full bg-transparent px-1 text-base text-ink placeholder:text-stone focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Category filter chips */}
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="กรองตามหมวด">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory === null}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-lime-canopy text-ink ring-1 ring-lime-deep"
                : "bg-linen text-ink hover:bg-ash/30"
            }`}
          >
            ทั้งหมด
            <span className="ml-1.5 text-stone">({products.length})</span>
          </button>
          {GROUPS.map((g) => {
            const count = categoryCounts.get(g.slug) ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={g.slug || "other"}
                type="button"
                onClick={() => setActiveCategory(g.slug)}
                aria-pressed={activeCategory === g.slug}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === g.slug
                    ? "bg-lime-canopy text-ink ring-1 ring-lime-deep"
                    : "bg-linen text-ink hover:bg-ash/30"
                }`}
              >
                <span aria-hidden className="mr-1.5">
                  {g.icon}
                </span>
                {g.title}
                <span className="ml-1.5 text-stone">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results, grouped by category */}
      <div className="mt-10 space-y-16">
        {groups.length === 0 && (
          <p className="text-stone">ไม่พบสินค้าที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น</p>
        )}
        {groups.map((g) => (
          <section key={g.slug || "other"}>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <span aria-hidden>{g.icon}</span>
              {g.title}
              <span className="text-sm font-normal text-stone">({g.items.length})</span>
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
