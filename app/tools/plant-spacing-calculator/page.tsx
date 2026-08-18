import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import PlantSpacingCalculator from "@/components/tools/PlantSpacingCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";

const TITLE = "คำนวณจำนวนต้นที่ปลูกได้จากระยะปลูก";
const DESCRIPTION =
  "เครื่องมือคำนวณจำนวนต้นที่ปลูกได้ต่อไร่หรือต่อแปลง จากพื้นที่และระยะปลูก (ระยะระหว่างแถวและระหว่างต้น) พร้อมตัวอย่างการคำนวณและคำแนะนำให้ตรวจสอบระยะปลูกที่เหมาะสมกับพืชแต่ละชนิด";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/plant-spacing-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "1 ไร่ ปลูกได้กี่ต้น",
    a: "ขึ้นอยู่กับระยะปลูกที่ใช้ ยิ่งระยะห่างมาก จำนวนต้นต่อไร่ยิ่งน้อยลง กรอกระยะระหว่างแถวและระหว่างต้นในเครื่องมือนี้เพื่อดูจำนวนต้นโดยประมาณ",
  },
  {
    q: "ระยะปลูกที่เหมาะสมของพืชแต่ละชนิดหาได้จากที่ไหน",
    a: "เครื่องมือนี้ไม่ได้แนะนำระยะปลูกเฉพาะพืช ควรตรวจสอบคำแนะนำจากกรมวิชาการเกษตร สำนักงานเกษตรอำเภอ/จังหวัด หรือแหล่งพันธุ์ที่เชื่อถือได้ เพราะระยะปลูกที่เหมาะสมต่างกันไปตามพันธุ์ ทรงพุ่ม และวิธีจัดการ",
  },
  {
    q: "% พื้นที่ใช้ปลูกได้จริง คืออะไร",
    a: "คือสัดส่วนของพื้นที่ทั้งหมดที่ปลูกต้นไม้ได้จริง หลังหักพื้นที่ทางเดิน คันดิน บ่อน้ำ หรือสิ่งปลูกสร้างอื่น ๆ ออกไป ค่าเริ่มต้นคือ 100% หมายถึงใช้พื้นที่ทั้งหมดปลูกได้",
  },
  {
    q: "ทำไมจำนวนต้นที่คำนวณได้จึงเป็นตัวเลขกลม ไม่มีเศษ",
    a: "เพราะปลูกต้นไม้เป็นหน่วยเต็มต้นไม่ได้ปลูกเป็นเศษ เครื่องมือจึงปัดจำนวนต้นลง (Floor) เพื่อไม่ให้ประเมินจำนวนต้นสูงเกินพื้นที่จริง",
  },
  {
    q: "ระยะระหว่างแถวกับระยะระหว่างต้นต่างกันอย่างไร",
    a: "ระยะระหว่างแถว คือระยะห่างระหว่างแถวปลูกแต่ละแถว ส่วนระยะระหว่างต้น คือระยะห่างระหว่างต้นในแถวเดียวกัน พื้นที่ที่แต่ละต้นใช้ = ระยะระหว่างแถว × ระยะระหว่างต้น",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/plant-spacing-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🌳"
      title={TITLE}
      intro="ใส่พื้นที่ปลูก (ไร่-งาน-ตารางวา) และระยะปลูก (ระยะระหว่างแถวและระหว่างต้น) แล้วดูจำนวนต้นโดยประมาณ ต้นต่อไร่ และพื้นที่ใช้ปลูกได้จริง"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlantSpacingCalculator />

      <div className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink">สูตรการคำนวณ</h2>
        <div className="cc-tip">
          <p className="cc-tip-title">การประมาณจำนวนต้นจากระยะปลูก</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
            <li>พื้นที่ใช้ปลูกได้จริง = พื้นที่ทั้งหมด × % ใช้ได้</li>
            <li>พื้นที่ต่อต้น = ระยะระหว่างแถว (เมตร) × ระยะระหว่างต้น (เมตร)</li>
            <li>จำนวนต้น = พื้นที่ใช้ปลูกได้จริง ÷ พื้นที่ต่อต้น (ปัดลงเป็นจำนวนเต็ม)</li>
          </ul>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ตัวอย่างการคำนวณ</h2>
        <p className="mt-3 text-[17px] text-ink/90">
          ตัวอย่าง: ทุเรียนที่นิยมปลูกด้วยระยะ 8×8 เมตร (ระยะระหว่างแถว 8 เมตร ระยะระหว่างต้น 8 เมตร)
          พื้นที่ต่อต้น = 8 × 8 = 64 ตารางเมตร เมื่อคิดพื้นที่ 1 ไร่ (1,600 ตารางเมตร) จะปลูกได้ประมาณ
          1,600 ÷ 64 = 25 ต้นต่อไร่ (ที่ 100% พื้นที่ใช้ได้)
        </p>
        <p className="mt-3 text-sm text-stone">
          ตัวเลขนี้เป็นตัวอย่างระยะปลูกที่พบได้ทั่วไปเท่านั้น ระยะปลูกที่เหมาะสมจริงขึ้นอยู่กับพันธุ์ทุเรียนและวิธีจัดการทรงพุ่ม
          ควรตรวจสอบคำแนะนำของกรมวิชาการเกษตรหรือสำนักงานเกษตรในพื้นที่ก่อนตัดสินใจ
        </p>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">วิธีใช้งาน</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[17px] text-ink/90">
          <li>กรอกพื้นที่ปลูกเป็นไร่ งาน และตารางวา</li>
          <li>กรอกระยะระหว่างแถวและระยะระหว่างต้น (หน่วยเมตร) ตามที่วางแผนไว้</li>
          <li>ปรับ % พื้นที่ใช้ปลูกได้จริง หากมีพื้นที่ที่ปลูกไม่ได้ เช่น ทางเดินหรือบ่อน้ำ</li>
          <li>กด &quot;คำนวณจำนวนต้น&quot; เพื่อดูจำนวนต้นโดยประมาณและต้นต่อไร่</li>
        </ol>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">ข้อจำกัดของเครื่องมือ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] text-ink/90">
          <li>เครื่องมือนี้ไม่มีระยะปลูกแนะนำเฉพาะพืชแต่ละชนิด เป็นเพียงการคำนวณทางเรขาคณิตจากตัวเลขที่คุณกรอกเอง</li>
          <li>ไม่ได้คำนึงถึงรูปทรงแปลงจริง แนวเขต หรือสิ่งกีดขวางที่อาจทำให้ปลูกได้ไม่เต็มตามที่คำนวณ</li>
          <li>ควรตรวจสอบระยะปลูกที่เหมาะสมกับพันธุ์พืชจากกรมวิชาการเกษตรหรือสำนักงานเกษตรในพื้นที่ก่อนวางแผนจริง</li>
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

      <AffiliateRecommendations tags={["เมล็ดพันธุ์", "กล้าไม้"]} heading="อุปกรณ์ที่เกี่ยวข้อง" />
    </ToolShell>
  );
}
