const TOC = [
  "เริ่มต้นเลี้ยงกี่ตัวดี",
  "เตรียมโรงเรือน",
  "อาหารและการให้น้ำ",
  "โรคที่ต้องระวัง",
  "ต้นทุนและการขาย",
];

const COST_ROWS = [
  ["จำนวนเริ่มต้น", "10–30 ตัว", "เหมาะกับมือใหม่"],
  ["พื้นที่", "ขึ้นกับระบบเลี้ยง", "ควรโปร่งและระบายอากาศดี"],
  ["รายได้", "ขึ้นกับจำนวนไข่และราคาขาย", "ควรคำนวณต้นทุนอาหารเสมอ"],
];

export default function ArticleTemplatePreview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-mist">
      {/* Browser-like top bar */}
      <div className="flex items-center gap-2 border-b border-linen px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-lime-canopy" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-ash" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-ash" aria-hidden />
        <span className="ml-2 text-xs text-stone">
          ตัวอย่างหน้าบทความ · เกษตรกรไทย
        </span>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">สารบัญบทความ</p>
          <nav className="mt-3 space-y-1" aria-label="สารบัญตัวอย่าง">
            {TOC.map((item, i) => (
              <span
                key={item}
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-stone"
              >
                <span className="font-semibold text-ink">{i + 1}.</span>
                {item}
              </span>
            ))}
          </nav>
        </aside>

        {/* Content card */}
        <article className="min-w-0 rounded-2xl bg-paper p-6 sm:p-7">
          <span className="tag-chip text-xs">เลี้ยงสัตว์</span>
          <h3 className="mt-3 font-display text-2xl font-bold text-ink">
            เลี้ยงไก่ไข่สำหรับมือใหม่ เริ่มอย่างไรให้คุ้มทุน
          </h3>
          <p className="mt-3 text-ink/90">
            ถ้ามีพื้นที่เล็ก สามารถเริ่มเลี้ยงไก่ไข่ 10–30 ตัว
            เพื่อใช้บริโภคในครัวเรือนหรือขายในชุมชนได้ จุดสำคัญคือโรงเรือนต้องโปร่ง
            อาหารต้องเหมาะสม และต้องดูแลความสะอาดสม่ำเสมอ
          </p>

          <h4 className="mt-6 font-display text-lg font-bold text-ink">
            ตารางสรุปเบื้องต้น
          </h4>
          <div className="mt-3 -mx-1 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-linen text-ink">
                  <th className="rounded-l-lg px-4 py-3 font-semibold">รายการ</th>
                  <th className="px-4 py-3 font-semibold">ตัวอย่างข้อมูล</th>
                  <th className="rounded-r-lg px-4 py-3 font-semibold">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {COST_ROWS.map((row) => (
                  <tr key={row[0]} className="border-b border-linen">
                    <td className="px-4 py-3 font-medium text-ink">{row[0]}</td>
                    <td className="px-4 py-3 text-ink/90">{row[1]}</td>
                    <td className="px-4 py-3 text-stone">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-2xl border-l-4 border-lime-canopy bg-mist p-5">
            <p className="font-display font-bold text-ink">💡 คำแนะนำสำหรับมือใหม่</p>
            <p className="mt-2 text-[15px] text-ink/90">
              เริ่มจากจำนวนน้อยก่อนเพื่อเรียนรู้การจัดการ เมื่อคุมต้นทุนอาหารและ
              สุขภาพไก่ได้แล้วค่อยขยายจำนวน จะช่วยลดความเสี่ยงและเห็นกำไรชัดขึ้น
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
