import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import MinimumSellingPrice from "@/components/tools/MinimumSellingPrice";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "คำนวณราคาขายขั้นต่ำ";
const DESCRIPTION =
  "เครื่องมือคำนวณราคาขายขั้นต่ำที่ไม่ขาดทุน รวมต้นทุนวัตถุดิบ แรงงาน บรรจุภัณฑ์ ค่าธรรมเนียมแพลตฟอร์ม พร้อมราคาที่ได้กำไรตามเป้าหมายและตารางวิเคราะห์ความเสี่ยง";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/minimum-selling-price",
});

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/minimum-selling-price",
  breadcrumbLabel: TITLE,
});

export default function Page() {
  return (
    <ToolShell
      icon="🧮"
      title={TITLE}
      intro="ใส่ต้นทุนทั้งหมด ค่าธรรมเนียมแพลตฟอร์ม และผลผลิต แล้วดูราคาขายขั้นต่ำที่ไม่ขาดทุน ราคาที่ได้กำไรตามเป้าหมาย และผลกระทบเมื่อต้นทุนสูงขึ้นหรือผลผลิตลดลง"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MinimumSellingPrice
        affiliateRecommendations={
          <AffiliateRecommendations
            tags={["เครื่องชั่ง", "บรรจุภัณฑ์", "เครื่องซีล", "สติกเกอร์ฉลาก", "ตะกร้า", "เครื่องพิมพ์ฉลาก"]}
            heading="อุปกรณ์ที่เกี่ยวข้อง"
          />
        }
      />
    </ToolShell>
  );
}
