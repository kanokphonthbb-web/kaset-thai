import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import PumpSizeCalculator from "@/components/tools/PumpSizeCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณขนาดปั๊มน้ำเกษตร";
const DESCRIPTION =
  "เครื่องมือช่วยเลือกปั๊มน้ำเกษตร ใส่ปริมาณน้ำที่ต้องจ่ายต่อรอบและชั่วโมงทำงาน แล้วดูอัตราการไหลขั้นต่ำที่ปั๊มต้องทำได้ (L/h และ m³/h) พร้อมข้อควรระวังเรื่อง Total Dynamic Head ก่อนเลือกซื้อ";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/pump-size-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้คำนวณอะไรให้",
    a: "คำนวณอัตราการไหลขั้นต่ำที่ปั๊มต้องทำได้ จากปริมาณน้ำที่ต้องจ่ายต่อรอบหารด้วยจำนวนชั่วโมงที่ต้องการเปิดปั๊ม ผลลัพธ์แสดงเป็นทั้งลิตรต่อชั่วโมง (L/h) และลูกบาศก์เมตรต่อชั่วโมง (m³/h)",
  },
  {
    q: "ทำไมไม่บอกว่าต้องซื้อปั๊มกี่ HP",
    a: "เพราะกำลัง HP ที่เหมาะสมขึ้นกับ Total Dynamic Head (TDH) ของระบบ ซึ่งรวมความสูงยกน้ำและความเสียดทานในท่อ ที่เครื่องมือนี้ไม่ได้เก็บข้อมูล การแนะนำ HP โดยไม่รู้ TDH อาจทำให้เลือกปั๊มผิดขนาด จึงควรปรึกษาร้านปั๊มน้ำหรือช่างที่ทราบหน้างานจริง",
  },
  {
    q: "Total Dynamic Head (TDH) คืออะไร",
    a: "คือแรงต้านรวมที่ปั๊มต้องเอาชนะเพื่อส่งน้ำไปถึงจุดใช้งาน ประกอบด้วยความสูงยกน้ำ (Static Head) จากแหล่งน้ำถึงจุดที่สูงที่สุดที่ต้องการส่งน้ำ และความเสียดทานในท่อ (Friction Loss) ซึ่งขึ้นกับความยาว ขนาดท่อ และจำนวนข้องอ",
  },
  {
    q: "จะหาปริมาณน้ำที่ต้องจ่ายต่อรอบได้จากไหน",
    a: "หากใช้ระบบน้ำหยดหรือสปริงเกอร์ สามารถใช้เครื่องมือคำนวณน้ำ (/tools/irrigation-calculator) เพื่อคำนวณลิตรต่อรอบจากจำนวนต้น หัวจ่าย และอัตราไหลของหัวจ่ายก่อน แล้วนำตัวเลขนั้นมากรอกในเครื่องมือนี้",
  },
  {
    q: "อัตราการไหลขั้นต่ำต่างจากอัตราการไหลที่ควรเลือกซื้อจริงอย่างไร",
    a: "อัตราการไหลขั้นต่ำคือปริมาณน้ำที่ต้องส่งได้ในเวลาที่กำหนด ส่วนปั๊มที่เลือกซื้อจริงต้องมีอัตราการไหลที่จุดทำงาน (operating point) ไม่ต่ำกว่าตัวเลขนี้ ณ ระดับ TDH ของระบบ ซึ่งต้องดูจากกราฟสมรรถนะ (performance curve) ของปั๊มแต่ละรุ่นประกอบ",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/pump-size-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🚰"
      title={TITLE}
      intro="ใส่ปริมาณน้ำที่ต้องจ่ายต่อรอบและชั่วโมงทำงาน แล้วดูอัตราการไหลขั้นต่ำที่ปั๊มต้องทำได้ ใช้ประกอบการเลือกปั๊มน้ำเกษตรร่วมกับข้อมูล Total Dynamic Head"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PumpSizeCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>อัตราการไหลขั้นต่ำ (L/h) = น้ำที่ต้องจ่ายต่อรอบ (ลิตร) ÷ ชั่วโมงทำงานต่อรอบ</li>
              <li>อัตราการไหลขั้นต่ำ (m³/h) = อัตราการไหลขั้นต่ำ (L/h) ÷ 1,000</li>
            </ul>
          </div>
          <div className="cc-tip">
            <p className="cc-tip-title">⚠️ ข้อควรระวัง: นี่คือ flow ขั้นต่ำเท่านั้น</p>
            <p className="mt-2 text-sm text-ink/90">
              การเลือกปั๊มน้ำจริงต้องคิด <strong>Total Dynamic Head (TDH)</strong> เพิ่มเติม
              คือความสูงยกน้ำ (Static Head) และความเสียดทานในท่อ (Friction Loss) รวมกัน
              เครื่องมือนี้ไม่ได้คำนวณ TDH ให้ และไม่ได้บอกว่าต้องซื้อปั๊มกี่แรงม้า (HP)
              ควรปรึกษาร้านปั๊มน้ำหรือช่างที่ทราบหน้างานจริงก่อนตัดสินใจซื้อ
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ต้องการจ่ายน้ำ 2,000 ลิตรต่อรอบ ภายในเวลาทำงาน 2 ชั่วโมง
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>อัตราการไหลขั้นต่ำ (L/h)</td>
                  <td>2,000 ÷ 2 = 1,000 L/h</td>
                </tr>
                <tr>
                  <td>อัตราการไหลขั้นต่ำ (m³/h)</td>
                  <td>1,000 ÷ 1,000 = 1 m³/h</td>
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
            <li>
              กรอกปริมาณน้ำที่ต้องจ่ายต่อรอบ (ลิตร) — หากยังไม่ทราบตัวเลขนี้ ใช้{" "}
              เครื่องมือคำนวณน้ำ (/tools/irrigation-calculator) เพื่อหาก่อน
            </li>
            <li>กรอกจำนวนชั่วโมงที่ต้องการเปิดปั๊มต่อรอบ</li>
            <li>กด &quot;คำนวณอัตราการไหล&quot; เพื่อดูอัตราการไหลขั้นต่ำที่ปั๊มต้องทำได้</li>
            <li>นำตัวเลขนี้ไปประกอบกับ Total Dynamic Head ของระบบ เพื่อเลือกรุ่นปั๊มกับร้าน/ช่าง</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้คำนวณเฉพาะอัตราการไหลขั้นต่ำที่ต้องการเท่านั้น ไม่ได้คำนวณ Total Dynamic Head
            (ความสูงยกน้ำและความเสียดทานในท่อ) ไม่ได้แนะนำรุ่นหรือกำลัง (HP) ของปั๊มที่ควรซื้อ
            และไม่ได้รับประกันว่าปั๊มที่มีอัตราการไหลตามนี้จะทำงานได้จริงในระบบของคุณ
            ควรปรึกษาร้านปั๊มน้ำหรือช่างที่ทราบหน้างานจริงเสมอ
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
            tool="pump-size-calculator"
            links={[
              { href: "/tools/irrigation-calculator", label: "คำนวณน้ำ ระบบน้ำหยด/สปริงเกอร์" },
              { href: "/tools/solar-pump-calculator", label: "ประเมินขนาดแผงโซลาร์สำหรับปั๊มน้ำ" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["ปั๊มน้ำ", "ระบบน้ำ", "ท่อ"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
