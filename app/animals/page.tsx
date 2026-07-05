import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("animals", "เลี้ยงสัตว์", "วิธีเลี้ยงสัตว์สำหรับเกษตรกรไทย ไก่ เป็ด หมู วัว ควาย แพะ โคนม การจัดการโรงเรือน อาหารสัตว์ และการป้องกันโรค");

export default function Page() {
  return (
    <CategoryPage
      slug="animals"
      icon="🐔"
      title="เลี้ยงสัตว์"
      intro="ไก่ เป็ด หมู วัว ควาย แพะ โคนม การจัดการโรงเรือน อาหาร และโรคสัตว์ เริ่มต้นจากจำนวนน้อยแล้วขยายอย่างมั่นใจ"
      topics={[
        "เลี้ยงไก่ไข่ให้คุ้มทุน",
        "เลี้ยงวัวเนื้อและวัวขุน",
        "เลี้ยงหมูขุน",
        "เลี้ยงเป็ดและไก่พื้นเมือง",
        "การทำโรงเรือนและอาหารสัตว์",
        "โรคสัตว์ที่ต้องระวัง",
      ]}
    />
  );
}
