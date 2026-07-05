import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("diseases", "โรคและการดูแล", "รวมความรู้โรคพืชและโรคสัตว์สำหรับเกษตรกรไทย โรคพืช แมลงศัตรูพืช โรคไก่ โรควัวควาย พร้อมวิธีป้องกันเบื้องต้น");

export default function Page() {
  return (
    <CategoryPage
      slug="diseases"
      icon="🦠"
      title="โรคและการดูแล"
      intro="โรคพืช แมลงศัตรูพืช โรคไก่ โรควัวควาย และวิธีป้องกันเบื้องต้น สังเกตอาการให้เป็น จัดการได้ทันก่อนลุกลาม"
      topics={[
        "โรคใบไหม้และโรคพืชที่พบบ่อย",
        "แมลงศัตรูพืชและการป้องกัน",
        "โรคไก่และการทำวัคซีน",
        "โรควัวควายที่ต้องระวัง",
        "การใช้สารชีวภัณฑ์",
        "สุขาภิบาลฟาร์มเบื้องต้น",
      ]}
    />
  );
}
