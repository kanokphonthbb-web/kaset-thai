"use client";

// ไดเรกทอรีจังหวัด 77 จังหวัด พร้อมช่องค้นหา — พิมพ์แล้วกรองทันที
// ว่าง = แสดงครบทุกภาค (สไตล์ tag-chip เดิม)
import { useMemo, useState } from "react";
import Link from "next/link";
import { provincesByRegion } from "@/lib/weather/locations";

export default function ProvinceSearch() {
  const [query, setQuery] = useState("");
  const regions = useMemo(() => provincesByRegion(), []);

  const q = query.trim();
  const shown = q
    ? regions
        .map((r) => ({ ...r, provinces: r.provinces.filter((p) => p.nameTh.includes(q)) }))
        .filter((r) => r.provinces.length > 0)
    : regions;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="พิมพ์ชื่อจังหวัด เช่น จันทบุรี…"
        aria-label="ค้นหาจังหวัด"
        className="w-full min-h-[48px] rounded-full border border-ash bg-paper px-5 text-sm sm:max-w-sm"
      />
      {shown.length === 0 ? (
        <p className="mt-6 text-stone">ไม่พบจังหวัด &quot;{q}&quot; — ลองตรวจตัวสะกดอีกครั้ง</p>
      ) : (
        <div className="mt-8 space-y-10">
          {shown.map((r) => (
            <div key={r.region}>
              <h2 className="font-display text-xl font-bold leading-snug text-ink">{r.labelTh}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.provinces.map((p) => (
                  <Link key={p.slug} href={`/weather/${p.slug}`} className="tag-chip hover:bg-paper">
                    {p.nameTh}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
