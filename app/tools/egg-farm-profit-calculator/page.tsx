import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import EggFarmProfitCalculator from "@/components/tools/EggFarmProfitCalculator";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";

const TITLE = "คำนวณกำไรฟาร์มไก่ไข่";
const DESCRIPTION =
  "เครื่องมือคำนวณกำไรฟาร์มไก่ไข่ ใส่จำนวนแม่ไก่ อัตราการให้ไข่ ราคาไข่ ปริมาณและราคาอาหาร แล้วดูจำนวนไข่ต่อวัน รายได้ ค่าอาหาร และกำไรต่อวัน-ต่อเดือนทันที";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/egg-farm-profit-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "อัตราการให้ไข่ควรใช้ตัวเลขเท่าไหร่",
    a: "อัตราการให้ไข่ต่างกันตามสายพันธุ์ไก่ อายุ และฤดูกาล ไม่มีตัวเลขตายตัวที่ใช้ได้กับทุกฟาร์ม แนะนำให้ใช้อัตราจริงที่นับได้จากฟาร์มของคุณในช่วง 1-2 สัปดาห์ล่าสุดแทนการเดาหรือใช้ค่าเฉลี่ยทั่วไป",
  },
  {
    q: "ค่าใช้จ่ายอื่น/วัน ควรรวมอะไรบ้าง",
    a: "ควรรวมค่าใช้จ่ายที่เกิดขึ้นประจำวันนอกเหนือจากค่าอาหาร เช่น ค่าไฟ ค่าแรงงาน ยา/วัคซีน วัสดุรองพื้น และค่าเสื่อมของโรงเรือน/อุปกรณ์เฉลี่ยต่อวัน ยิ่งกรอกครบยิ่งได้ตัวเลขกำไรที่ใกล้เคียงความจริง",
  },
  {
    q: "ทำไมกำไรที่คำนวณได้ต่างจากกำไรจริงของฟาร์ม",
    a: "เพราะอัตราการให้ไข่ ราคาไข่ และปริมาณอาหารในความเป็นจริงเปลี่ยนแปลงทุกวันตามสุขภาพไก่ อากาศ และราคาตลาด ตัวเลขที่ได้จากเครื่องมือนี้เป็นค่าประมาณ ณ วันที่คุณกรอกข้อมูลเท่านั้น",
  },
  {
    q: "กำไร/เดือน คำนวณจาก 30 วันเสมอหรือไม่",
    a: "ใช่ เครื่องมือนี้คำนวณกำไรต่อเดือนโดยใช้ 30 วันเป็นฐานคงที่ (กำไรต่อวัน × 30) เพื่อให้เปรียบเทียบได้ง่าย หากต้องการตัวเลขของเดือนที่มี 28, 29 หรือ 31 วัน ให้นำกำไรต่อวันไปคูณจำนวนวันจริงเอง",
  },
  {
    q: "ใช้กับไก่ไข่พันธุ์อื่นหรือระบบเลี้ยงแบบอื่นได้ไหม",
    a: "ใช้ได้กับไก่ไข่ทุกสายพันธุ์และทุกระบบเลี้ยง (กรงตับ ปล่อยพื้น เลี้ยงอินทรีย์) เพราะเครื่องมือคำนวณจากตัวเลขจริงที่คุณกรอกเอง ไม่ได้ผูกกับสายพันธุ์หรือระบบใดระบบหนึ่ง",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/egg-farm-profit-calculator",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

export default function Page() {
  return (
    <ToolShell
      icon="🥚"
      title={TITLE}
      intro="ใส่จำนวนแม่ไก่ อัตราการให้ไข่ ราคาไข่ และต้นทุนอาหาร แล้วดูจำนวนไข่ รายได้ ค่าอาหาร และกำไรต่อวัน-ต่อเดือนทันที ช่วยวางแผนก่อนตัดสินใจขยายฟาร์ม"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EggFarmProfitCalculator />

      <div className="mx-auto mt-16 max-w-3xl">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            สูตรการคำนวณ
          </h2>
          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone">
              <li>ไข่/วัน = จำนวนแม่ไก่ × อัตราการให้ไข่ (%)</li>
              <li>รายได้/วัน = ไข่/วัน × ราคาไข่ต่อฟอง</li>
              <li>ค่าอาหาร/วัน = จำนวนแม่ไก่ × อาหารต่อตัวต่อวัน (กก.) × ราคาอาหารต่อกก.</li>
              <li>กำไร/วัน = รายได้/วัน − ค่าอาหาร/วัน − ค่าใช้จ่ายอื่น/วัน</li>
              <li>กำไร/เดือน (30 วัน) = กำไร/วัน × 30</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ตัวอย่างการคำนวณ
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
            <strong>ตัวอย่าง:</strong> เลี้ยงแม่ไก่ 100 ตัว อัตราการให้ไข่ 80% ขายไข่ฟองละ 3.5 บาท
            ให้อาหาร 0.12 กก./ตัว/วัน ราคาอาหาร 14 บาท/กก. และมีค่าใช้จ่ายอื่น 50 บาท/วัน
          </p>
          <div className="cc-table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>ไข่/วัน</td>
                  <td>100 × 80% = 80 ฟอง</td>
                </tr>
                <tr>
                  <td>รายได้/วัน</td>
                  <td>80 × 3.5 = 280 บาท</td>
                </tr>
                <tr>
                  <td>ค่าอาหาร/วัน</td>
                  <td>100 × 0.12 × 14 = 168 บาท</td>
                </tr>
                <tr>
                  <td>กำไร/วัน</td>
                  <td>280 − 168 − 50 = 62 บาท</td>
                </tr>
                <tr>
                  <td>กำไร/เดือน</td>
                  <td>62 × 30 = 1,860 บาท</td>
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
            <li>กรอกจำนวนแม่ไก่ในฟาร์ม</li>
            <li>กรอกอัตราการให้ไข่ (%) จากข้อมูลจริงของฟาร์มคุณ</li>
            <li>กรอกราคาขายไข่ต่อฟอง</li>
            <li>กรอกปริมาณและราคาอาหารต่อตัวต่อวัน</li>
            <li>กรอกค่าใช้จ่ายอื่นต่อวัน (ค่าไฟ ค่าแรง ยา/วัคซีน ฯลฯ)</li>
            <li>กด &quot;คำนวณกำไรฟาร์มไก่ไข่&quot; เพื่อดูผลลัพธ์</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">
            ข้อจำกัดของเครื่องมือ
          </h2>
          <p className="mt-3 text-[15px] text-ink/90">
            อัตราการให้ไข่และปริมาณอาหารต่างกันตามสายพันธุ์ อายุ และฤดูกาล ผลลัพธ์เป็นการประมาณการจากตัวเลขที่คุณป้อนเท่านั้น
            ไม่ได้รวมค่าใช้จ่ายลงทุนเริ่มต้น (โรงเรือน อุปกรณ์) และไม่ได้รับประกันกำไรจริง ควรใช้ตัวเลขจริงของฟาร์มคุณและปรับปรุงเป็นระยะ
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
            tool="egg-farm-profit-calculator"
            links={[
              { href: "/tools/livestock-feed-cost-calculator", label: "คำนวณค่าอาหารสัตว์" },
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
