import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import AnimalCostCalculator from "@/components/tools/AnimalCostCalculator";
import { buildToolJsonLd } from "@/lib/toolSeo";

const TITLE = "คำนวณต้นทุนเลี้ยงสัตว์";
const DESCRIPTION = "เครื่องมือคำนวณต้นทุน กำไร และ ROI ต่อรอบการเลี้ยงสัตว์ สำหรับเกษตรกรไทย ประเมินค่าพันธุ์ อาหาร โรงเรือน และอัตรารอด";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/tools/animal-cost" });

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/animal-cost",
  breadcrumbLabel: TITLE,
});

export default function Page() {
  return (
    <ToolShell
      icon="🐖"
      title="คำนวณต้นทุนเลี้ยงสัตว์"
      intro="ประเมินค่าพันธุ์ อาหาร โรงเรือน อัตรารอด และรายได้ต่อตัว แล้วดูกำไรและผลตอบแทน (ROI) ต่อรอบการเลี้ยง"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnimalCostCalculator />
    </ToolShell>
  );
}
