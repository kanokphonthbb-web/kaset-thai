import Link from "next/link";
import Image from "next/image";
import Header from "./Header";
import Footer from "./Footer";
import ArticleCard from "./ArticleCard";
import { ARTICLES, CATEGORIES, imageFor } from "@/lib/data";
import { prisma } from "@/lib/prisma";

type Props = {
  slug: string;
  icon: string;
  title: string;
  intro: string;
  topics: string[];
};

async function getCmsPosts(slug: string) {
  try {
    return await prisma.article.findMany({
      where: { status: "published", category: { slug } },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: { title: true, slug: true, excerpt: true, coverImage: true },
    });
  } catch {
    return [];
  }
}

export default async function CategoryPage({ slug, icon, title, intro, topics }: Props) {
  const related = ARTICLES.filter((a) => a.categoryHref === `/${slug}`);
  const cmsPosts = await getCmsPosts(slug);
  const others = CATEGORIES.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <>
      <Header />
      <main>
        {/* Hero band */}
        <section className="bg-mist">
          <div className="container-x py-16">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="font-medium text-ink">{title}</span>
            </nav>

            <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_420px]">
              <div className="flex items-start gap-4">
                <span className="text-5xl" aria-hidden>
                  {icon}
                </span>
                <div>
                  <h1 className="font-display text-4xl font-bold text-ink">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-stone">{intro}</p>
                </div>
              </div>

              {imageFor(slug, 900) && (
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-linen">
                  <Image
                    src={imageFor(slug, 900)!}
                    alt={title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Topics */}
        <section className="bg-paper py-20">
          <div className="container-x">
            <h2 className="font-display text-2xl font-bold text-ink">
              หัวข้อในหมวดนี้
            </h2>
            <p className="mt-2 text-stone">
              เนื้อหากำลังทยอยเพิ่ม — ด้านล่างคือหัวข้อที่วางแผนไว้สำหรับหมวดนี้
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-center gap-3 rounded-2xl bg-mist p-4"
                >
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-canopy text-ink"
                  >
                    ✓
                  </span>
                  <span className="font-medium text-ink">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related articles (static + CMS) */}
        {(related.length > 0 || cmsPosts.length > 0) && (
          <section className="bg-linen py-20">
            <div className="container-x">
              <h2 className="font-display text-2xl font-bold text-ink">
                บทความที่เกี่ยวข้อง
              </h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
                {cmsPosts.map((p) => (
                  <Link key={p.slug} href={`/articles/${p.slug}`} className="group flex h-full flex-col">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-paper">
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-4xl" aria-hidden>🌾</span>
                      )}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.title}</h3>
                    <p className="mt-2 text-sm text-stone">{p.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other categories */}
        <section className="bg-paper py-20">
          <div className="container-x">
            <h2 className="font-display text-2xl font-bold text-ink">
              หมวดอื่นที่น่าสนใจ
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {others.map((c) => (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-linen"
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.title}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/search" className="btn-primary">
                🔍 ค้นหาความรู้ทั้งหมด
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
