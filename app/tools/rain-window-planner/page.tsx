import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import { provincesByRegion, findProvinceBySlug } from "@/lib/weather/locations";
import { getProvinceHourly48 } from "@/lib/weather/weatherService";
import { findLowRainWindows } from "@/lib/weather/rules";
import { condInfo, type CondInfo } from "@/lib/weather/condCodes";

export const dynamic = "force-dynamic";

const TITLE = "ฝนจะตกกี่โมง? เช็กช่วงฝนน้อยสำหรับงานเกษตร";
const DESCRIPTION =
  "เครื่องมือหาช่วงฝนน้อยตามข้อมูลพยากรณ์ 48 ชม. ข้างหน้า รายจังหวัด ใช้วางแผนงานที่ต้องเลี่ยงฝน เช่น ตากผลผลิต ใส่ปุ๋ย และพ่นสาร ข้อมูลจากกรมอุตุนิยมวิทยา";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/rain-window-planner",
});

const FAQS: ToolFaq[] = [
  {
    q: "ช่วงฝนน้อยหมายความว่าอย่างไร",
    a: "หมายถึงช่วงเวลาต่อเนื่องที่ปริมาณฝนรายชั่วโมงตามพยากรณ์อยู่ในระดับต่ำมาก (ต่ำกว่าเกณฑ์ฝนเล็กน้อยของกรมอุตุนิยมวิทยา) เป็นข้อมูลพยากรณ์เท่านั้น ไม่ใช่การยืนยันว่าฝนจะไม่ตกแน่นอน",
  },
  {
    q: "เลือกจำนวนชั่วโมงต่อเนื่องอย่างไรดี",
    a: "เลือกให้ใกล้เคียงระยะเวลาที่ต้องใช้ทำงานจริง เช่น พ่นสาร 3 ชม. ตากผลผลิต 6-12 ชม. ยิ่งเลือกจำนวนชั่วโมงมาก ยิ่งหาช่วงที่ตรงเงื่อนไขได้ยากขึ้น",
  },
  {
    q: "ข้อมูลล่วงหน้าได้กี่ชั่วโมง",
    a: "เครื่องมือนี้ใช้พยากรณ์รายชั่วโมงสูงสุด 48 ชั่วโมงข้างหน้าจากกรมอุตุนิยมวิทยา",
  },
  {
    q: "ใช้เครื่องมือนี้วางแผนพ่นสารเคมีได้เลยหรือไม่",
    a: "เครื่องมือนี้ช่วยดูแนวโน้มฝนเบื้องต้นเท่านั้น การพ่นสารต้องตรวจฉลากและเงื่อนไขการใช้งานของสารนั้น ๆ เอง เช่น ช่วงเวลาที่ฉลากกำหนด ลม และอุณหภูมิ เครื่องมือนี้ไม่ได้ตัดสินใจแทน",
  },
  {
    q: "ทำไมบางครั้งไม่พบช่วงฝนน้อยเลย",
    a: "หากพยากรณ์ฝนตกต่อเนื่องหรือกระจายทั่วช่วง 48 ชม. ระบบจะไม่พบช่วงที่ต่อเนื่องครบตามจำนวนชั่วโมงที่เลือก ลองลดจำนวนชั่วโมงขั้นต่ำ หรือกลับมาเช็กใหม่เมื่อพยากรณ์อัปเดต",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/rain-window-planner",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

const timeFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
});
const dateShortFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
});
const dateTimeFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  dateStyle: "medium",
  timeStyle: "short",
});

const COND_EMOJI: Record<CondInfo["group"], string> = {
  clear: "☀️",
  cloudy: "⛅",
  rain: "🌧️",
  thunder: "⛈️",
  cold: "❄️",
  hot: "🔥",
  unknown: "🌡️",
};

const MIN_HOURS_OPTIONS = [3, 6, 12];

