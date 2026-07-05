import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createDraftAction } from "@/lib/blogActions";

export const dynamic = "force-dynamic";

export default async function AdminArticlesList() {
  const posts = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">บทความ</h1>
          <p className="text-sm text-stone">เขียนและจัดการบทความสำหรับ SEO</p>
        </div>
        <form action={createDraftAction}>
          <button className="rounded-full bg-lime-canopy px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep">
            + เขียนบทความใหม่
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ash p-12 text-center text-stone">
          ยังไม่มีบทความ — เริ่มเขียนบทความแรกได้เลย
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ash/50 text-xs text-stone">
              <tr>
                <th className="px-4 py-3">หัวข้อ</th>
                <th className="px-4 py-3">หมวด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">อัปเดต</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-mist last:border-0 hover:bg-mist">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${p.id}`} className="font-medium text-ink hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-stone">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-stone">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.status === "published"
                          ? "bg-lime-canopy text-ink"
                          : "bg-linen text-stone"
                      }`}
                    >
                      {p.status === "published" ? "เผยแพร่" : "ร่าง"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone">
                    {new Date(p.updatedAt).toLocaleDateString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
