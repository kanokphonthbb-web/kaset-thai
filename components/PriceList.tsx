"use client";

// ลิสต์ราคาพร้อมช่องค้นหา + ตัวกรองหมวด — กรองฝั่ง client (ข้อมูลรายวันมี ~20-60 ใบ)
// ตัวการ์ดใช้สไตล์เดิมของหน้า /prices ทุกอย่าง ไม่เปลี่ยนดีไซน์
import { useMemo, useState } from "react";
import { baht } from "@/lib/format";
import { track } from "@/lib/analytics";

export interface PriceCard {
  key: string;
  productName: string;
  category: string;
  priceTypeLabel: string;
  priceAvg: number | null;
  priceMin: number | null;
  priceMax: number | null;
  unit: string | null;
  /** วันที่ข้อมูล format th-TH แล้วจากฝั่ง server */
  sourceDateTh: string;
}

export default function PriceList({ rows }: { rows: PriceCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort((a, b) => a.localeCompare(b, "th")),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows.filter(
      (r) =>
        (!category || r.category === category) &&
        (!q || r.productName.includes(q) || r.category.includes(q)),
    );
  }, [rows, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length === 1) track("price_search", {});
          }}
          placeholder="ค้นหาสินค้า เช่น สุกร ไข่ไก่ ยางพารา…"
          aria-label="ค้นหาสินค้า"
          className="w-full min-h-[48px] rounded-full border border-ash bg-paper px-5 text-sm sm:max-w-sm"
        />
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === null ? "bg-ink text-paper" : "bg-linen text-stone hover:text-ink"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(category === c ? null : c);
                track("price_filter", {});
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c ? "bg-ink text-paper" : "bg-linen text-stone hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-stone">
          ไม่พบสินค้าที่ตรงกับ &quot;{query}&quot;
          {category ? ` ในหมวด ${category}` : ""} — ลองคำอื่น เช่น ชื่อพืชหรือสัตว์
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <div key={row.key} className="rounded-2xl bg-mist p-6">
              <h2 className="font-display text-lg font-bold text-ink">{row.productName}</h2>
              <p className="mt-1 text-xs text-stone">{row.priceTypeLabel}</p>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {row.priceAvg != null ? baht(row.priceAvg) : "-"}
                {row.unit ? <span className="text-sm font-normal text-stone"> /{row.unit}</span> : null}
              </p>
              {row.priceMin != null && row.priceMax != null ? (
                <p className="mt-1 text-xs text-stone">
                  ช่วงราคาระหว่างตลาด {baht(row.priceMin)} – {baht(row.priceMax)}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-stone">ข้อมูลวันที่ {row.sourceDateTh}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
