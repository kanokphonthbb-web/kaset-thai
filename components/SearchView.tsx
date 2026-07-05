"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SearchBox from "./SearchBox";
import type { SearchResult } from "@/lib/data";

export default function SearchView() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [query]);

  return (
    <div className="container-x py-16">
      <span className="eyebrow">ค้นหา</span>
      <h1 className="mt-4 font-display text-4xl font-bold text-ink">
        ค้นหาความรู้เกษตร
      </h1>

      <div className="mt-6 max-w-2xl">
        <SearchBox initialQuery={query} autoFocus={!query} />
      </div>

      {query ? (
        <p className="mt-8 text-stone">
          {loading
            ? "กำลังค้นหา…"
            : `ผลการค้นหา “${query}” — พบ ${results.length} รายการ`}
        </p>
      ) : (
        <p className="mt-8 text-stone">
          พิมพ์คำค้น เช่น <em>ปลูกทุเรียน</em>, <em>เลี้ยงไก่ไข่</em>,{" "}
          <em>โรคใบไหม้</em>, <em>ต้นทุน</em> หรือ <em>เพลี้ย</em>
        </p>
      )}

      {query && !loading && results.length === 0 && (
        <div className="mt-6 rounded-2xl bg-mist p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">
            ยังไม่พบผลลัพธ์ที่ตรง
          </p>
          <p className="mt-2 text-stone">
            ลองใช้คำที่สั้นลง หรือดูจากหมวดหลักในเมนูด้านบนได้เลย
          </p>
          <Link href="/#categories" className="btn-primary mt-6">
            ดูหมวดความรู้ทั้งหมด
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {results.map((r) => (
            <li key={`${r.type}-${r.href}-${r.title}`}>
              <Link
                href={r.href}
                className="group flex h-full items-start gap-4 rounded-2xl bg-mist p-5 transition-colors hover:bg-linen"
              >
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime-canopy text-2xl"
                >
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <span className="eyebrow">{r.type}</span>
                  <p className="mt-1 font-display font-bold text-ink">{r.title}</p>
                  <p className="mt-1 text-sm text-stone">{r.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
