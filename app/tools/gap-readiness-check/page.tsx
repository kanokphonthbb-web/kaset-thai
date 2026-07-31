import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import GapReadinessCheck from "@/components/tools/GapReadinessCheck";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "ตรวจความพร้อมก่อนขอ GAP";
const DESCRIPTION =
  "แบบตรวจความพร้อมเบื้องต้นก่อนขอมาตรฐาน GAP ครอบคลุมแหล่งน้ำ พื้นที่ปลูก การใช้ปุ๋ยและสารอันตราย การเก็บวัสดุ สุขอนามัย การบันทึกข้อมูล และความปลอดภัยแรงงาน พร้อมรายการที่ต้องปรับปรุงและเอกสารที่ควรเตรียม";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/gap-readiness-check",
});

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/gap-readiness-check",
  breadcrumbLabel: TITLE,
});

export default function Page() {
  return (
    <ToolShell
      icon="✅"
      title={TITLE}
      intro="ตอบคำถามความพร้อมทีละข้อ แล้วดูผลสรุป รายการที่ต้องปรับปรุง เอกสารที่ควรเตรียม และหน่วยงานที่ควรตรวจสอบข้อมูลเพิ่มเติม"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="card mb-8" style={{ borderLeft: "4px solid #e6a23c" }}>
        <p className="text-sm font-semibold text-ink">
          ⚠️ เครื่องมือนี้เป็นเพียง <span className="font-bold">แบบตรวจความพร้อมเบื้องต้น</span> เพื่อเตรียมตัวเท่านั้น
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
          <li>ไม่ใช่การตรวจประเมินอย่างเป็นทางการ และไม่มีเจ้าหน้าที่มาตรวจสอบจริง</li>
          <li>ไม่รับประกันว่าจะผ่านการรับรองมาตรฐาน GAP</li>
          <li>ข้อกำหนดและหลักเกณฑ์จริงอาจเปลี่ยนแปลงได้ตลอดเวลา</li>
          <li>
            ควรตรวจสอบข้อมูลล่าสุดด้วยตนเองจากหน่วยงานที่เกี่ยวข้อง เช่น กรมวิชาการเกษตร มกอช. หรือสำนักงานเกษตรในพื้นที่
          </li>
        </ul>
      </div>

      <GapReadinessCheck
        affiliateRecommendations={
          <AffiliateRecommendations
            tags={["สมุดบันทึก", "ถุงมือ", "กล่องเก็บ", "ป้าย", "ทำความสะอาด", "น้ำยาฆ่าเชื้อ", "เครื่องชั่ง"]}
            heading="อุปกรณ์ที่อาจต้องเตรียม"
          />
        }
      />
    </ToolShell>
  );
}