export default async function RainWindowPlannerPage({
  searchParams,
}: {
  searchParams: { province?: string; minHours?: string };
}) {
  const regions = provincesByRegion();
  const selectedSlug = searchParams.province ?? "";
  const province = selectedSlug ? findProvinceBySlug(selectedSlug) : null;
  const minHours = MIN_HOURS_OPTIONS.includes(Number(searchParams.minHours))
    ? Number(searchParams.minHours)
    : 6;

  const result = province ? await getProvinceHourly48(province.slug) : null;
  const series = result ? result.hourly.map((h) => ({ time: h.time, rainMm: h.rainMm ?? 0 })) : [];
  const windows = result ? findLowRainWindows(series, minHours) : [];

  return (
    <ToolShell
      icon="🌤️"
      title={TITLE}
      intro="เลือกจังหวัดและจำนวนชั่วโมงต่อเนื่องที่ต้องการ แล้วดูช่วงฝนน้อยตามข้อมูลพยากรณ์ 48 ชม. ข้างหน้า"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <form method="get" className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="province" className="text-sm font-semibold text-ink">
            จังหวัด
          </label>
          <select
            id="province"
            name="province"
            defaultValue={selectedSlug}
            className="input-admin mt-2"
          >
            <option value="">— เลือกจังหวัด —</option>
            {regions.map((r) => (
              <optgroup key={r.region} label={r.labelTh}>
                {r.provinces.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nameTh}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="minHours" className="text-sm font-semibold text-ink">
            ช่วงต่อเนื่องขั้นต่ำ
          </label>
          <select
            id="minHours"
            name="minHours"
            defaultValue={String(minHours)}
            className="input-admin mt-2"
          >
            {MIN_HOURS_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h} ชม.
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          ดูช่วงฝนน้อย
        </button>
      </form>

      {selectedSlug && !province && (
        <p className="mt-6 text-sm text-coral">ไม่พบจังหวัดที่เลือก กรุณาเลือกใหม่</p>
      )}

      {province && (
        <div className="mt-10">
          {!result ? (
            <div className="card">
              <p className="font-semibold text-ink">
                แหล่งข้อมูลพยากรณ์ยังไม่ตอบสนองในขณะนี้ กรุณาลองใหม่ภายหลัง
              </p>
              <a
                href="https://www.tmd.go.th"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4 inline-block"
              >
                ดูข้อมูลที่กรมอุตุนิยมวิทยา
              </a>
            </div>
          ) : (
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                  ช่วงฝนน้อยตามข้อมูลพยากรณ์ — {province.nameTh}
                </h2>
                {windows.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {windows.map((w, i) => (
                      <div key={i} className="card">
                        <p className="text-sm text-stone">{dateShortFmt.format(new Date(w.start))}</p>
                        <p className="mt-1 font-semibold text-ink">
                          ช่วงฝนน้อยตามข้อมูลพยากรณ์: {timeFmt.format(new Date(w.start))}–
                          {timeFmt.format(new Date(w.end))} ({w.hours} ชม.)
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-stone">
                    ไม่พบช่วงฝนน้อยต่อเนื่อง {minHours} ชม. ใน 48 ชม. ข้างหน้า ตามข้อมูลพยากรณ์
                  </p>
                )}
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                  พยากรณ์ฝนรายชั่วโมง (48 ชม.)
                </h2>
                <div className="mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none sm:mx-0 sm:px-0">
                  {result.hourly.map((h) => {
                    const cond = condInfo(h.cond);
                    return (
                      <div key={h.time} className="card w-28 shrink-0 text-center">
                        <p className="text-xs text-stone">{timeFmt.format(new Date(h.time))}</p>
                        <p className="mt-2 text-xl" aria-hidden>
                          {COND_EMOJI[cond.group]}
                        </p>
                        <p className="mt-1 text-xs text-stone">
                          ฝน {h.rainMm != null ? h.rainMm.toFixed(1) : "0"} มม.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border-l-4 border-lime-canopy bg-mist p-5 text-sm text-stone">
                <p>
                  แหล่งข้อมูล:{" "}
                  <a
                    href="https://www.tmd.go.th"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink underline decoration-dotted underline-offset-4"
                  >
                    กรมอุตุนิยมวิทยา
                  </a>
                </p>
                <p className="mt-1">ดึงข้อมูลล่าสุด: {dateTimeFmt.format(new Date(result.fetchedAt))} น.</p>
                <p className="mt-1">ระบบแคชข้อมูลประมาณ 1 ชั่วโมง</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="cc-tip mt-10">
        <p className="cc-tip-title">ใช้สำหรับวางแผนงาน ไม่ใช่คำสั่งพ่นสาร</p>
        <p className="mt-2 text-[15px] text-ink/90">
          ใช้สำหรับวางแผนงาน เช่น ตากผลผลิต ใส่ปุ๋ย พ่นสาร โดยต้องตรวจฉลาก/เงื่อนไขของงานนั้นเองก่อนเสมอ
          (สำหรับการพ่นสาร: ระบุช่วงที่ฉลากกำหนดเอง เครื่องมือไม่ตัดสินให้)
        </p>
      </div>

      <div className="mt-14 space-y-10">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">วิธีใช้เครื่องมือ</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เลือกจังหวัดที่ต้องการเช็กพยากรณ์</li>
            <li>เลือกจำนวนชั่วโมงต่อเนื่องขั้นต่ำที่ต้องการให้ฝนน้อย</li>
            <li>กด &ldquo;ดูช่วงฝนน้อย&rdquo; แล้วดูช่วงเวลาที่ระบบหาให้ พร้อมพยากรณ์รายชั่วโมงประกอบ</li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">ข้อจำกัด</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เป็นข้อมูลพยากรณ์ ไม่ใช่การยืนยันว่าฝนจะไม่ตกแน่นอน</li>
            <li>ครอบคลุมเฉพาะ 48 ชั่วโมงข้างหน้าเท่านั้น</li>
            <li>พิกัดอ้างอิงตัวเมือง/ศาลากลางจังหวัด สภาพอากาศจริงในพื้นที่ห่างไกลอาจต่างกันได้</li>
            <li>ไม่ใช่คำแนะนำการใช้สารเคมีทางการเกษตร ต้องตรวจฉลากสารเองเสมอ</li>
          </ul>
        </section>
        <section id="faq">
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">คำถามที่พบบ่อย</h2>
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
      </div>

      <div className="mt-10">
        <Link href="/weather" className="btn-secondary">
          ← ดูอากาศเกษตรรายจังหวัด
        </Link>
      </div>
    </ToolShell>
  );
}
