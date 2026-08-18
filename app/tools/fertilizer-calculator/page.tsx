import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import FertilizerCalculator from "@/components/tools/FertilizerCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "คำนวณปุ๋ย";
const DESCRIPTION =
  "เครื่องมือคำนวณปุ๋ย 2 แบบ: ปริมาณปุ๋ยและต้นทุนต่อไร่จากอัตราที่คุณกำหนด และปริมาณธาตุอาหาร N-P-K จากสูตรปุ๋ยและน้ำหนักที่ใช้ ไม่แนะนำอัตราปุ๋ยเอง";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/fertilizer-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้บอกอัตราปุ๋ยที่ควรใส่หรือไม่",
    a: "ไม่บอก เครื่องมือนี้คำนวณจากอัตราปุ๋ยที่คุณกรอกเองเท่านั้น อัตราที่เหมาะสมควรมาจากคำแนะนำทางการ เช่น กรมวิชาการเกษตร หรือค่าวิเคราะห์ดินของแปลงคุณ",
  },
  {
    q: "P และ K ในสูตรปุ๋ย (เช่น 15-15-15) หมายถึงธาตุบริสุทธิ์หรือไม่",
    a: "ไม่ใช่ สูตรปุ๋ยไทยแสดงค่า P เป็น P₂O₅ (ฟอสฟอรัสเพนทอกไซด์) และ K เป็น K₂O (โพแทสเซียมออกไซด์) อยู่แล้ว ไม่ใช่ธาตุ P และ K บริสุทธิ์ ตัวเลขที่คำนวณได้จึงเป็นน้ำหนักของออกไซด์เหล่านี้",
  },
  {
    q: "จำนวนกระสอบที่คำนวณได้ทำไมปัดขึ้นเสมอ",
    a: "เพราะร้านค้าทั่วไปขายปุ๋ยเป็นกระสอบเต็ม ไม่สามารถซื้อเศษกระสอบได้ เครื่องมือจึงปัดจำนวนกระสอบขึ้น (Ceiling) เพื่อให้ปริมาณปุ๋ยที่ซื้อเพียงพอต่ออัตราที่ตั้งไว้",
  },
  {
    q: "ควรใช้โหมดไหน ปริมาณ+ต้นทุน หรือ ธาตุอาหาร",
    a: "ใช้โหมด “ปริมาณ + ต้นทุน” เมื่อทราบอัตราปุ๋ยต่อไร่แล้วและต้องการรู้ว่าต้องซื้อกี่กระสอบและงบเท่าไร ใช้โหมด “ธาตุอาหาร (NPK)” เมื่อต้องการรู้ว่าปุ๋ยที่ใช้ให้ธาตุ N, P₂O₅, K₂O เท่าไรจากสูตรบนถุง",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/fertilizer-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🧪"
      title={TITLE}
      intro="เลือกโหมด “ปริมาณ + ต้นทุน” เพื่อคำนวณปุ๋ยที่ต้องซื้อและงบประมาณ หรือโหมด “ธาตุอาหาร (NPK)” เพื่อดูปริมาณ N, P₂O₅, K₂O จากสูตรปุ๋ยที่ใช้"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="card mb-8" style={{ borderLeft: "4px solid #e6a23c" }}>
        <p className="text-sm font-semibold text-ink">
          ⚠️ เครื่องมือนี้<span className="font-bold">ไม่แนะนำอัตราปุ๋ยเอง</span>
        </p>
        <p className="mt-2 text-sm text-ink/90">
          อัตราปุ๋ยที่ใช้คำนวณควรมาจากคำแนะนำทางการ เช่น กรมวิชาการเกษตร หรือค่าวิเคราะห์ดินของแปลงคุณ
        </p>
      </div>

      <FertilizerCalculator />

      <div className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink">สูตรการคำนวณ</h2>
        <div className="cc-tip">
          <p className="cc-tip-title">ปริมาณ + ต้นทุน</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
            <li>ปริมาณปุ๋ยรวม = พื้นที่ (ไร่) × อัตราต่อไร่ (กก.)</li>
            <li>จำนวนกระสอบ = ปริมาณรวม ÷ ขนาดกระสอบ (ปัดขึ้น)</li>
            <li>ต้นทุนรวม = จำนวนกระสอบ × ราคาต่อกระสอบ</li>
          </ul>
        </div>
        <div className="cc-tip">
          <p className="cc-tip-title">ธาตุอาหาร (NPK)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
            <li>N (กก.) = น้ำหนักปุ๋ย × (%N ÷ 100)</li>
            <li>P₂O₅ (กก.) = น้ำหนักปุ๋ย × (%P ÷ 100)</li>
            <li>K₂O (กก.) = น้ำหนักปุ๋ย × (%K ÷ 100)</li>
          </ul>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ตัวอย่างการคำนวณ</h2>
        <p className="mt-3 text-[17px] text-ink/90">
          ตัวอย่าง: พื้นที่ 3 ไร่ ใช้อัตราปุ๋ย 50 กก./ไร่ (ตัวเลขสมมติ ต้องตรวจสอบกับคำแนะนำจริง) ปริมาณปุ๋ยรวม = 3 × 50 = 150
          กก. หากซื้อปุ๋ยกระสอบละ 50 กก. ราคากระสอบละ 600 บาท จะต้องซื้อ 150 ÷ 50 = 3 กระสอบ คิดเป็นต้นทุน 3 × 600 = 1,800
          บาท หรือ 600 บาทต่อไร่
        </p>
        <p className="mt-3 text-[17px] text-ink/90">
          ตัวอย่างธาตุอาหาร: ปุ๋ยสูตร 15-15-15 น้ำหนัก 50 กก. จะได้ N = 50 × 15% = 7.5 กก., P₂O₅ = 7.5 กก., K₂O = 7.5 กก.
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">วิธีใช้งาน</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เลือกโหมด “ปริมาณ + ต้นทุน” หากทราบอัตราปุ๋ยต่อไร่และต้องการวางแผนงบประมาณ</li>
          <li>เลือกโหมด “ธาตุอาหาร (NPK)” หากต้องการทราบปริมาณธาตุ N, P₂O₅, K₂O จากสูตรบนถุงปุ๋ย</li>
          <li>กรอกตัวเลขตามอัตราหรือสูตรปุ๋ยจริงที่คุณใช้ แล้วกด &quot;คำนวณ&quot;</li>
          <li>ตรวจสอบผลลัพธ์กับคำแนะนำทางการก่อนตัดสินใจซื้อหรือใส่ปุ๋ยจริง</li>
        </ol>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ข้อจำกัดของเครื่องมือ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เครื่องมือนี้ไม่แนะนำอัตราปุ๋ยหรือสูตรปุ๋ยที่เหมาะสม เป็นเพียงการคำนวณจากตัวเลขที่คุณกรอกเอง</li>
          <li>ไม่ได้คำนึงถึงค่าวิเคราะห์ดิน ชนิดพืช ระยะการเจริญเติบโต หรือสภาพอากาศ ซึ่งล้วนมีผลต่ออัตราปุ๋ยที่เหมาะสมจริง</li>
          <li>ควรตรวจสอบอัตราและสูตรปุ๋ยกับกรมวิชาการเกษตร ค่าวิเคราะห์ดิน หรือนักวิชาการเกษตรก่อนตัดสินใจใส่ปุ๋ยจริง</li>
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

      <AffiliateRecommendations tags={["ปุ๋ย", "ปุ๋ยเคมี", "ปุ๋ยอินทรีย์"]} heading="สินค้าที่เกี่ยวข้อง" />
    </ToolShell>
  );
}
