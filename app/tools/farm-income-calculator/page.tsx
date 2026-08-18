import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FarmIncomeCalculator from "@/components/tools/FarmIncomeCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณรายได้-กำไรฟาร์ม";
const DESCRIPTION =
  "เครื่องมือคำนวณกำไรเกษตรและรายได้ต่อไร่ ใส่พื้นที่ ผลผลิตต่อไร่ ราคาขาย และต้นทุนรวม แล้วดูผลผลิตรวม รายได้ กำไร กำไรต่อไร่ และอัตรากำไรทันที";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-income-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้คำนวณกำไรอย่างไร",
    a: "คำนวณจากผลผลิตรวม (พื้นที่ × ผลผลิตต่อไร่) คูณราคาขายเพื่อได้รายได้ แล้วหักด้วยต้นทุนรวมที่คุณกรอกเอง กำไรที่ได้จึงขึ้นอยู่กับความแม่นยำของตัวเลขที่ป้อน",
  },
  {
    q: "ต้นทุนรวมควรรวมอะไรบ้าง",
    a: "ควรรวมต้นทุนทั้งหมดของรอบผลิตนั้น เช่น พันธุ์พืช/สัตว์ ปุ๋ย ยา ค่าแรง ค่าน้ำค่าไฟ ค่าเช่าที่ดิน และค่าเสื่อมอุปกรณ์ ยิ่งครบยิ่งได้ตัวเลขกำไรที่ใกล้เคียงความจริง",
  },
  {
    q: "กำไรต่อไร่กับอัตรากำไร (%) ต่างกันอย่างไร",
    a: "กำไรต่อไร่บอกจำนวนเงินกำไรเฉลี่ยต่อพื้นที่ 1 ไร่ ส่วนอัตรากำไรบอกสัดส่วนกำไรเทียบกับรายได้เป็นเปอร์เซ็นต์ ใช้เปรียบเทียบความคุ้มค่าระหว่างพืชหรือรอบผลิตที่ต่างกันได้ดีกว่า",
  },
  {
    q: "ถ้ากำไรออกมาติดลบหมายความว่าอย่างไร",
    a: "หมายความว่ารายได้จากราคาขายและผลผลิตที่กรอกไว้ยังไม่คุ้มกับต้นทุนที่ใช้ไป ควรพิจารณาลดต้นทุน เพิ่มผลผลิตต่อไร่ หรือหาช่องทางขายที่ได้ราคาสูงขึ้น",
  },
  {
    q: "ใช้กับพืชหรือสัตว์ได้ทุกชนิดไหม",
    a: "ใช้ได้กับกิจกรรมเกษตรที่คิดต้นทุน-รายได้เป็นรอบผลิตต่อพื้นที่ได้ เช่น การปลูกพืชไร่ นาข้าว หรือสวนผลไม้ สำหรับปศุสัตว์ที่ไม่นับพื้นที่เป็นไร่ แนะนำใช้เครื่องมือคำนวณต้นทุนเลี้ยงสัตว์แทน",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-income-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="💰"
      title={TITLE}
      intro="ใส่พื้นที่ ผลผลิตต่อไร่ ราคาขาย และต้นทุนรวม แล้วดูรายได้ กำไร กำไรต่อไร่ และอัตรากำไรทันที ช่วยวางแผนก่อนตัดสินใจลงทุนรอบต่อไป"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmIncomeCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)</li>
              <li>รายได้ = ผลผลิตรวม × ราคาขายต่อ กก.</li>
              <li>กำไร = รายได้ − ต้นทุนรวม</li>
              <li>กำไรต่อไร่ = กำไร ÷ พื้นที่ (ไร่)</li>
              <li>อัตรากำไร (%) = (กำไร ÷ รายได้) × 100</li>
              <li>ราคาคุ้มทุนต่อ กก. = ต้นทุนรวม ÷ ผลผลิตรวม</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ปลูกข้าวโพด 5 ไร่ ได้ผลผลิต 600 กก./ไร่
            ขายได้ 10 บาท/กก. และมีต้นทุนรวม 15,000 บาท
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>ผลผลิตรวม</td>
                  <td>5 × 600 = 3,000 กก.</td>
                </tr>
                <tr>
                  <td>รายได้</td>
                  <td>3,000 × 10 = 30,000 บาท</td>
                </tr>
                <tr>
                  <td>กำไร</td>
                  <td>30,000 − 15,000 = 15,000 บาท</td>
                </tr>
                <tr>
                  <td>กำไรต่อไร่</td>
                  <td>15,000 ÷ 5 = 3,000 บาท/ไร่</td>
                </tr>
                <tr>
                  <td>อัตรากำไร</td>
                  <td>(15,000 ÷ 30,000) × 100 = 50%</td>
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
            <li>กรอกพื้นที่เพาะปลูกหรือเลี้ยง (ไร่)</li>
            <li>กรอกผลผลิตที่คาดว่าจะได้ต่อไร่ (กก.)</li>
            <li>กรอกราคาขายต่อกิโลกรัมที่คาดว่าจะได้</li>
            <li>กรอกต้นทุนรวมทั้งหมดของรอบผลิตนี้</li>
            <li>กด &quot;คำนวณรายได้-กำไร&quot; เพื่อดูผลลัพธ์ แล้วปรับตัวเลขเพื่อเปรียบเทียบสถานการณ์ต่าง ๆ</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            ผลลัพธ์เป็นการประมาณการจากตัวเลขที่คุณป้อนเองเท่านั้น ไม่ได้อ้างอิงราคาตลาดจริงหรือสภาพอากาศ
            ไม่ใช่การรับประกันผลผลิตหรือกำไร และไม่ได้รวมความเสี่ยงจากภัยธรรมชาติ โรคระบาด
            หรือความผันผวนของราคาตลาดที่อาจเกิดขึ้นจริง ควรใช้ประกอบการวางแผนร่วมกับข้อมูลอื่นเสมอ
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
            tool="farm-income-calculator"
            links={[
              { href: "/tools/farm-break-even-calculator", label: "คำนวณจุดคุ้มทุนฟาร์ม" },
              { href: "/tools/crop-yield-calculator", label: "ประเมินผลผลิตพืช" },
              { href: "/tools/minimum-selling-price", label: "คำนวณราคาขายขั้นต่ำ" },
              { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืช" },
              { href: "/tools/animal-cost", label: "คำนวณต้นทุนเลี้ยงสัตว์" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["สมุดบันทึก", "บัญชีฟาร์ม", "เครื่องชั่ง", "ปุ๋ย"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
