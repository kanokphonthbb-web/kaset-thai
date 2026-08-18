import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import LandAreaConverter from "@/components/tools/LandAreaConverter";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "แปลงหน่วยพื้นที่ ไร่ งาน ตารางวา";
const DESCRIPTION =
  "เครื่องมือแปลงหน่วยพื้นที่ระหว่างไร่ งาน ตารางวา ตารางเมตร เฮกตาร์ และเอเคอร์ พร้อมโหมดรวมพื้นที่แบบไทย ไร่-งาน-ตารางวา ผลลัพธ์อัปเดตทันทีเมื่อกรอกตัวเลข";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/land-area-converter",
});

const FAQS: ToolFaq[] = [
  {
    q: "1 ไร่ กี่ตารางเมตร",
    a: "1 ไร่ เท่ากับ 1,600 ตารางเมตร ตามมาตราวัดพื้นที่ของไทย",
  },
  {
    q: "1 ไร่ มีกี่งาน และกี่ตารางวา",
    a: "1 ไร่ เท่ากับ 4 งาน และเท่ากับ 400 ตารางวา ส่วน 1 งาน เท่ากับ 100 ตารางวา หรือ 400 ตารางเมตร",
  },
  {
    q: "ตารางวา 1 หน่วย เท่ากับกี่ตารางเมตร",
    a: "1 ตารางวา เท่ากับ 4 ตารางเมตร",
  },
  {
    q: "ถ้ามีที่ดิน 2 ไร่ 1 งาน 50 ตารางวา คิดเป็นตารางเมตรเท่าไร",
    a: "ใช้โหมด “รวมพื้นที่ไทย” กรอกไร่ งาน และตารางวาแยกกัน เครื่องมือจะรวมเป็นตารางเมตรและไร่ทศนิยมให้ทันที (ตัวอย่างนี้เท่ากับ 3,800 ตารางเมตร หรือ 2.375 ไร่)",
  },
  {
    q: "1 เฮกตาร์ กับ 1 เอเคอร์ ต่างกันอย่างไร",
    a: "1 เฮกตาร์ เท่ากับ 10,000 ตารางเมตร หรือ 6.25 ไร่ ส่วน 1 เอเคอร์ เท่ากับ 4,046.8564224 ตารางเมตร หรือประมาณ 2.53 ไร่ ทั้งสองหน่วยเป็นหน่วยสากลที่นิยมใช้ในเอกสารต่างประเทศ",
  },
  {
    q: "เครื่องมือนี้ใช้กับที่ดินแบบไม่มีรูปทรงสี่เหลี่ยม (พื้นที่ไม่สม่ำเสมอ) ได้หรือไม่",
    a: "เครื่องมือนี้แปลงหน่วยพื้นที่จากตัวเลขที่คุณทราบอยู่แล้ว ไม่ได้คำนวณพื้นที่จากรูปร่างหรือแนวเขต หากยังไม่ทราบพื้นที่จริง ควรตรวจสอบจากโฉนดที่ดินหรือให้เจ้าหน้าที่รังวัด",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/land-area-converter",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="📐"
      title={TITLE}
      intro="แปลงหน่วยพื้นที่ระหว่างไร่ งาน ตารางวา ตารางเมตร เฮกตาร์ และเอเคอร์ หรือรวมพื้นที่แบบไทย (ไร่-งาน-ตารางวา) เป็นตารางเมตรและไร่ทศนิยม ผลลัพธ์อัปเดตทันทีไม่ต้องกดคำนวณ"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandAreaConverter />

      <div className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink">สูตรการคำนวณ</h2>
        <div className="cc-tip">
          <p className="cc-tip-title">มาตราพื้นที่ไทยและหน่วยสากล</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
            <li>1 ไร่ = 4 งาน = 400 ตารางวา = 1,600 ตารางเมตร</li>
            <li>1 งาน = 100 ตารางวา = 400 ตารางเมตร</li>
            <li>1 ตารางวา = 4 ตารางเมตร</li>
            <li>1 เฮกตาร์ = 10,000 ตารางเมตร = 6.25 ไร่</li>
            <li>1 เอเคอร์ = 4,046.8564224 ตารางเมตร ≈ 2.53 ไร่</li>
          </ul>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ตัวอย่างการคำนวณ</h2>
        <p className="mt-3 text-[17px] text-ink/90">
          ตัวอย่าง: ที่ดิน 2 ไร่ 1 งาน 50 ตารางวา แปลงเป็นตารางเมตรได้ดังนี้ 2 ไร่ = 3,200 ตารางเมตร,
          1 งาน = 400 ตารางเมตร, 50 ตารางวา = 200 ตารางเมตร รวมทั้งหมด 3,200 + 400 + 200 = 3,800 ตารางเมตร
          หรือคิดเป็นไร่ทศนิยมเท่ากับ 3,800 ÷ 1,600 = 2.375 ไร่
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">วิธีใช้งาน</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เลือกโหมด “แปลงหน่วยเดียว” หากมีตัวเลขพื้นที่ในหน่วยเดียวอยู่แล้ว แล้วเลือกหน่วยต้นทาง</li>
          <li>เลือกโหมด “รวมพื้นที่ไทย” หากมีตัวเลขแยกเป็นไร่ งาน ตารางวา (เช่น จากโฉนดที่ดิน)</li>
          <li>ดูผลลัพธ์ในตารางด้านขวา ซึ่งแปลงเป็นทุกหน่วยพร้อมกันโดยไม่ต้องกดคำนวณ</li>
          <li>กด “พิมพ์ / บันทึก PDF” หรือ “คัดลอกผลลัพธ์” เพื่อเก็บไว้ใช้งานต่อ</li>
        </ol>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ข้อจำกัดของเครื่องมือ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เครื่องมือนี้แปลงหน่วยจากตัวเลขพื้นที่ที่คุณป้อนเท่านั้น ไม่ได้คำนวณพื้นที่จากรูปร่างหรือแนวเขตที่ดิน</li>
          <li>ตัวเลขตารางวาในโหมดรวมพื้นที่ไทยปัดเป็นทศนิยม 2 ตำแหน่ง อาจมีความคลาดเคลื่อนเล็กน้อยจากการปัดเศษ</li>
          <li>สำหรับเอกสารทางกฎหมาย เช่น การซื้อขายหรือโอนที่ดิน ควรอ้างอิงตัวเลขพื้นที่จากโฉนดหรือหน่วยงานที่ดินโดยตรง</li>
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
        tags={["เครื่องมือฟาร์ม", "อุปกรณ์วัด"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
