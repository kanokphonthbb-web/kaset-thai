import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FertilizerCostComparison from "@/components/tools/FertilizerCostComparison";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "เปรียบเทียบต้นทุนธาตุอาหารปุ๋ย";
const DESCRIPTION =
  "เครื่องมือเปรียบเทียบราคาปุ๋ย ใส่สัดส่วน N-P-K น้ำหนักถุง และราคาถุงของปุ๋ยแต่ละยี่ห้อ/สูตร แล้วดูต้นทุนต่อกิโลกรัมของปุ๋ยและต้นทุนต่อกิโลกรัมของธาตุอาหารแต่ละตัว (N, P₂O₅, K₂O)";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/fertilizer-cost-comparison",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้บอกไหมว่าปุ๋ยสูตรไหน \"ดีกว่า\"",
    a: "ไม่บอก เครื่องมือนี้เปรียบเทียบต้นทุนต่อธาตุอาหารเท่านั้น (บาทต่อกิโลกรัมของ N, P₂O₅, K₂O) เพราะพืชแต่ละชนิดและแต่ละช่วงการเจริญเติบโตต้องการสัดส่วนธาตุอาหารต่างกัน การจะใช้สูตรไหนขึ้นกับความต้องการของพืชและผลวิเคราะห์ดิน ไม่ใช่แค่ราคาต่อธาตุ",
  },
  {
    q: "N, P₂O₅, K₂O คืออะไร",
    a: "เป็นวิธีมาตรฐานที่ใช้บอกปริมาณธาตุอาหารหลักบนถุงปุ๋ย: N คือไนโตรเจน, P₂O₅ คือฟอสฟอรัสที่แสดงในรูปฟอสฟอรัสเพนทอกไซด์ และ K₂O คือโพแทสเซียมที่แสดงในรูปโพแทสเซียมออกไซด์ ตัวเลขสูตรปุ๋ยบนถุง (เช่น 16-16-16) คือเปอร์เซ็นต์ของ N-P₂O₅-K₂O ตามลำดับ",
  },
  {
    q: "ทำไมบางช่องในตารางผลลัพธ์แสดง \"-\"",
    a: "แสดง \"-\" เมื่อคำนวณต้นทุนต่อธาตุนั้นไม่ได้ เช่น สัดส่วนธาตุนั้นเป็น 0% ในสูตรปุ๋ย หรือไม่ได้กรอกน้ำหนักถุง ไม่ได้หมายความว่าปุ๋ยนั้นไม่ดี",
  },
  {
    q: "เปรียบเทียบปุ๋ยได้สูงสุดกี่รายการ",
    a: "เพิ่มได้สูงสุด 5 รายการต่อครั้ง เริ่มต้นที่ 2 รายการ และลบออกได้จนเหลือขั้นต่ำ 2 รายการเพื่อให้ยังเปรียบเทียบได้",
  },
  {
    q: "ควรใช้ตัวเลขนี้เปรียบเทียบอย่างไรให้ถูกต้อง",
    a: "ควรเปรียบเทียบต้นทุนต่อธาตุอาหารระหว่างปุ๋ยที่ให้ธาตุอาหารในสัดส่วนใกล้เคียงกันหรือเจาะจงธาตุเดียวกัน เช่น เทียบต้นทุนต่อกก. N ระหว่างปุ๋ยไนโตรเจนสูงหลายยี่ห้อ ไม่ควรใช้เทียบข้ามสูตรที่มีวัตถุประสงค์ต่างกันโดยตรง",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/fertilizer-cost-comparison",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="⚖️"
      title={TITLE}
      intro="ใส่สัดส่วน N-P-K น้ำหนักถุง และราคาถุงของปุ๋ยแต่ละยี่ห้อ/สูตร แล้วดูต้นทุนต่อกิโลกรัมของปุ๋ยและต้นทุนต่อกิโลกรัมของธาตุอาหารแต่ละตัว เปรียบเทียบความคุ้มค่าได้ง่ายขึ้น"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FertilizerCostComparison />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>ต้นทุนต่อกก.ปุ๋ย = ราคาถุง ÷ น้ำหนักถุง (กก.)</li>
              <li>น้ำหนักธาตุอาหารต่อถุง = น้ำหนักถุง (กก.) × สัดส่วนธาตุนั้น (%) ÷ 100</li>
              <li>ต้นทุนต่อกก.ธาตุอาหาร = ราคาถุง ÷ น้ำหนักธาตุอาหารต่อถุง</li>
            </ul>
          </div>
          <p className="mt-4 text-[15px] text-ink/90">
            <strong>ข้อควรทราบ:</strong> เครื่องมือนี้เปรียบเทียบต้นทุนต่อธาตุอาหารเท่านั้น ไม่ได้ตัดสินว่าปุ๋ยสูตรไหน
            &quot;ดีกว่า&quot; เพราะพืชแต่ละชนิดต้องการสัดส่วนธาตุอาหารต่างกันตามชนิดและช่วงการเจริญเติบโต
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ปุ๋ยสูตร 46-0-0 (ยูเรีย) ถุงละ 50 กก. ราคา 750 บาท
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>ต้นทุนต่อกก.ปุ๋ย</td>
                  <td>750 ÷ 50 = 15 บาท/กก.</td>
                </tr>
                <tr>
                  <td>น้ำหนัก N ต่อถุง</td>
                  <td>50 × 46 ÷ 100 = 23 กก.</td>
                </tr>
                <tr>
                  <td>ต้นทุนต่อกก. N</td>
                  <td>750 ÷ 23 ≈ 32.6 บาท/กก.</td>
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
            <li>กรอกชื่อ/สูตรปุ๋ยแต่ละยี่ห้อที่ต้องการเปรียบเทียบ (เริ่มต้น 2 รายการ เพิ่มได้สูงสุด 5 รายการ)</li>
            <li>กรอกสัดส่วน N, P (เทียบเป็น P₂O₅), K (เทียบเป็น K₂O) เป็นเปอร์เซ็นต์ตามที่ระบุบนถุง</li>
            <li>กรอกน้ำหนักถุง (กก.) และราคาถุง (บาท) ของแต่ละรายการ</li>
            <li>กด &quot;เปรียบเทียบต้นทุน&quot; เพื่อดูตารางต้นทุนต่อกก.ปุ๋ยและต่อกก.ธาตุอาหารแต่ละตัว</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้เปรียบเทียบต้นทุนต่อธาตุอาหารจากตัวเลขที่คุณกรอกเท่านั้น ไม่ได้ตัดสินคุณภาพ ความละลายง่าย
            หรือความเหมาะสมของปุ๋ยแต่ละสูตรกับพืชแต่ละชนิด ไม่ได้รวมค่าขนส่งหรือส่วนลดปริมาณมาก
            และไม่ได้ทดแทนคำแนะนำจากผลวิเคราะห์ดินหรือนักวิชาการเกษตร
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
            tool="fertilizer-cost-comparison"
            links={[{ href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยต่อไร่" }]}
          />
        </section>
      </div>

      <AffiliateRecommendations tags={["ปุ๋ย", "เครื่องชั่ง"]} heading="อุปกรณ์ที่เกี่ยวข้อง" />
    </ToolShell>
  );
}
