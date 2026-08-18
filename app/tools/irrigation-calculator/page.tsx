import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import IrrigationCalculator from "@/components/tools/IrrigationCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "คำนวณน้ำ ระบบน้ำหยด/สปริงเกอร์";
const DESCRIPTION =
  "เครื่องมือคำนวณปริมาณน้ำที่ใช้ต่อวันและต่อเดือนสำหรับระบบน้ำหยดหรือสปริงเกอร์ จากจำนวนต้น หัวจ่าย อัตราไหล และรอบการให้น้ำ พร้อมประมาณค่าน้ำและอัตราไหลรวมสำหรับเลือกขนาดปั๊ม";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/irrigation-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "คำนวณน้ำ ระบบน้ำหยด ต้องใช้ข้อมูลอะไรบ้าง",
    a: "ต้องทราบจำนวนต้น จำนวนหัวจ่ายต่อต้น อัตราการไหลของหัวจ่าย (ลิตร/ชั่วโมง) จำนวนชั่วโมงต่อรอบ และจำนวนรอบต่อวัน ซึ่งมักระบุไว้ในสเปกอุปกรณ์หรือคู่มือของระบบที่ติดตั้ง",
  },
  {
    q: "ลิตร/ชั่วโมงต่อหัวจ่ายหาได้จากที่ไหน",
    a: "ดูจากสเปกของหัวน้ำหยดหรือหัวสปริงเกอร์ที่ใช้งานอยู่ โดยทั่วไปหัวน้ำหยดมีอัตราไหลตั้งแต่ 1-8 ลิตร/ชั่วโมง ส่วนสปริงเกอร์จะสูงกว่านี้มาก ควรตรวจสอบจากฉลากหรือคู่มือของอุปกรณ์จริง",
  },
  {
    q: "อัตราไหลรวมของระบบใช้ทำอะไร",
    a: "ใช้ประกอบการเลือกขนาดปั๊มน้ำ เพราะปั๊มต้องมีกำลังส่งน้ำเพียงพอต่ออัตราไหลรวมของทุกหัวจ่ายที่เปิดพร้อมกัน เครื่องมือคำนวณขนาดปั๊มโดยเฉพาะยังไม่เปิดให้ใช้งาน ระหว่างนี้ควรปรึกษาผู้จำหน่ายปั๊มหรือช่างระบบน้ำ",
  },
  {
    q: "ทำไมปริมาณน้ำจริงอาจไม่ตรงกับตัวเลขที่คำนวณได้",
    a: "เพราะแรงดันน้ำในระบบจริง การอุดตันของหัวจ่าย ความยาวท่อ และการสูญเสียแรงดันตามระยะทางล้วนมีผลต่อปริมาณน้ำจริง ตัวเลขจากเครื่องมือนี้เป็นเพียงการประมาณการทางทฤษฎีจากอัตราไหลที่ระบุเท่านั้น",
  },
  {
    q: "ไม่ทราบราคาน้ำต่อ ลบ.ม. ต้องกรอกหรือไม่",
    a: "ไม่จำเป็น เว้นช่องราคาน้ำว่างไว้ได้ เครื่องมือจะยังคำนวณปริมาณน้ำต่อวันและต่อเดือนให้ตามปกติ เพียงแต่จะไม่แสดงค่าน้ำโดยประมาณ",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/irrigation-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="💧"
      title={TITLE}
      intro="ใส่จำนวนต้น หัวจ่าย อัตราไหล ชั่วโมงต่อรอบ และรอบต่อวัน แล้วดูปริมาณน้ำต่อวันและต่อเดือน พร้อมประมาณค่าน้ำและอัตราไหลรวมของระบบ"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <IrrigationCalculator />

      <div className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink">สูตรการคำนวณ</h2>
        <div className="cc-tip">
          <p className="cc-tip-title">ปริมาณน้ำและอัตราไหลรวม</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
            <li>น้ำต่อรอบ = จำนวนต้น × หัวจ่ายต่อต้น × อัตราไหล (ลิตร/ชม.) × ชั่วโมงต่อรอบ</li>
            <li>น้ำต่อวัน = น้ำต่อรอบ × จำนวนรอบต่อวัน</li>
            <li>น้ำต่อเดือน = น้ำต่อวัน × จำนวนวันที่รดต่อเดือน</li>
            <li>1 ลูกบาศก์เมตร = 1,000 ลิตร</li>
            <li>อัตราไหลรวมของระบบ (ลิตร/ชม.) = จำนวนต้น × หัวจ่ายต่อต้น × อัตราไหลต่อหัวจ่าย</li>
          </ul>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ตัวอย่างการคำนวณ</h2>
        <p className="mt-3 text-[17px] text-ink/90">
          ตัวอย่าง: ปลูก 100 ต้น ใช้หัวน้ำหยด 1 หัวต่อต้น อัตราไหล 4 ลิตร/ชั่วโมง รดวันละ 1 รอบ รอบละ 1 ชั่วโมง
          น้ำต่อรอบ = 100 × 1 × 4 × 1 = 400 ลิตร เท่ากับน้ำต่อวัน (รดวันละ 1 รอบ) หากรดทุกวันตลอดเดือน (30 วัน) น้ำต่อเดือน
          = 400 × 30 = 12,000 ลิตร หรือ 12 ลูกบาศก์เมตร อัตราไหลรวมของระบบ = 100 × 1 × 4 = 400 ลิตร/ชั่วโมง
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">วิธีใช้งาน</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[17px] text-ink/90">
          <li>กรอกจำนวนต้นและจำนวนหัวจ่ายต่อต้น</li>
          <li>กรอกอัตราไหลของหัวจ่าย (ดูจากสเปกอุปกรณ์) และจำนวนชั่วโมงต่อรอบ</li>
          <li>กรอกจำนวนรอบต่อวันและจำนวนวันที่รดต่อเดือน</li>
          <li>กรอกราคาน้ำต่อ ลบ.ม. หากต้องการประมาณค่าน้ำรายเดือน (เว้นว่างได้)</li>
          <li>กด &quot;คำนวณปริมาณน้ำ&quot; เพื่อดูผลลัพธ์และอัตราไหลรวมของระบบ</li>
        </ol>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ข้อจำกัดของเครื่องมือ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เป็นการคำนวณทางทฤษฎีจากอัตราไหลที่ระบุเท่านั้น ไม่ได้คำนึงถึงแรงดันน้ำ การอุดตัน หรือความสูญเสียในระบบจริง</li>
          <li>ไม่ได้แนะนำความถี่หรือปริมาณน้ำที่เหมาะสมต่อพืชแต่ละชนิด ควรพิจารณาจากชนิดพืช สภาพดิน และฤดูกาลร่วมด้วย</li>
          <li>เครื่องมือคำนวณขนาดปั๊มน้ำโดยเฉพาะยังไม่เปิดให้ใช้งาน ตัวเลขอัตราไหลรวมเป็นเพียงข้อมูลประกอบการปรึกษาผู้เชี่ยวชาญ</li>
        </ul>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">คำถามที่พบบ่อย</h2>
        <div className="mt-5 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl bg-mist p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                {f.q}
                <span
                  className="shrink-0 text-lg text-stone transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] text-ink/90">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <AffiliateRecommendations
        tags={["ระบบน้ำ", "สปริงเกอร์", "ปั๊มน้ำ"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
