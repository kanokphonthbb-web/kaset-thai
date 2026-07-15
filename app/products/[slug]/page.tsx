import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import { pageMeta } from "@/lib/seo";

type Params = { params: { slug: string } };

// ISR: สินค้าจาก DB (Turso) อัปเดตได้ — regenerate ทุก 5 นาที
export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "ไม่พบสินค้า" };
  const desc =
    product.keywords.length > 0
      ? `${product.name} เกี่ยวข้องกับ ${product.keywords.slice(0, 5).join(", ")} รวบรวมไว้ให้เลือกดูง่ายขึ้น`
      : `${product.name} — สินค้าเพื่อการเกษตรที่รวบรวมไว้ให้เลือกดูง่ายขึ้น`;
  return pageMeta({
    title: product.name,
    description: desc,
    image: product.imageUrl,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductDetailPage({ params }: Params) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = product.category
    ? (await getProductsByCategory(product.category, 5))
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  return (
    <>
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
              <Link href="/products" className="hover:text-ink">
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
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 440px"
                  className="object-contain"
                />
              </div>

              <div className="flex flex-col">
                <h1 className="font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
                  {product.name}
                </h1>

                {product.keywords.length > 0 && (
                  <p className="mt-4 max-w-2xl text-[17px] text-ink/90">
                    สินค้านี้เกี่ยวข้องกับ: {product.keywords.join(", ")} หากคุณกำลังมองหาอุปกรณ์หรือปัจจัยการผลิตสำหรับเรื่องนี้
                    สินค้านี้อาจช่วยให้คุณไม่ต้องเสียเวลาหาใหม่
                  </p>
                )}

                <div className="mt-8">
                  <a
                    href={product.affiliateLink}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    className="btn-primary"
                  >
                    ดูสินค้า
                  </a>
                </div>
              </div>
            </div>

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
