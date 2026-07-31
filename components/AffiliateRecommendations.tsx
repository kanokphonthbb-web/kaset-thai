import { matchAffiliateProducts } from "@/lib/affiliateMatch";
import ProductCard from "@/components/ProductCard";
import AffiliateImpressionPing from "@/components/AffiliateImpressionPing";

// Shared "related products" block for tool result pages. Renders nothing
// (returns null) when there are zero matches — the section must fully
// disappear rather than show an empty state.
export default async function AffiliateRecommendations({
  tags,
  heading = "สินค้าที่เกี่ยวข้อง",
}: {
  tags: string[];
  heading?: string;
}) {
  const products = await matchAffiliateProducts(tags);
  if (products.length === 0) return null;

  return (
    <section className="card mt-10">
      <AffiliateImpressionPing count={products.length} category={tags[0]} />
      <h2 className="font-display text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} compact />
        ))}
      </div>
      {/* Same disclosure wording used on /products/[slug] — reused, not invented */}
      <p className="mt-4 text-xs text-stone">
        ลิงก์นี้เป็นลิงก์พันธมิตร (affiliate link) หากคุณสั่งซื้อผ่านลิงก์นี้ เว็บไซต์อาจได้รับค่าคอมมิชชันโดยที่คุณไม่ต้องจ่ายเพิ่ม
      </p>
    </section>
  );
}
