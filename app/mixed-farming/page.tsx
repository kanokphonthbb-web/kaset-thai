import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("mixed-farming", "เกษตรผสมผสาน", "แนวทางเกษตรผสมผสานสำหรับคนไทย ปลูกพืช เลี้ยงสัตว์ ทำบ่อปลาในพื้นที่เดียว ลดต้นทุน ใช้พื้นที่ให้คุ้มค่า");

export default function Page() {
  return (
    <CategoryPage
      slug="mixed-farming"
      icon="🚜"
      title="เกษตรผสมผสาน"
      intro="ปลูกพืช เลี้ยงสัตว์ ทำบ่อปลาในพื้นที่เดียว ลดต้นทุน และใช้พื้นที่ให้คุ้ม เหมาะกับเกษตรกรรายย่อยและครัวเรือน"
      topics={[
        "เกษตรผสมผสาน 1 ไร่ ทำอะไรได้บ้าง",
        "การแบ่งพื้นที่ให้คุ้มค่า",
        "เกษตรทฤษฎีใหม่และพอเพียง",
        "หมุนเวียนของเสียเป็นปุ๋ย",
        "ลดต้นทุนในครัวเรือน",
        "วางแผนรายได้ทั้งปี",
      ]}
    />
  );
}
