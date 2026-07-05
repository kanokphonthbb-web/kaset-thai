"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/data";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-linen bg-paper/90 backdrop-blur">
      <div className="container-x">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="เกษตรกรไทย หน้าแรก"
          >
            <span className="text-2xl" aria-hidden>
              🌾
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold text-ink">
                เกษตรกรไทย
              </span>
              <span className="hidden text-xs text-stone sm:block">
                ปลูกเป็น เลี้ยงเป็น ทำเกษตรให้มีรายได้
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 xl:flex" aria-label="เมนูหลัก">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-[15px] font-medium text-stone transition-colors hover:bg-linen hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/search" className="btn-primary hidden text-sm sm:inline-flex">
              🔍 ค้นหาความรู้
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-full border border-ink text-ink xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            >
              <span className="text-xl">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="border-t border-linen bg-paper xl:hidden"
          aria-label="เมนูมือถือ"
        >
          <div className="container-x grid gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-full px-4 text-base font-medium text-ink hover:bg-linen"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full"
            >
              🔍 ค้นหาความรู้
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
