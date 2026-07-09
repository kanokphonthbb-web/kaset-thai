import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "บทความ",
  description:
    "รวมบทความความรู้เกษตรจากเกษตรกรไทย ปลูกพืช เลี้ยงสัตว์ ประมง เกษตรผสมผสาน ต้นทุนและการขาย",
  path: "/blog",
});

const PER_PAGE = 12;

export default async function BlogIndex({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);

  let posts: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    category: { name: string } | null;
  }[] = [];
  let total = 0;
  try {
    [total, posts] = await Promise.all([
      prisma.article.count({ where: { status: "published" } }),
      prisma.article.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        skip: (currentPage - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          category: { select: { name: true } },
        },
      }),
    ]);
  } catch {
    posts = [];
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <span className="eyebrow">บทความ</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-ink">
              บทความความรู้เกษตร
            </h1>
            <p className="mt-3 max-w-2xl text-stone">
              อ่านเรื่องที่อยากเริ่ม แล้วลงมือทำตามได้จริง
            </p>
          </div>
        </section>

        <section className="bg-paper py-20">
          <div className="container-x">
            {posts.length === 0 ? (
              <div className="rounded-2xl bg-mist p-12 text-center text-stone">
                ยังไม่มีบทความที่เผยแพร่ — กลับมาใหม่เร็ว ๆ นี้
              </div>
            ) : (
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/articles/${p.slug}`} className="group flex h-full flex-col">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-linen">
                        {p.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-4xl" aria-hidden>🌾</span>
                        )}
                        {p.category && (
                          <span className="absolute left-3 top-3 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-4 font-display text-lg font-bold text-ink">{p.title}</h2>
                      <p className="mt-2 text-sm text-stone">{p.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="เปลี่ยนหน้าบทความ"
                className="mt-12 flex items-center justify-center gap-4"
              >
                {currentPage > 1 ? (
                  <Link
                    href={currentPage - 1 === 1 ? "/blog" : `/blog?page=${currentPage - 1}`}
                    className="btn-secondary"
                  >
                    ← ก่อนหน้า
                  </Link>
                ) : (
                  <span className="btn-secondary pointer-events-none opacity-40">← ก่อนหน้า</span>
                )}

                <span className="text-sm text-stone">
                  หน้า {currentPage} จาก {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link href={`/blog?page=${currentPage + 1}`} className="btn-secondary">
                    ถัดไป →
                  </Link>
                ) : (
                  <span className="btn-secondary pointer-events-none opacity-40">ถัดไป →</span>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
