import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import ProductsBrowser from "@/components/ProductsBrowser";
import { getAllProducts } from "@/lib/products";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "สินค้าเพื่อการเกษตรแนะนำ",
  description:
    "อุปกรณ์และปัจจัยการผลิตที่เกี่ยวข้องกับบทความในเว็บนี้ รวบรวมไว้ให้เลือกดูง่ายขึ้น ค้นหาและกรองตามหมวดความรู้ได้",
  path: "/products",
});

// ISR: สินค้าจาก DB (Turso) อัปเดตได้ — regenerate ทุก 5 นาที
export const revalidate = 300;

export default async function ProductsPage() {
  const allProducts = await getAllProducts();
  // Strip affiliateLink before handing data to the client component — it hydrates
  // with the full catalog for search/filter, and the outbound link must never be
  // serialized into that payload (would leak into page source as plain text).
  const products = allProducts.map(({ id, slug, name, imageUrl, category, keywords }) => ({
    id,
    slug,
    name,
    imageUrl,
    category,
    keywords,
  }));

  return (
    <>
      <Header />
      <main>
        <section className="bg-paper py-20">
          <div className="container-x">
            <SectionHeader
              eyebrow="เลือกสรรมาให้"
              title="สินค้าเพื่อการเกษตรแนะนำ"
              desc="อุปกรณ์และปัจจัยการผลิตที่เกี่ยวข้องกับบทความในเว็บนี้ รวบรวมไว้ให้เลือกดูง่ายขึ้น"
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
