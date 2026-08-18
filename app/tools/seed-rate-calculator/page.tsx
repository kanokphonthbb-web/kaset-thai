import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import SeedRateCalculator from "@/components/tools/SeedRateCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณเมล็ดพันธุ์ต่อไร่";
const DESCRIPTION =
  "เครื่องมือคำนวณเมล็ดพันธุ์ ใส่พื้นที่ปลูกและอัตราเมล็ดพันธุ์ต่อไร่ที่แนะนำ แล้วดูปริมาณเมล็ดที่ต้องใช้ ต้นทุนรวม และต้นทุนต่อไร่ทันที";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/seed-rate-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "อัตราเมล็ดพันธุ์ต่อไร่ควรใช้ตัวเลขจากไหน",
    a: "ควรใช้อัตราที่แนะนำจากกรมการข้าว กรมวิชาการเกษตร หรือฉลากบรรจุภัณฑ์เมล็ดพันธุ์ที่ซื้อ เพราะอัตราที่เหมาะสมต่างกันตามชนิดพืช สายพันธุ์ และวิธีปลูก เครื่องมือนี้ไม่ได้กำหนดอัตราให้",
  },
  {
    q: "ทำไมเครื่องมือนี้ไม่มีให้เลือกชนิดพืช",
    a: "เพราะอัตราเมล็ดพันธุ์ที่แม่นยำต้องอิงคำแนะนำทางการหรือฉลากของเมล็ดพันธุ์แต่ละล็อต ซึ่งเปลี่ยนตามพันธุ์และวิธีปลูก (หว่าน/หยอด/ดำ) เครื่องมือนี้จึงให้คุณกรอกอัตราเองเพื่อความแม่นยำ แล้วคำนวณปริมาณและต้นทุนให้",
  },
  {
    q: "ถ้าไม่กรอกราคาเมล็ดพันธุ์จะเป็นอย่างไร",
    a: "ระบบจะคำนวณเฉพาะปริมาณเมล็ดที่ต้องใช้ (กก.) ให้ ส่วนต้นทุนรวมและต้นทุนต่อไร่จะแสดงเป็น \"-\" เนื่องจากไม่มีราคาให้คำนวณ",
  },
  {
    q: "ปลูกหลายแปลงที่มีอัตราเมล็ดต่างกันคำนวณอย่างไร",
    a: "คำนวณแยกทีละแปลงโดยกรอกพื้นที่และอัตราเมล็ดพันธุ์ของแต่ละแปลง แล้วนำผลรวมของแต่ละแปลงมาบวกกันเอง เนื่องจากเครื่องมือนี้คำนวณครั้งละ 1 ชุดข้อมูล",
  },
  {
    q: "ตัวเลขที่ได้แม่นยำแค่ไหน",
    a: "เป็นการคูณเลขตรงไปตรงมาจากตัวเลขที่คุณป้อน ความแม่นยำจึงขึ้นกับอัตราเมล็ดพันธุ์และราคาที่กรอก ไม่ได้รวมเมล็ดสำรองสำหรับปลูกซ่อมหรือความสูญเสียระหว่างปลูก",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/seed-rate-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🌾"
      title={TITLE}
      intro="ใส่พื้นที่ปลูกและอัตราเมล็ดพันธุ์ต่อไร่ที่แนะนำ แล้วดูปริมาณเมล็ดที่ต้องใช้ ต้นทุนรวม และต้นทุนต่อไร่ ช่วยวางแผนสั่งซื้อเมล็ดพันธุ์ให้พอดี"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeedRateCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>เมล็ดที่ต้องใช้ (กก.) = พื้นที่ (ไร่) × อัตราเมล็ดพันธุ์ต่อไร่ (กก./ไร่)</li>
              <li>ต้นทุนรวม = เมล็ดที่ต้องใช้ (กก.) × ราคาเมล็ดพันธุ์ (บาท/กก.)</li>
              <li>ต้นทุนต่อไร่ = ต้นทุนรวม ÷ พื้นที่ (ไร่)</li>
            </ul>
          </div>
          <p className="mt-4 text-[15px] text-ink/90">
            อัตราเมล็ดพันธุ์ที่เหมาะสมต่างกันตามชนิดพืช สายพันธุ์ และวิธีปลูก (หว่าน หยอด หรือดำ)
            เครื่องมือนี้จึงไม่มีอัตราสำเร็จรูปหรือค่าเริ่มต้นตามชนิดพืชให้ ให้ยึดคำแนะนำของกรมการข้าว
            กรมวิชาการเกษตร หรือฉลากเมล็ดพันธุ์ที่ใช้เป็นหลักเสมอ
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> ปลูกพื้นที่ 5 ไร่ ใช้อัตราเมล็ดพันธุ์ตามคำแนะนำ 15 กก./ไร่
            ราคาเมล็ดพันธุ์ 25 บาท/กก.
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>เมล็ดที่ต้องใช้</td>
                  <td>5 × 15 = 75 กก.</td>
                </tr>
                <tr>
                  <td>ต้นทุนรวม</td>
                  <td>75 × 25 = 1,875 บาท</td>
                </tr>
                <tr>
                  <td>ต้นทุนต่อไร่</td>
                  <td>1,875 ÷ 5 = 375 บาท/ไร่</td>
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
            <li>กรอกพื้นที่ปลูก (ไร่)</li>
            <li>กรอกอัตราเมล็ดพันธุ์ต่อไร่ตามคำแนะนำทางการหรือฉลากเมล็ดพันธุ์ (กก./ไร่)</li>
            <li>กรอกราคาเมล็ดพันธุ์ต่อกิโลกรัม (ถ้าต้องการดูต้นทุน — เว้นว่างได้)</li>
            <li>กด &quot;คำนวณเมล็ดพันธุ์&quot; เพื่อดูปริมาณเมล็ดและต้นทุน</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            เครื่องมือนี้คำนวณตามอัตราเมล็ดพันธุ์ที่คุณกรอกเองเท่านั้น ไม่ได้แนะนำอัตราที่เหมาะสมสำหรับพืชแต่ละชนิด
            ไม่ได้รวมเมล็ดสำรองสำหรับปลูกซ่อม ความสูญเสียระหว่างเก็บรักษาหรือหว่าน และไม่ได้รับประกันอัตราการงอกหรือผลผลิต
            ควรยึดคำแนะนำของกรมการข้าว กรมวิชาการเกษตร หรือฉลากเมล็ดพันธุ์เป็นหลักเสมอ
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
            tool="seed-rate-calculator"
            links={[
              { href: "/tools/plant-spacing-calculator", label: "คำนวณจำนวนต้นที่ปลูกได้" },
              { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืช" },
              { href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยต่อไร่" },
            ]}
          />
        </section>
      </div>

      <AffiliateRecommendations
        tags={["เมล็ดพันธุ์"]}
        heading="อุปกรณ์ที่เกี่ยวข้อง"
      />
    </ToolShell>
  );
}
