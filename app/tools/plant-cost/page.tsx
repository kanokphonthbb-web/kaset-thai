import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import PlantCostCalculator from "@/components/tools/PlantCostCalculator";
import { buildToolJsonLd } from "@/lib/toolSeo";

const TITLE = "คำนวณต้นทุนปลูกพืช";
const DESCRIPTION = "เครื่องมือคำนวณต้นทุน กำไร และจุดคุ้มทุนของการปลูกพืชต่อไร่ สำหรับเกษตรกรไทย ใส่ค่าเมล็ดพันธุ์ ปุ๋ย แรงงาน แล้วรู้ผลทันที";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/tools/plant-cost" });

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/plant-cost",
  breadcrumbLabel: TITLE,
});

export default function Page() {
  return (
    <ToolShell
      icon="📊"
      title="คำนวณต้นทุนปลูกพืช"
      intro="ใส่พื้นที่ ค่าเมล็ดพันธุ์ ปุ๋ย แรงงาน และราคาขาย แล้วดูต้นทุน กำไร และจุดคุ้มทุนต่อไร่ทันที เพื่อวางแผนก่อนลงมือปลูก"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlantCostCalculator />
    </ToolShell>
  );
}
