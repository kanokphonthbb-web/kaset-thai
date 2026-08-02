import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {
  getProductBySlug,
  getProductsByCategory,
  isProductIndexable,
  productDisplayName,
  productBuyerChecklist,
  productPriceDisplay,
  productPublicKeywords,
  productSeoDescription,
  productSeoTitle,
  productStructuredData,
} from "@/lib/products";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { canonicalArticleSlug } from "@/lib/articleSeoRules.mjs";

type Params = { params: { slug: string } };

// ISR: สินค้าจาก DB (Turso) อัปเดตได้ — regenerate ทุก 5 นาที
export const revalidate = 300;
export const dynamicParams = true;
export const dynamic = "force-static";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "ไม่พบสินค้า" };
  return pageMeta({
    title: productSeoTitle(product),
    description: productSeoDescription(product),
    image: product.imageUrl,
    path: `/products/${product.slug}`,
    noindex: !isProductIndexable(product),
  });
}

export default async function ProductDetailPage({ params }: Params) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const displayName = productDisplayName(product);
  const publicKeywords = productPublicKeywords(product);
  const buyerChecklist = productBuyerChecklist(product);

  const related = product.category
    ? (await getProductsByCategory(product.category, 30))
        .filter(isProductIndexable)
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  let relatedArticles: { slug: string; title: string }[] = [];
  if (product.relatedArticles.length > 0) {
    try {
      const canonicalRelatedSlugs = [
        ...new Set(product.relatedArticles.map(canonicalArticleSlug)),
      ];
      relatedArticles = await prisma.article.findMany({
        where: { slug: { in: canonicalRelatedSlugs }, status: "published" },
        select: { slug: true, title: true },
        take: 6,
      });
    } catch {
      relatedArticles = [];
    }
  }

  const jsonLd = productStructuredData(product, SITE_URL);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-10">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href="/products" prefetch={false} className="hover:text-ink">
                สินค้าเพื่อการเกษตร
              </Link>
            </nav>
          </div>
        </section>

        <div className="bg-paper py-16">
          <div className="container-x">
            <div className="grid gap-10 lg:grid-cols-[440px_1fr]">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-mist">
                <Image
                  src={product.imageUrl}
                  alt={displayName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 440px"
                  className="object-contain"
                />
              </div>

              <div className="flex flex-col">
                <h1 className="font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
                  {displayName}
                </h1>

                {publicKeywords.length > 0 && (
                  <p className="mt-4 max-w-2xl text-[17px] text-ink/90">
                    สินค้านี้เกี่ยวข้องกับ: {publicKeywords.join(", ")} หากคุณกำลังมองหาอุปกรณ์หรือปัจจัยการผลิตสำหรับเรื่องนี้
                    สินค้านี้อาจช่วยให้คุณไม่ต้องเสียเวลาหาใหม่
                  </p>
                )}

                {product.whyNeeded && (
                  <div className="mt-6">
                    <h2 className="font-display text-lg font-bold text-ink">ทำไมต้องมีสินค้านี้</h2>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{product.whyNeeded}</p>
                  </div>
                )}

                {product.benefits.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-display text-lg font-bold text-ink">ประโยชน์</h2>
                    <ul className="mt-2 space-y-2">
                      {product.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-[16px] text-ink/90">
                          <span aria-hidden className="mt-1 text-lime-deep">●</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.usage && (
                  <div className="mt-6">
                    <h2 className="font-display text-lg font-bold text-ink">ใช้เพื่ออะไร</h2>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{product.usage}</p>
                  </div>
                )}

                {product.howToChoose && (
                  <div className="mt-6">
                    <h2 className="font-display text-lg font-bold text-ink">วิธีเลือกซื้อ</h2>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{product.howToChoose}</p>
                  </div>
                )}

                {product.useCases.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-display text-lg font-bold text-ink">เหมาะกับงานแบบไหน</h2>
                    <ul className="mt-2 space-y-2">
                      {product.useCases.map((u, i) => (
                        <li key={i} className="flex items-start gap-2 text-[16px] text-ink/90">
                          <span aria-hidden className="mt-1 text-lime-deep">●</span>
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6">
                  <h2 className="font-display text-lg font-bold text-ink">เช็กก่อนสั่งซื้อ</h2>
                  <ul className="mt-2 space-y-2">
                    {buyerChecklist.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[16px] text-ink/90">
                        <span aria-hidden className="mt-1 text-lime-deep">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {product.safetyNote && (
                  <div className="mt-6 rounded-xl bg-amber-50 p-4 text-[15px] text-ink/90">
                    {product.safetyNote}
                  </div>
                )}

                {product.priceLabel && (
                  <p className="mt-6 text-[15px] text-stone">
                    ราคาโดยประมาณ {productPriceDisplay(product.priceLabel)}
                    {product.priceCheckedAt
                      ? ` (ตรวจสอบล่าสุด ${product.priceCheckedAt.toLocaleDateString("th-TH")})`
                      : ""}{" "}
                    — ราคาจริงเปลี่ยนแปลงได้ กรุณาตรวจสอบที่หน้าร้านก่อนสั่งซื้อ
                  </p>
                )}

                <div className="mt-8">
                  <a
                    href={product.affiliateLink}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className="btn-primary"
                  >
                    ดูสินค้า
                  </a>
                  <p className="mt-3 max-w-md text-xs text-stone">
                    ลิงก์นี้เป็นลิงก์พันธมิตร (affiliate link) หากคุณสั่งซื้อผ่านลิงก์นี้ เว็บไซต์อาจได้รับค่าคอมมิชชันโดยที่คุณไม่ต้องจ่ายเพิ่ม
                  </p>
                </div>
              </div>
            </div>

            {relatedArticles.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-xl font-bold text-ink">
                  บทความที่เกี่ยวข้อง
                </h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {relatedArticles.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="block rounded-xl bg-mist p-4 text-[15px] font-medium text-ink hover:bg-linen"
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-xl font-bold text-ink">
                  สินค้าอื่นในหมวดนี้
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((p) => (
                    <ProductCard key={p.id} product={p} compact />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
