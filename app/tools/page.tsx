import { pageMeta } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { TOOLS } from "@/lib/data";

export const metadata = pageMeta({ title: "เครื่องมือช่วยเกษตรกร", description: "รวมเครื่องมือช่วยเกษตรกรไทย คำนวณต้นทุน วางแผนการทำเกษตร คำนวณราคาขายขั้นต่ำ สมุดบันทึกฟาร์ม ตรวจความพร้อม GAP ปฏิทินเพาะปลูก และเช็กโรคเบื้องต้น", path: "/tools" });

// จัดกลุ่มเครื่องมือให้หาเจอง่าย — เครื่องมือใหม่ที่ยังไม่ได้ใส่กลุ่มจะไปอยู่ "เครื่องมืออื่น ๆ" อัตโนมัติ
const TOOL_GROUPS: Array<{ title: string; desc: string; hrefs: string[] }> = [
  {
    title: "ต้นทุน กำไร และจุดคุ้มทุน",
    desc: "คิดเงินก่อนลงมือ — ต้นทุน รายได้ กำไร และราคาขายที่ไม่ขาดทุน",
    hrefs: [
      "/tools/plant-cost",
      "/tools/animal-cost",
      "/tools/farm-income-calculator",
      "/tools/farm-break-even-calculator",
      "/tools/minimum-selling-price",
      "/tools/crop-yield-calculator",
    ],
  },
  {
    title: "พื้นที่และการปลูก",
    desc: "แปลงหน่วยพื้นที่ ระยะปลูก จำนวนต้น และเมล็ดพันธุ์",
    hrefs: [
      "/tools/land-area-converter",
      "/tools/plant-spacing-calculator",
      "/tools/seed-rate-calculator",
      "/tools/calendar",
    ],
  },
  {
    title: "น้ำและปุ๋ย",
    desc: "ระบบน้ำ ปั๊ม โซลาร์ และการคำนวณปุ๋ย",
    hrefs: [
      "/tools/irrigation-calculator",
      "/tools/pump-size-calculator",
      "/tools/solar-pump-calculator",
      "/tools/fertilizer-calculator",
      "/tools/fertilizer-cost-comparison",
    ],
  },
  {
    title: "ปศุสัตว์และประมง",
    desc: "อาหารสัตว์ อัตราแลกเนื้อ และกำไรฟาร์มสัตว์",
    hrefs: [
      "/tools/fcr-calculator",
      "/tools/livestock-feed-cost-calculator",
      "/tools/egg-farm-profit-calculator",
      "/tools/disease-check",
    ],
  },
  {
    title: "อากาศเพื่อการเกษตร",
    desc: "วางแผนงานฟาร์มด้วยข้อมูลพยากรณ์จากกรมอุตุนิยมวิทยา",
    hrefs: [
      "/tools/rain-window-planner",
      "/tools/rainfall-forecast-calculator",
      "/tools/harvest-weather-planner",
    ],
  },
  {
    title: "วางแผนและจัดการฟาร์ม",
    desc: "เริ่มต้น วางแผน จดบันทึก และเตรียมมาตรฐาน",
    hrefs: [
      "/tools/farm-planner",
      "/tools/farm-record",
      "/tools/gap-readiness-check",
      "/tools/starter-kits",
    ],
  },
];

export default function ToolsIndexPage() {
  const grouped = new Set(TOOL_GROUPS.flatMap((g) => g.hrefs));
  const ungrouped = TOOLS.filter((t) => !grouped.has(t.href));

  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <span className="eyebrow">เครื่องมือ</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-ink">
              เครื่องมือช่วยเกษตรกร
            </h1>
            <p className="mt-3 max-w-2xl text-stone">
              ไม่ใช่แค่อ่าน แต่ช่วยคิดต้นทุนและวางแผนก่อนลงมือทำจริง — ฟรีทุกตัว
              ไม่ต้องสมัครสมาชิก
            </p>
          </div>
        </section>

        <section className="bg-paper py-20">
          <div className="container-x space-y-16">
            {TOOL_GROUPS.map((group) => {
              const tools = group.hrefs
                .map((href) => TOOLS.find((t) => t.href === href))
                .filter((t): t is (typeof TOOLS)[number] => Boolean(t));
              if (tools.length === 0) return null;
              return (
                <div key={group.title}>
                  <h2 className="font-display text-2xl font-bold text-ink">{group.title}</h2>
                  <p className="mt-2 text-sm text-stone">{group.desc}</p>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                      <ToolCard key={tool.title} tool={tool} />
                    ))}
                  </div>
                </div>
              );
            })}
            {ungrouped.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">เครื่องมืออื่น ๆ</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {ungrouped.map((tool) => (
                    <ToolCard key={tool.title} tool={tool} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
