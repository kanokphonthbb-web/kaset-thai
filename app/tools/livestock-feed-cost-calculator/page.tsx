import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import LivestockFeedCostCalculator from "@/components/tools/LivestockFeedCostCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณค่าอาหารสัตว์";
const DESCRIPTION =
  "เครื่องมือคำนวณค่าอาหารสัตว์ ใช้ได้กับวัว หมู ไก่ ปลา และสัตว์เลี้ยงในฟาร์มทุกชนิด ใส่จำนวนสัตว์ ปริมาณอาหารต่อตัวต่อวัน ราคาอาหาร และจำนวนวัน แล้วดูค่าอาหารรวมและค่าอาหารต่อตัวทันที";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/livestock-feed-cost-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "ใช้กับสัตว์ชนิดไหนได้บ้าง",
    a: "ใช้ได้กับสัตว์ทุกชนิดที่คิดปริมาณอาหารเป็นกิโลกรัมต่อตัวต่อวัน เช่น วัว หมู ไก่ ปลา แพะ แกะ เพียงกรอกปริมาณอาหารต่อตัวต่อวันของสัตว์ชนิดนั้นให้ตรงกับที่เลี้ยงจริง",
  },
  {
    q: "ปริมาณอาหารต่อตัวต่อวันควรใช้ตัวเลขจากไหน",
    a: "ควรใช้ปริมาณอาหารจริงที่ให้สัตว์ในฟาร์มของคุณ ซึ่งต่างกันตามชนิดสัตว์ อายุ น้ำหนักตัว และสูตรอาหาร หากไม่แน่ใจสามารถดูจากฉลากอาหารสัตว์หรือคำแนะนำของผู้ผลิต",
  },
  {
    q: "ค่าอาหาร/ตัว คำนวณอย่างไร",
    a: "คำนวณจากค่าอาหารรวมทั้งหมด (ตลอดจำนวนวันที่กรอก) หารด้วยจำนวนสัตว์ เป็นค่าเฉลี่ยต้นทุนอาหารต่อตัวตลอดช่วงเวลานั้น ไม่ใช่ต้นทุนต่อตัวต่อวัน",
  },
  {
    q: "ถ้าสัตว์แต่ละตัวกินอาหารไม่เท่ากันจะคำนวณอย่างไร",
    a: "เครื่องมือนี้ใช้ค่าเฉลี่ยปริมาณอาหารต่อตัวต่อวันเดียวกันสำหรับสัตว์ทุกตัว หากสัตว์มีขนาดหรืออายุต่างกันมาก แนะนำให้แบ่งกลุ่มคำนวณแยกทีละกลุ่มแล้วนำผลรวมมาบวกกันเอง",
  },
  {
    q: "ผลลัพธ์นี้รวมต้นทุนอื่นนอกจากอาหารหรือไม่",
    a: "ไม่รวม เครื่องมือนี้คำนวณเฉพาะค่าอาหารเท่านั้น หากต้องการดูต้นทุนรวมทั้งฟาร์ม (พันธุ์ โรงเรือน แรงงาน ฯลฯ) แนะนำใช้เครื่องมือคำนวณต้นทุนเลี้ยงสัตว์ควบคู่กัน",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/livestock-feed-cost-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🥣"
      title={TITLE}
      intro="ใส่จำนวนสัตว์ ปริมาณอาหารต่อตัวต่อวัน ราคาอาหาร และจำนวนวัน แล้วดูค่าอาหารรวมและค่าอาหารต่อตัวทันที ใช้ได้กับวัว หมู ไก่ ปลา และสัตว์เลี้ยงในฟาร์มทุกชนิด"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LivestockFeedCostCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>อาหาร/วัน (กก.) = จำนวนสัตว์ × อาหารต่อตัวต่อวัน (กก.)</li>
              <li>อาหารรวม (กก.) = อาหาร/วัน × จำนวนวัน</li>
              <li>ค่าอาหารรวม = อาหารรวม × ราคาอาหารต่อกก.</li>
              <li>ค่าอาหาร/ตัว = ค่าอาหารรวม ÷ จำนวนสัตว์</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> เลี้ยงสัตว์ 20 ตัว ให้อาหาร 2 กก./ตัว/วัน ราคาอาหาร 15 บาท/กก.
            เป็นเวลา 30 วัน
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>อาหาร/วัน</td>
                  <td>20 × 2 = 40 กก.</td>
                </tr>
                <tr>
                  <td>อาหารรวม</td>
                  <td>40 × 30 = 1,200 กก.</td>
                </tr>
                <tr>
                  <td>ค่าอาหารรวม</td>
                  <td>1,200 × 15 = 18,000 บาท</td>
                </tr>
                <tr>
                  <td>ค่าอาหาร/ตัว</td>
                  <td>18,000 ÷ 20 = 900 บาท</td>
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
            <li>กรอกจำนวนสัตว์ในฟาร์ม</li>
            <li>กรอกปริมาณอาหารต่อตัวต่อวัน (กก.) ตามที่เลี้ยงจริง</li>
            <li>กรอกราคาอาหารต่อกิโลกรัม</li>
            <li>กรอกจำนวนวันที่ต้องการคำนวณ (เช่น 30 วันสำหรับ 1 เดือน)</li>
            <li>กด &quot;คำนวณค่าอาหารสัตว์&quot; เพื่อดูผลลัพธ์</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้คำนวณเฉพาะค่าอาหารจากตัวเลขที่คุณป้อนเท่านั้น ไม่ได้รวมต้นทุนอื่น เช่น ค่าพันธุ์สัตว์
            โรงเรือน ค่าแรง หรือค่ายา/วัคซีน และใช้ปริมาณอาหารต่อตัวต่อวันค่าเดียวกันสำหรับสัตว์ทุกตัวในกลุ่ม
            หากสัตว์มีขนาดหรืออายุต่างกันมาก ควรแบ่งกลุ่มคำนวณแยกกัน
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
            tool="livestock-feed-cost-calculator"
            links={[
              { href: "/tools/egg-farm-profit-calculator", label: "คำนวณกำไรฟาร์มไก่ไข่" },
              { href: "/tools/fcr-calculator", label: "คำนวณ FCR อัตราแลกเนื้อ" },
              { href: "/tools/animal-cost", label: "คำนวณต้นทุนเลี้ยงสัตว์" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["อาหารสัตว์", "รางอาหาร", "เครื่องชั่ง"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
