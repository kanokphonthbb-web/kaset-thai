import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("fishery", "ประมง", "การเลี้ยงสัตว์น้ำสำหรับเกษตรกรไทย ปลาดุก ปลานิล กบ กุ้ง ปูนา การทำบ่อ การจัดการน้ำ และการจับขาย");

export default function Page() {
  return (
    <CategoryPage
      slug="fishery"
      icon="🐟"
      title="ประมง"
      intro="ปลาดุก ปลานิล กบ กุ้ง ปูนา การทำบ่อ และการดูแลน้ำ เหมาะกับพื้นที่เล็กและมือใหม่ที่อยากเริ่มเลี้ยงสัตว์น้ำ"
      topics={[
        "เลี้ยงปลาดุกในบ่อปูน",
        "เลี้ยงปลานิลในบ่อดิน",
        "เลี้ยงกบในกระชัง",
        "การเตรียมบ่อและปล่อยพันธุ์",
        "การจัดการคุณภาพน้ำ",
        "การให้อาหารและการจับขาย",
      ]}
    />
  );
}
