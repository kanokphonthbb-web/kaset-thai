import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import AnimalCostCalculator from "@/components/tools/AnimalCostCalculator";

export const metadata = pageMeta({ title: "คำนวณต้นทุนเลี้ยงสัตว์", description: "เครื่องมือคำนวณต้นทุน กำไร และ ROI ต่อรอบการเลี้ยงสัตว์ สำหรับเกษตรกรไทย ประเมินค่าพันธุ์ อาหาร โรงเรือน และอัตรารอด", path: "/tools/animal-cost" });

export default function Page() {
  return (
    <ToolShell
      icon="🐖"
      title="คำนวณต้นทุนเลี้ยงสัตว์"
      intro="ประเมินค่าพันธุ์ อาหาร โรงเรือน อัตรารอด และรายได้ต่อตัว แล้วดูกำไรและผลตอบแทน (ROI) ต่อรอบการเลี้ยง"
    >
      <AnimalCostCalculator />
    </ToolShell>
  );
}
