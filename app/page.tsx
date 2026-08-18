import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import ToolCard from "@/components/ToolCard";
import ArticleCard from "@/components/ArticleCard";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { CATEGORIES, TOOLS, ARTICLES } from "@/lib/data";
import { getAllProducts, isProductIndexable } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { REDIRECTED_ARTICLE_SLUGS } from "@/lib/articleSeoRules.mjs";
import HomeWeatherNow from "@/components/HomeWeatherNow";
import HomePriceBoard, { type HomePriceRow } from "@/components/HomePriceBoard";
import { getLatestPrices } from "@/lib/agri-data/service";

// ISR: หน้าแรก static แต่ทยอยดึงบทความ CMS ล่าสุดทุก 5 นาที
export const revalidate = 300;

// หน้าแรกแสดงเครื่องมือชุดคัดสรร 8 ตัว (เดิม+ใหม่) — ทั้งหมดดูได้ที่ /tools
const FEATURED_TOOL_HREFS = [
  "/tools/plant-cost",
  "/tools/animal-cost",
  "/tools/calendar",
  "/tools/farm-planner",
  "/tools/land-area-converter",
  "/tools/fertilizer-calculator",
  "/tools/farm-income-calculator",
  "/tools/rain-window-planner",
];

async function getLatestCmsPosts() {
  try {
    return await prisma.article.findMany({
      where: {
        status: "published",
        slug: { notIn: [...REDIRECTED_ARTICLE_SLUGS] },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { title: true, slug: true, excerpt: true, coverImage: true, category: { select: { name: true } } },
    });
  } catch {
    return [];
  }
}

async function getPublishedCount() {
  try {
    return await prisma.article.count({
      where: {
        status: "published",
        slug: { notIn: [...REDIRECTED_ARTICLE_SLUGS] },
      },
    });
  } catch {
    return 0;
  }
}

async function getFeaturedProducts() {
  try {
    const products = (await getAllProducts()).filter(isProductIndexable);
    // สลับหมวดเพื่อให้ตัวอย่างสินค้าบนหน้าแรกดูหลากหลาย ไม่กระจุกอยู่หมวดเดียว
    const byCategory = new Map<string, typeof products>();
    for (const p of products) {
      const key = p.category || "other";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    }
    const featured: typeof products = [];
    let round = 0;
    while (featured.length < 8) {
      let addedAny = false;
      for (const list of byCategory.values()) {
        if (list[round]) {
          featured.push(list[round]);
          addedAny = true;
          if (featured.length >= 8) break;
        }
      }
      if (!addedAny) break;
      round++;
    }
    return { featured, total: products.length };
  } catch {
    return { featured: [], total: 0 };
  }
}

export default async function HomePage() {
  const [latest, publishedCount, { featured: featuredProducts, total: productCount }, allPrices] = await Promise.all([
    getLatestCmsPosts(),
    getPublishedCount(),
    getFeaturedProducts(),
    getLatestPrices(60),
  ]);
  const articleCount = publishedCount + ARTICLES.length;
  // สินค้าหลักที่เกษตรกรส่วนใหญ่ติดตาม — เลือกจากชื่อสินค้าจริงในข้อมูล เรียงตามความสนใจ
  const HEADLINE_KEYWORDS = [
    "ข้าวเปลือกเจ้าหอมมะลิ",
    "สุกร",
    "ไข่ไก่สด",
    "ไก่รุ่นพันธุ์เนื้อ",
    "น้ำยางพาราสด",
    "ผลปาล์มน้ำมัน",
    "หัวมันสำปะหลังสด คละ",
    "ข้าวโพดเลี้ยงสัตว์",
  ];
  const headlinePrices: HomePriceRow[] = HEADLINE_KEYWORDS.map((kw) =>
    allPrices.find((r) => r.productName.includes(kw) && r.priceAvg != null),
  )
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ name: r.productName, priceAvg: r.priceAvg as number, unit: r.unit }));
  const priceDateTh = allPrices[0]
    ? new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" }).format(allPrices[0].sourceDate)
    : null;

  return (
    <>
      <Header />
      <main>
        <Hero articleCount={articleCount} />

        {/* Daily farm utility — อากาศ+ราคา แสดงค่าจริงทันที (mist band before the white categories canvas) */}
        <section id="daily" className="scroll-mt-24 bg-mist py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="ใช้ได้ทุกวัน"
              title="วางแผนงานฟาร์มวันนี้"
              desc="อากาศและราคาวันนี้ เห็นได้ทันทีตรงนี้ — อยากดูละเอียดค่อยกดเข้าไปต่อ"
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <HomeWeatherNow />
              <HomePriceBoard rows={headlinePrices} sourceDateTh={priceDateTh} />
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-paper p-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">🧑‍🌾 แดชบอร์ดเกษตรกร</h3>
                <p className="mt-1 text-sm text-stone">
                  ตั้งค่าจังหวัดและพืชครั้งเดียว ดูอากาศ ปฏิทิน และเครื่องมือที่ใช้บ่อยครบในหน้าเดียว
                </p>
              </div>
              <Link href="/farm-dashboard" className="btn-secondary shrink-0">
                เปิดแดชบอร์ด →
              </Link>
            </div>
          </div>
        </section>

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

        {/* Products — soft mist band, deliberately distinct from the linen Tools band right after it */}
        {featuredProducts.length > 0 && (
          <section id="products" className="scroll-mt-24 bg-mist py-20">
            <div className="container-x">
              <SectionHeader
                eyebrow="เลือกสรรมาให้"
                title="สินค้าเพื่อการเกษตรแนะนำ"
                desc={
                  productCount > 0
                    ? `รวบรวมไว้กว่า ${productCount.toLocaleString("th-TH")} รายการ ให้เลือกดูง่ายขึ้นตามหมวดความรู้ที่คุณสนใจ`
                    : "อุปกรณ์และปัจจัยการผลิตที่เกี่ยวข้องกับบทความในเว็บนี้ รวบรวมไว้ให้เลือกดูง่ายขึ้น"
                }
              />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link href="/products" prefetch={false} className="btn-secondary">
                  ดูสินค้าทั้งหมด →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Tools — warm band */}
        <section id="tools" className="scroll-mt-24 bg-linen py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="เครื่องมือ"
              title="เครื่องมือช่วยเกษตรกร"
              desc="ไม่ใช่แค่อ่าน แต่ช่วยคิดต้นทุนและวางแผนก่อนลงมือทำจริง"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_TOOL_HREFS.map((href) => {
                const tool = TOOLS.find((t) => t.href === href);
                return tool ? <ToolCard key={tool.title} tool={tool} /> : null;
              })}
            </div>
            <div className="mt-10 text-center">
              <Link href="/tools" className="btn-secondary">
                ดูเครื่องมือทั้งหมด →
              </Link>
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
