import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FarmRecord from "@/components/tools/FarmRecord";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "สมุดบันทึกฟาร์ม";
const DESCRIPTION =
  "จดบันทึกกิจกรรม รายรับ รายจ่าย การให้ปุ๋ย อาหารสัตว์ และผลผลิตของฟาร์มได้ฟรี ไม่ต้องสมัครสมาชิก ข้อมูลเก็บไว้ในเบราว์เซอร์นี้เท่านั้น ส่งออกเป็น CSV ได้ทุกเมื่อ";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-record",
});

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-record",
  breadcrumbLabel: TITLE,
});

export default function Page() {
  return (
    <ToolShell
      icon="📒"
      title={TITLE}
      intro="จดบันทึกกิจกรรมประจำวัน รายรับ รายจ่าย การดูแลพืชและสัตว์ในฟาร์มของคุณ ฟรี ไม่ต้องสมัครสมาชิก และไม่ส่งข้อมูลขึ้นเซิร์ฟเวอร์"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmRecord />
      <AffiliateRecommendations
        tags={["สมุดบันทึก", "บัญชีฟาร์ม", "เครื่องชั่ง", "เครื่องพิมพ์ฉลาก", "ป้าย"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
