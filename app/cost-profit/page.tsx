import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("cost-profit", "ต้นทุนและกำไร", "คำนวณต้นทุนและกำไรการเกษตรสำหรับคนไทย จุดคุ้มทุน การเปรียบเทียบอาชีพเกษตร และการวางแผนรายได้จากฟาร์ม");

export default function Page() {
  return (
    <CategoryPage
      slug="cost-profit"
      icon="💰"
      title="ต้นทุนและกำไร"
      intro="คำนวณต้นทุน กำไร จุดคุ้มทุน และเปรียบเทียบอาชีพเกษตร วางแผนก่อนลงมือ เพื่อให้เห็นกำไรชัดและลดความเสี่ยง"
      topics={[
        "ปลูกข้าว 1 ไร่ ต้นทุนเท่าไหร่",
        "ต้นทุนเลี้ยงไก่ไข่ต่อรอบ",
        "งบเริ่มต้นเลี้ยงวัวเนื้อ",
        "การหาจุดคุ้มทุน",
        "เปรียบเทียบผลตอบแทนแต่ละอาชีพ",
        "การจดบันทึกรายรับรายจ่าย",
      ]}
    />
  );
}
