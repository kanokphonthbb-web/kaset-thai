"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = ["ปลูกทุเรียน", "เลี้ยงไก่ไข่", "โรคใบไหม้", "ต้นทุนเลี้ยงวัว"];

export default function SearchBox({
  id,
  initialQuery = "",
  autoFocus = false,
  onDark = false,
}: {
  id?: string;
  initialQuery?: string;
  autoFocus?: boolean;
  onDark?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function go(term: string) {
    const value = term.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div id={id} className="w-full">
      <form onSubmit={handleSubmit} role="search" className="w-full">
        <label htmlFor="site-search" className="sr-only">
          ค้นหาความรู้เกษตร
        </label>
        <div className="flex items-center gap-2 rounded-full bg-paper p-2 shadow-xl">
          <span aria-hidden className="pl-3 text-xl text-ink">
            🔍
          </span>
          <input
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา เช่น ปลูกทุเรียน, เลี้ยงไก่ไข่, ต้นทุนเลี้ยงวัว"
            className="min-h-[48px] w-full bg-transparent px-1 text-base text-ink placeholder:text-stone focus:outline-none"
            autoComplete="off"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
          />
          <button type="submit" className="btn-primary shrink-0">
            ค้นหา
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`text-sm ${onDark ? "text-paper/80" : "text-stone"}`}>
          ยอดนิยม:
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              onDark
                ? "bg-paper/15 text-paper hover:bg-paper/25"
                : "bg-linen text-ink hover:bg-ash/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
