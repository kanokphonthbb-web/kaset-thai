import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import ToolCard from "@/components/ToolCard";
import ArticleCard from "@/components/ArticleCard";
import SectionHeader from "@/components/SectionHeader";
import { CATEGORIES, TOOLS, ARTICLES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ISR: หน้าแรก static แต่ทยอยดึงบทความ CMS ล่าสุดทุก 5 นาที
export const revalidate = 300;

async function getLatestCmsPosts() {
  try {
    return await prisma.article.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { title: true, slug: true, excerpt: true, coverImage: true, category: { select: { name: true } } },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const latest = await getLatestCmsPosts();
  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Categories — white canvas */}
        <section id="categories" className="scroll-mt-24 bg-paper py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="หมวดความรู้"
              title="ความรู้เกษตรครบวงจร"
              desc="ออกแบบให้ครอบคลุมทั้งคนปลูกพืช เลี้ยงสัตว์ ทำประมง และเกษตรผสมผสาน พร้อมเนื้อหาเรื่องต้นทุนและการขาย"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Tools — warm band */}
        <section id="tools" className="scroll-mt-24 bg-linen py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="เครื่องมือ"
              title="เครื่องมือช่วยเกษตรกร"
              desc="ไม่ใช่แค่อ่าน แต่ช่วยคิดต้นทุนและวางแผนก่อนลงมือทำจริง"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.title} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured articles — white canvas */}
        <section id="articles" className="scroll-mt-24 bg-paper py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="บทความแนะนำ"
              title="คู่มือเริ่มต้นสำหรับมือใหม่"
              desc="เลือกอ่านเรื่องที่อยากเริ่ม แล้วลงมือทำตามได้จริง"
            />
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {ARTICLES.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </div>
        </section>

        {/* Latest articles from CMS (แสดงเมื่อมีบทความเผยแพร่) */}
        {latest.length > 0 && (
          <section className="bg-linen py-20">
            <div className="container-x">
              <SectionHeader
                eyebrow="อัปเดตล่าสุด"
                title="บทความใหม่จากทีมงาน"
                desc="เนื้อหาที่เพิ่งเผยแพร่ผ่านระบบของเรา"
              />
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((p) => (
                  <Link key={p.slug} href={`/articles/${p.slug}`} className="group flex h-full flex-col">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-paper">
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
                    <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.title}</h3>
                    <p className="mt-2 text-sm text-stone">{p.excerpt}</p>
                  </Link>
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link href="/blog" className="btn-secondary">ดูบทความทั้งหมด →</Link>
              </div>
            </div>
          </section>
        )}

        {/* Closing CTA */}
        <section id="about" className="scroll-mt-24 bg-paper py-20">
          <div className="container-x">
            <div className="rounded-2xl bg-linen px-6 py-16 text-center sm:px-12">
              <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                เริ่มต้นทำเกษตรอย่างมั่นใจ
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-stone">
                เกษตรกรไทย รวมความรู้ตั้งแต่ปลูกพืช เลี้ยงสัตว์ ไปจนถึงคิดต้นทุน
                และหาตลาด อ่านง่าย เข้าใจไว เหมาะกับคนที่อยากลงมือทำจริง
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  🔍 ค้นหาความรู้
                </Link>
                <Link href="/tools" className="btn-secondary w-full sm:w-auto">
                  🧰 ลองใช้เครื่องมือ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
