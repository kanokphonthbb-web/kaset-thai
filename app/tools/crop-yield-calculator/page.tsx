import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import CropYieldCalculator from "@/components/tools/CropYieldCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "ประเมินผลผลิตพืช";
const DESCRIPTION =
  "เครื่องมือคำนวณผลผลิตพืชโดยประมาณ เลือกคำนวณจากจำนวนต้นที่ปลูกและอัตรารอด หรือจากพื้นที่เพาะปลูก พร้อมมูลค่าประมาณเมื่อกรอกราคาขาย";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/crop-yield-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้ประเมินผลผลิตอย่างไร",
    a: "คำนวณจากตัวเลขที่คุณกรอกเองสองแบบ คือจากจำนวนต้นที่ปลูกคูณอัตรารอดและผลผลิตต่อต้น หรือจากพื้นที่ปลูกคูณผลผลิตต่อไร่ที่คุณคาดการณ์ไว้",
  },
  {
    q: "ควรเลือกโหมด \"จากจำนวนต้น\" หรือ \"จากพื้นที่\"",
    a: "ถ้านับจำนวนต้นที่ปลูกได้ชัดเจน เช่น ไม้ผล ควรใช้โหมดจากจำนวนต้น ถ้าเป็นพืชไร่หรือนาที่นับต้นยาก เช่น ข้าว ควรใช้โหมดจากพื้นที่แทน",
  },
  {
    q: "อัตรารอดควรประมาณจากอะไร",
    a: "ควรอ้างอิงจากประสบการณ์ปลูกจริงในพื้นที่ของคุณ หรือค่าเฉลี่ยของพืชชนิดนั้นในสภาพแวดล้อมใกล้เคียง เครื่องมือนี้ไม่มีค่าอัตรารอดมาตรฐานให้ ต้องกรอกเอง",
  },
  {
    q: "มูลค่าประมาณที่แสดงแม่นยำแค่ไหน",
    a: "เป็นเพียงการคูณผลผลิตรวมกับราคาที่คุณกรอก ไม่ได้อ้างอิงราคาตลาดจริง ณ เวลาที่เก็บเกี่ยว จึงควรใช้ประกอบการวางแผนคร่าว ๆ เท่านั้น ไม่ใช่ตัวเลขรับประกันรายได้",
  },
  {
    q: "ทำไมผลผลิตจริงถึงอาจต่างจากตัวเลขที่คำนวณได้",
    a: "เพราะผลผลิตจริงขึ้นอยู่กับหลายปัจจัย เช่น สภาพอากาศ คุณภาพดิน โรคและแมลง การให้น้ำและปุ๋ย ซึ่งเครื่องมือนี้ไม่ได้นำมาคำนวณ เป็นเพียงการประมาณจากตัวเลขตั้งต้นที่คุณกรอกเท่านั้น",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/crop-yield-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🌾"
      title={TITLE}
      intro="เลือกคำนวณผลผลิตจากจำนวนต้นที่ปลูกและอัตรารอด หรือจากพื้นที่เพาะปลูก แล้วดูผลผลิตรวมและมูลค่าประมาณเพื่อใช้วางแผน"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CropYieldCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>โหมดจากจำนวนต้น: จำนวนต้นรอด = จำนวนต้น × อัตรารอด (%)</li>
              <li>โหมดจากจำนวนต้น: ผลผลิตรวม = จำนวนต้นรอด × ผลผลิตต่อต้น (กก.)</li>
              <li>โหมดจากพื้นที่: ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)</li>
              <li>มูลค่าประมาณ = ผลผลิตรวม × ราคาขายต่อ กก. (เมื่อกรอกราคา)</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง (จากจำนวนต้น):</strong> ปลูกมะม่วง 1,000 ต้น
            คาดว่าอัตรารอด 90% ได้ผลผลิตต้นละ 2 กก. และขายได้ 10 บาท/กก.
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>จำนวนต้นรอด</td>
                  <td>1,000 × 90% = 900 ต้น</td>
                </tr>
                <tr>
                  <td>ผลผลิตรวม</td>
                  <td>900 × 2 = 1,800 กก.</td>
                </tr>
                <tr>
                  <td>มูลค่าประมาณ</td>
                  <td>1,800 × 10 = 18,000 บาท</td>
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
            <li>เลือกโหมด &quot;จากจำนวนต้น&quot; หรือ &quot;จากพื้นที่&quot; ให้เหมาะกับพืชที่ปลูก</li>
            <li>กรอกจำนวนต้น อัตรารอด และผลผลิตต่อต้น (หรือพื้นที่และผลผลิตต่อไร่)</li>
            <li>กรอกราคาขายต่อกิโลกรัมถ้าต้องการดูมูลค่าประมาณ (ไม่บังคับ)</li>
            <li>กด &quot;ประเมินผลผลิต&quot; เพื่อดูผลลัพธ์</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เป็นการประมาณจากตัวเลขที่ผู้ใช้กรอกเท่านั้น ไม่ใช่การพยากรณ์ผลผลิตจริง
            ไม่ได้คำนวณผลกระทบจากสภาพอากาศ คุณภาพดิน โรคและแมลง หรือคุณภาพการดูแลรักษา
            ควรใช้ประกอบการวางแผนเบื้องต้นร่วมกับความรู้และประสบการณ์จริงในพื้นที่ของคุณ
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
            tool="crop-yield-calculator"
            links={[
              { href: "/tools/farm-income-calculator", label: "คำนวณรายได้-กำไรฟาร์ม" },
              { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืช" },
              { href: "/tools/farm-break-even-calculator", label: "คำนวณจุดคุ้มทุนฟาร์ม" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["เมล็ดพันธุ์", "ปุ๋ย", "ถุงเพาะชำ", "สปริงเกลอร์"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
