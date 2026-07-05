import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createDraftAction } from "@/lib/blogActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [total, published, drafts] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "draft" } }),
  ]);

  const stats = [
    { label: "บทความทั้งหมด", value: total },
    { label: "เผยแพร่แล้ว", value: published },
    { label: "ฉบับร่าง", value: drafts },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">แดชบอร์ด</h1>
          <p className="text-sm text-stone">จัดการบทความ SEO ของเกษตรกรไทย</p>
        </div>
        <form action={createDraftAction}>
          <button className="rounded-full bg-lime-canopy px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep">
            + เขียนบทความใหม่
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-paper p-6">
            <p className="font-display text-3xl font-bold text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-stone">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-paper p-6">
        <h2 className="font-display text-lg font-bold text-ink">เริ่มต้นใช้งาน</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone">
          <li>• กด “เขียนบทความใหม่” เพื่อสร้างฉบับร่าง แล้วใช้ block editor เขียนเนื้อหา</li>
          <li>• กรอก SEO (Title/Meta/คีย์เวิร์ด) และ FAQ ระบบจะให้คะแนน SEO แบบเรียลไทม์</li>
          <li>• ระบบตรวจบทความก่อนเผยแพร่ (word count, meta, คำการันตีต้องห้าม, ฯลฯ)</li>
          <li>• บทความที่เผยแพร่จะขึ้นที่ <Link href="/blog" className="text-ink underline">/blog</Link> และมี FAQ schema อัตโนมัติ</li>
        </ul>
        <Link href="/admin/articles" className="mt-5 inline-flex rounded-full border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-mist">
          ไปที่รายการบทความ →
        </Link>
      </div>
    </div>
  );
}
