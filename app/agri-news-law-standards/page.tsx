import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("agri-news-law-standards", "ข่าว กฎหมาย มาตรฐาน", "ข่าวเกษตร กฎหมาย หน่วยงาน และมาตรฐานสำหรับเกษตรกรไทย GAP เกษตรอินทรีย์ ขั้นตอนราชการ และสิทธิเกษตรกร");

export default function Page() {
  return (
    <CategoryPage slug="agri-news-law-standards" icon="📋" title="ข่าว กฎหมาย มาตรฐาน"
      intro="ข่าวเกษตร กฎหมาย หน่วยงานที่เกี่ยวข้อง และมาตรฐานการผลิต เช่น GAP เกษตรอินทรีย์ พร้อมขั้นตอนราชการที่ควรรู้"
      topics={["มาตรฐาน GAP","เกษตรอินทรีย์ (Organic Thailand)","การขึ้นทะเบียนเกษตรกร","สิทธิและสวัสดิการเกษตรกร","หน่วยงานเกษตรที่ควรรู้จัก","ข่าวสารและนโยบายเกษตร"]} />
  );
}
