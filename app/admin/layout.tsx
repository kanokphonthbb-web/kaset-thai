import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "./login/actions";
import { isAuthConfigured } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "ระบบหลังบ้าน · เกษตรกรไทย",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-ash/50 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              🌾
            </span>
            <span className="font-display text-lg font-bold text-ink">
              เกษตรกรไทย · หลังบ้าน
            </span>
          </Link>
          <nav className="scrollbar-none flex w-full items-center gap-1 overflow-x-auto text-sm sm:w-auto">
            <Link href="/admin" className="shrink-0 rounded-full px-3 py-2 font-medium text-stone hover:bg-mist hover:text-ink">
              แดชบอร์ด
            </Link>
            <Link href="/admin/articles" className="shrink-0 rounded-full px-3 py-2 font-medium text-stone hover:bg-mist hover:text-ink">
              บทความ
            </Link>
            <Link href="/admin/products" className="shrink-0 rounded-full px-3 py-2 font-medium text-stone hover:bg-mist hover:text-ink">
              สินค้า
            </Link>
            <Link href="/blog" className="shrink-0 rounded-full px-3 py-2 font-medium text-stone hover:bg-mist hover:text-ink" target="_blank">
              ดูเว็บ ↗
            </Link>
            {isAuthConfigured() && (
              <form action={logoutAction}>
                <button className="rounded-full px-3 py-2 font-medium text-stone hover:bg-mist hover:text-ink">
                  ออกจากระบบ
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-4 text-xs text-stone">
        🔒 พื้นที่ผู้ดูแลระบบ (ป้องกันด้วยรหัสผ่าน) — production ใช้ Turso/libSQL
        โดยตั้งค่า TURSO_DATABASE_URL ใน env
      </footer>
    </div>
  );
}
