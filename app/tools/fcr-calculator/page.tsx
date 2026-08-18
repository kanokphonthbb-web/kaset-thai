import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FcrCalculator from "@/components/tools/FcrCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณ FCR อัตราแลกเนื้อ";
const DESCRIPTION =
  "เครื่องมือคำนวณ FCR (Feed Conversion Ratio) ใส่อาหารที่ใช้ทั้งหมด น้ำหนักเริ่มต้นและน้ำหนักสุดท้าย แล้วดูอัตราแลกเนื้อและต้นทุนอาหารต่อน้ำหนักที่เพิ่มขึ้น 1 กก.";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/fcr-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "FCR คืออะไร",
    a: "FCR (Feed Conversion Ratio) หรืออัตราแลกเนื้อ คือปริมาณอาหารที่ใช้ (กก.) หารด้วยน้ำหนักตัวที่เพิ่มขึ้น (กก.) ในช่วงเวลาเดียวกัน บอกว่าสัตว์เปลี่ยนอาหารเป็นน้ำหนักตัวได้มีประสิทธิภาพแค่ไหน",
  },
  {
    q: "FCR ค่าน้อยหรือค่ามากดีกว่ากัน",
    a: "ค่ายิ่งน้อยยิ่งดี เพราะหมายถึงใช้อาหารน้อยกว่าเพื่อให้ได้น้ำหนักตัวเพิ่มขึ้นเท่ากัน ซึ่งช่วยลดต้นทุนอาหารต่อหน่วยน้ำหนักที่ได้",
  },
  {
    q: "ค่า FCR ที่ดีควรเป็นเท่าไหร่",
    a: "ค่าอ้างอิงที่ดีแตกต่างกันมากตามชนิดสัตว์ สายพันธุ์ อายุ และสูตรอาหาร เครื่องมือนี้ไม่ได้กำหนดค่าอ้างอิงมาตรฐานไว้ แนะนำให้ตรวจสอบเอกสารวิชาการของกรมปศุสัตว์หรือกรมประมงตามชนิดสัตว์ที่เลี้ยง",
  },
  {
    q: "ใช้คำนวณ FCR ของปลา ไก่ และสุกรได้เหมือนกันหรือไม่",
    a: "สูตรคำนวณเป็นสูตรเดียวกันคือ อาหารที่ใช้ ÷ น้ำหนักที่เพิ่ม ใช้ได้กับสัตว์ทุกชนิดที่บันทึกน้ำหนักเป็นช่วงเวลาได้ แต่ค่าที่ถือว่า \"ดี\" จะต่างกันตามชนิดสัตว์ ควรเทียบกับค่าอ้างอิงของสัตว์ชนิดนั้นโดยเฉพาะ",
  },
  {
    q: "ทำไมผลลัพธ์ขึ้นว่าคำนวณ FCR ไม่ได้",
    a: "เกิดขึ้นเมื่อน้ำหนักสุดท้ายเท่ากับหรือน้อยกว่าน้ำหนักเริ่มต้น ทำให้น้ำหนักที่เพิ่มเป็นศูนย์หรือติดลบ ซึ่งคำนวณ FCR ไม่ได้ในทางคณิตศาสตร์ ควรตรวจสอบตัวเลขน้ำหนักที่บันทึกไว้อีกครั้ง",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/fcr-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🐟"
      title={TITLE}
      intro="ใส่อาหารที่ใช้ทั้งหมด น้ำหนักเริ่มต้น และน้ำหนักสุดท้าย แล้วดูอัตราแลกเนื้อ (FCR) และต้นทุนอาหารต่อน้ำหนักที่เพิ่มขึ้น ใช้ได้ทั้งปลา ไก่ และสุกร"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FcrCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>น้ำหนักที่เพิ่ม = น้ำหนักสุดท้าย − น้ำหนักเริ่มต้น</li>
              <li>FCR = อาหารที่ใช้ทั้งหมด (กก.) ÷ น้ำหนักที่เพิ่ม (กก.)</li>
              <li>ต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม = ค่าอาหารรวม ÷ น้ำหนักที่เพิ่ม (เมื่อกรอกค่าอาหาร)</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ใช้อาหารทั้งหมด 150 กก. น้ำหนักเริ่มต้น 100 กก.
            น้ำหนักสุดท้าย 200 กก. และมีค่าอาหารรวม 3,000 บาท
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>น้ำหนักที่เพิ่ม</td>
                  <td>200 − 100 = 100 กก.</td>
                </tr>
                <tr>
                  <td>FCR</td>
                  <td>150 ÷ 100 = 1.5</td>
                </tr>
                <tr>
                  <td>ต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม</td>
                  <td>3,000 ÷ 100 = 30 บาท</td>
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
            <li>กรอกปริมาณอาหารที่ใช้ทั้งหมดในช่วงเวลาที่บันทึก (กก.)</li>
            <li>กรอกน้ำหนักเริ่มต้นและน้ำหนักสุดท้ายของสัตว์ (กก.)</li>
            <li>กรอกค่าอาหารรวมถ้าต้องการดูต้นทุนอาหารต่อน้ำหนักที่เพิ่ม (ไม่บังคับ)</li>
            <li>กด &quot;คำนวณ FCR&quot; เพื่อดูผลลัพธ์ แล้วเทียบกับค่าอ้างอิงตามสายพันธุ์ที่เลี้ยง</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้คำนวณ FCR จากตัวเลขที่กรอกเท่านั้น ไม่มีค่าอ้างอิงมาตรฐานตามสายพันธุ์หรืออายุสัตว์ในตัวเครื่องมือ
            ค่าที่ถือว่าดีแตกต่างกันมากตามชนิดสัตว์ สายพันธุ์ อายุ และสูตรอาหาร
            ควรตรวจสอบค่าอ้างอิงจากเอกสารของกรมปศุสัตว์หรือกรมประมงตามชนิดสัตว์ที่เลี้ยงประกอบการประเมินเสมอ
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
            tool="fcr-calculator"
            links={[
              { href: "/tools/animal-cost", label: "คำนวณต้นทุนเลี้ยงสัตว์" },
              { href: "/tools/farm-break-even-calculator", label: "คำนวณจุดคุ้มทุนฟาร์ม" },
              { href: "/tools/farm-income-calculator", label: "คำนวณรายได้-กำไรฟาร์ม" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["อาหารสัตว์", "เครื่องชั่ง", "สมุดบันทึก", "รางอาหาร"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
