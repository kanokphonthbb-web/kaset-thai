import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import PlantCostCalculator from "@/components/tools/PlantCostCalculator";

export const metadata = pageMeta({ title: "คำนวณต้นทุนปลูกพืช", description: "เครื่องมือคำนวณต้นทุน กำไร และจุดคุ้มทุนของการปลูกพืชต่อไร่ สำหรับเกษตรกรไทย ใส่ค่าเมล็ดพันธุ์ ปุ๋ย แรงงาน แล้วรู้ผลทันที", path: "/tools/plant-cost" });

export default function Page() {
  return (
    <ToolShell
      icon="📊"
      title="คำนวณต้นทุนปลูกพืช"
      intro="ใส่พื้นที่ ค่าเมล็ดพันธุ์ ปุ๋ย แรงงาน และราคาขาย แล้วดูต้นทุน กำไร และจุดคุ้มทุนต่อไร่ทันที เพื่อวางแผนก่อนลงมือปลูก"
    >
      <PlantCostCalculator />
    </ToolShell>
  );
}
