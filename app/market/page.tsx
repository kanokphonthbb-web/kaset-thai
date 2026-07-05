import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("market", "ตลาดและการขาย", "ช่องทางขายสินค้าเกษตรสำหรับคนไทย ราคาสินค้าเกษตร การแปรรูป การขายส่ง และการขายออนไลน์เพื่อเพิ่มรายได้");

export default function Page() {
  return (
    <CategoryPage
      slug="market"
      icon="🛒"
      title="ตลาดและการขาย"
      intro="ราคาสินค้าเกษตร ช่องทางขาย การแปรรูป และการขายออนไลน์ ต่อยอดผลผลิตให้เป็นรายได้ที่มั่นคงขึ้น"
      topics={[
        "ช่องทางขายผลผลิตในชุมชน",
        "การขายส่งและตลาดกลาง",
        "ขายออนไลน์และเพจฟาร์ม",
        "การแปรรูปเพิ่มมูลค่า",
        "การตั้งราคาให้มีกำไร",
        "การสร้างลูกค้าประจำ",
      ]}
    />
  );
}
