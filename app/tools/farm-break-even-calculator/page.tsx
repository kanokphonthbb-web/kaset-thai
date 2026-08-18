import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FarmBreakEvenCalculator from "@/components/tools/FarmBreakEvenCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณจุดคุ้มทุนฟาร์ม";
const DESCRIPTION =
  "เครื่องมือคำนวณจุดคุ้มทุนเกษตร ใส่ต้นทุนคงที่ ต้นทุนผันแปร ผลผลิตและราคาขายที่คาด แล้วดูราคาคุ้มทุนต่อกิโลกรัม ผลผลิตคุ้มทุน กำไรคาดการณ์ และ ROI ทันที";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-break-even-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "จุดคุ้มทุนคืออะไร",
    a: "จุดคุ้มทุนคือระดับรายได้หรือปริมาณผลผลิตที่ทำให้รายได้เท่ากับต้นทุนพอดี ไม่ขาดทุนและยังไม่มีกำไร ต่ำกว่าจุดนี้คือขาดทุน สูงกว่าคือเริ่มมีกำไร",
  },
  {
    q: "ต้นทุนคงที่กับต้นทุนผันแปรต่างกันอย่างไร",
    a: "ต้นทุนคงที่ไม่เปลี่ยนตามปริมาณผลผลิต เช่น ค่าเช่าที่ดิน ค่าเสื่อมอุปกรณ์ ส่วนต้นทุนผันแปรเปลี่ยนตามปริมาณผลผลิต เช่น ค่าพันธุ์ ปุ๋ย ค่าแรงเก็บเกี่ยว การแยกสองประเภทนี้ให้ถูกต้องช่วยให้จุดคุ้มทุนแม่นยำขึ้น",
  },
  {
    q: "ราคาคุ้มทุนต่อ กก. ใช้ทำอะไร",
    a: "บอกว่าต้องขายผลผลิตในราคาอย่างน้อยเท่าไหร่ต่อกิโลกรัมจึงจะไม่ขาดทุน ถ้าราคาตลาดจริงต่ำกว่าตัวเลขนี้ แปลว่ารอบผลิตนั้นมีความเสี่ยงขาดทุน",
  },
  {
    q: "ROI ในเครื่องมือนี้คำนวณอย่างไร",
    a: "ROI (%) คำนวณจากกำไรคาดการณ์หารด้วยต้นทุนรวม คูณ 100 เป็นตัวเลขคร่าว ๆ สำหรับเปรียบเทียบความคุ้มค่าระหว่างทางเลือกต่าง ๆ ไม่ใช่ผลตอบแทนที่รับประกันได้จริง",
  },
  {
    q: "ถ้าผลผลิตหรือราคาขายจริงต่างจากที่คาดไว้จะเกิดอะไรขึ้น",
    a: "ผลลัพธ์ที่ได้จากเครื่องมือนี้จะเปลี่ยนตามไปด้วย แนะนำให้ลองปรับตัวเลขผลผลิตและราคาขายหลายสถานการณ์ เช่น กรณีผลผลิตต่ำกว่าคาดหรือราคาตกต่ำ เพื่อประเมินความเสี่ยงก่อนตัดสินใจลงทุน",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-break-even-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="⚖️"
      title={TITLE}
      intro="ใส่ต้นทุนคงที่ ต้นทุนผันแปร ผลผลิตและราคาขายที่คาด แล้วดูราคาคุ้มทุนต่อกิโลกรัม ผลผลิตคุ้มทุน กำไรคาดการณ์ และ ROI เพื่อประเมินความเสี่ยงก่อนลงมือ"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmBreakEvenCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>ต้นทุนรวม = ต้นทุนคงที่ + ต้นทุนผันแปร</li>
              <li>ราคาคุ้มทุนต่อ กก. = ต้นทุนรวม ÷ ผลผลิตที่คาด</li>
              <li>ผลผลิตคุ้มทุน = ต้นทุนรวม ÷ ราคาขายที่คาด</li>
              <li>รายได้คาด = ผลผลิตที่คาด × ราคาขายที่คาด</li>
              <li>กำไรคาด = รายได้คาด − ต้นทุนรวม</li>
              <li>ROI (%) = (กำไรคาด ÷ ต้นทุนรวม) × 100</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ต้นทุนคงที่ 10,000 บาท ต้นทุนผันแปร 20,000 บาท
            คาดผลผลิต 3,000 กก. และคาดราคาขาย 12 บาท/กก.
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>ต้นทุนรวม</td>
                  <td>10,000 + 20,000 = 30,000 บาท</td>
                </tr>
                <tr>
                  <td>ราคาคุ้มทุนต่อ กก.</td>
                  <td>30,000 ÷ 3,000 = 10 บาท/กก.</td>
                </tr>
                <tr>
                  <td>รายได้คาด</td>
                  <td>3,000 × 12 = 36,000 บาท</td>
                </tr>
                <tr>
                  <td>กำไรคาด</td>
                  <td>36,000 − 30,000 = 6,000 บาท</td>
                </tr>
                <tr>
                  <td>ROI</td>
                  <td>(6,000 ÷ 30,000) × 100 = 20%</td>
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
            <li>แยกและกรอกต้นทุนคงที่และต้นทุนผันแปรของรอบผลิตนี้</li>
            <li>กรอกผลผลิตที่คาดว่าจะได้ (กก.)</li>
            <li>กรอกราคาขายที่คาดว่าจะได้ต่อกิโลกรัม</li>
            <li>กด &quot;คำนวณจุดคุ้มทุน&quot; แล้วลองปรับตัวเลขเพื่อดูความเสี่ยงในสถานการณ์ต่าง ๆ</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            ผลลัพธ์เป็นการประมาณการจากตัวเลขที่คุณป้อนเองเท่านั้น ไม่ได้อ้างอิงราคาตลาดจริงหรือความผันผวนของต้นทุนที่อาจเกิดขึ้น
            ไม่ใช่การรับประกันผลตอบแทนหรือความคุ้มทุน ควรใช้ประกอบการวางแผนร่วมกับข้อมูลต้นทุนจริงและสภาพตลาด ณ ขณะนั้นเสมอ
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
            tool="farm-break-even-calculator"
            links={[
              { href: "/tools/farm-income-calculator", label: "คำนวณรายได้-กำไรฟาร์ม" },
              { href: "/tools/minimum-selling-price", label: "คำนวณราคาขายขั้นต่ำ" },
              { href: "/tools/fcr-calculator", label: "คำนวณ FCR อัตราแลกเนื้อ" },
              { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืช" },
              { href: "/tools/animal-cost", label: "คำนวณต้นทุนเลี้ยงสัตว์" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["สมุดบันทึก", "บัญชีฟาร์ม", "เครื่องชั่ง"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
