import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import SolarPumpCalculator from "@/components/tools/SolarPumpCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "ประเมินขนาดแผงโซลาร์สำหรับปั๊มน้ำ";
const DESCRIPTION =
  "เครื่องมือคำนวณโซลาร์เซลล์สำหรับปั๊มน้ำเบื้องต้น ใส่กำลังปั๊ม ชั่วโมงใช้งาน ชั่วโมงแดด และการสูญเสียของระบบ แล้วดูพลังงานที่ต้องใช้ต่อวันและขนาดแผงโซลาร์โดยประมาณ";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/solar-pump-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้ออกแบบระบบโซลาร์ปั๊มน้ำให้เลยหรือไม่",
    a: "ไม่ได้ออกแบบให้ เป็นเพียงการประมาณขนาดแผงโซลาร์เบื้องต้นจากพลังงานที่ปั๊มต้องใช้ต่อวันเท่านั้น การออกแบบระบบจริง เช่น สายไฟ คอนโทรลเลอร์ เบรกเกอร์ และแรงดันไฟฟ้า ต้องให้ช่างหรือวิศวกรที่มีความรู้ด้านไฟฟ้าตรวจสอบและออกแบบให้เหมาะสม",
  },
  {
    q: "ชั่วโมงแดด/วัน ควรใช้ตัวเลขเท่าไหร่",
    a: "ค่าเริ่มต้นในเครื่องมือนี้คือ 4.5 ชั่วโมง ซึ่งเป็นค่ากลางโดยประมาณ แต่ชั่วโมงแดดจริงต่างกันตามพื้นที่ ฤดูกาล และสภาพอากาศแต่ละวัน ควรปรับตัวเลขให้ใกล้เคียงกับพื้นที่และช่วงเวลาที่ต้องการใช้งานจริง",
  },
  {
    q: "การสูญเสียของระบบ (%) คืออะไร ทำไมต้องตั้งไว้ 30%",
    a: "คือพลังงานที่สูญเสียไปในระบบก่อนถึงปั๊ม เช่น ความร้อนในสายไฟ ประสิทธิภาพของอินเวอร์เตอร์/คอนโทรลเลอร์ และการสูญเสียจากแบตเตอรี่ (ถ้ามี) ค่าเริ่มต้น 30% เป็นค่ากลางที่ใช้ประมาณเบื้องต้น ระบบจริงอาจสูญเสียมากหรือน้อยกว่านี้ ควรปรับตามอุปกรณ์ที่ใช้จริง",
  },
  {
    q: "ขนาดแผงที่คำนวณได้ เท่ากับขนาดแผงที่ต้องซื้อจริงหรือไม่",
    a: "เป็นเพียงตัวเลขประมาณขั้นต่ำเบื้องต้นเท่านั้น การเลือกขนาดแผงจริงควรเผื่อกำลังการผลิตเพิ่มเติมสำหรับวันที่แดดน้อยกว่าค่าเฉลี่ย และควรให้ผู้ติดตั้งระบบโซลาร์ตรวจสอบสเปกอุปกรณ์ทั้งระบบให้เข้ากันก่อนตัดสินใจซื้อ",
  },
  {
    q: "ทำไมผลลัพธ์แสดง \"-\" สำหรับขนาดแผง",
    a: "แสดง \"-\" เมื่อกรอกชั่วโมงแดด/วัน เป็น 0 หรือค่าว่าง เนื่องจากไม่สามารถคำนวณขนาดแผงจากชั่วโมงแดดที่เป็นศูนย์ได้ ให้กรอกชั่วโมงแดดที่มากกว่า 0 เพื่อดูผลลัพธ์",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/solar-pump-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="☀️"
      title={TITLE}
      intro="ใส่กำลังปั๊ม ชั่วโมงใช้งาน ชั่วโมงแดด และการสูญเสียของระบบ แล้วดูพลังงานที่ต้องใช้ต่อวันและขนาดแผงโซลาร์โดยประมาณ เป็นการประเมินเบื้องต้นเท่านั้น"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="card mb-8" style={{ borderLeft: "4px solid #e6a23c" }}>
        <p className="text-sm font-semibold text-ink">
          ⚠️ เครื่องมือนี้เป็นเพียง <span className="font-bold">การประมาณเบื้องต้น</span> ไม่ใช่การออกแบบระบบไฟฟ้า
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
          <li>ไม่ได้คำนวณสายไฟ คอนโทรลเลอร์ เบรกเกอร์ หรือแรงดันไฟฟ้าที่ต้องใช้จริง</li>
          <li>ไม่ได้แทนที่การตรวจสอบและออกแบบโดยช่างหรือวิศวกรไฟฟ้า</li>
          <li>ชั่วโมงแดดจริงเปลี่ยนแปลงตามพื้นที่ ฤดูกาล และสภาพอากาศ</li>
          <li>ควรให้ช่างหรือวิศวกรตรวจสอบระบบทั้งหมดก่อนติดตั้งจริงทุกครั้ง</li>
        </ul>
      </div>

      <SolarPumpCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>พลังงาน/วัน (Wh) = กำลังปั๊ม (วัตต์) × ชั่วโมงใช้งาน/วัน</li>
              <li>ขนาดแผงโดยประมาณ (วัตต์) = พลังงาน/วัน ÷ (ชั่วโมงแดด/วัน × (1 − การสูญเสียของระบบ ÷ 100))</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ปั๊มกำลัง 750 วัตต์ ใช้งาน 4 ชม./วัน ชั่วโมงแดด 4.5 ชม./วัน
            และการสูญเสียของระบบ 30%
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>พลังงาน/วัน</td>
                  <td>750 × 4 = 3,000 Wh</td>
                </tr>
                <tr>
                  <td>ขนาดแผงโดยประมาณ</td>
                  <td>3,000 ÷ (4.5 × (1 − 0.30)) ≈ 952 วัตต์</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            วิธีใช้งาน
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] text-ink/90">
            <li>กรอกกำลังปั๊มน้ำ (วัตต์) ตามสเปกที่ระบุบนตัวปั๊ม</li>
            <li>กรอกจำนวนชั่วโมงที่ต้องการใช้งานปั๊มต่อวัน</li>
            <li>กรอกชั่วโมงแดดต่อวันของพื้นที่คุณ (ค่าเริ่มต้น 4.5 ชม. เป็นค่ากลาง ควรปรับตามพื้นที่/ฤดู)</li>
            <li>กรอกเปอร์เซ็นต์การสูญเสียของระบบ (ค่าเริ่มต้น 30% ปรับได้ตามอุปกรณ์จริง)</li>
            <li>กด &quot;ประเมินขนาดแผงโซลาร์&quot; เพื่อดูผลลัพธ์เบื้องต้น แล้วให้ช่างหรือวิศวกรตรวจสอบก่อนติดตั้งจริง</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้เป็นการประมาณขนาดแผงโซลาร์เบื้องต้นเท่านั้น ไม่ใช่การออกแบบระบบไฟฟ้าที่สมบูรณ์
            ไม่ได้คำนวณสายไฟ คอนโทรลเลอร์ เบรกเกอร์ แรงดันไฟฟ้า หรือความปลอดภัยของระบบ
            และไม่ได้รับประกันว่าแผงขนาดที่คำนวณได้จะเพียงพอในทุกสภาพอากาศ ควรให้ช่างหรือวิศวกรไฟฟ้าที่มีความรู้ตรวจสอบและออกแบบระบบก่อนติดตั้งจริงทุกครั้ง
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            คำถามที่พบบ่อย
          </h2>
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
        </section>

        <section className="mt-10">
          <p className="eyebrow">เครื่องมือและบทความที่เกี่ยวข้อง</p>
          <RelatedToolLinks
            tool="solar-pump-calculator"
            links={[
              { href: "/tools/irrigation-calculator", label: "คำนวณน้ำ ระบบน้ำหยด/สปริงเกอร์" },
              { href: "/tools/pump-size-calculator", label: "คำนวณขนาดปั๊มน้ำเกษตร" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["โซลาร์เซลล์", "ปั๊มน้ำ"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
