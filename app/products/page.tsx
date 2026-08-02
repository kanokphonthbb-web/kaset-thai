import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import ProductsBrowser from "@/components/ProductsBrowser";
import { getAllProducts, isProductIndexable, productDisplayName } from "@/lib/products";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "สินค้าและอุปกรณ์การเกษตร",
  description:
    "รวมสินค้าและอุปกรณ์การเกษตร พร้อมข้อมูลประโยชน์ วิธีใช้ วิธีเลือก และข้อควรระวัง ค้นหาและกรองตามหมวดความรู้ได้",
  path: "/products",
});

// ISR: สินค้าจาก DB (Turso) อัปเดตได้ — regenerate ทุก 5 นาที
export const revalidate = 300;

export default async function ProductsPage() {
  const allProducts = (await getAllProducts()).sort(
    (left, right) => Number(isProductIndexable(right)) - Number(isProductIndexable(left)),
  );
  // Strip affiliateLink before handing data to the client component — it hydrates
  // with the full catalog for search/filter, and the outbound link must never be
  // serialized into that payload (would leak into page source as plain text).
  const products = allProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: productDisplayName(product),
    imageUrl: product.imageUrl,
    category: product.category,
    keywords: product.keywords,
  }));

  return (
    <>
      <Header />
      <main>
        <section className="bg-paper py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="เลือกสรรมาให้"
              title="สินค้าและอุปกรณ์การเกษตร"
              desc="ค้นหาตามงานที่ต้องทำ พร้อมอ่านประโยชน์ วิธีใช้ วิธีเลือก และข้อควรระวังก่อนออกไปตรวจสอบรายละเอียดกับร้านค้า"
              headingLevel={1}
            />
            <div className="mt-12">
              <ProductsBrowser products={products} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
