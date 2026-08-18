import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import { provincesByRegion, findProvinceBySlug } from "@/lib/weather/locations";
import { getProvinceWeather } from "@/lib/weather/weatherService";
import { condInfo } from "@/lib/weather/condCodes";
import type { DailyPoint } from "@/lib/weather/tmdClient";

export const dynamic = "force-dynamic";

const TITLE = "สภาพอากาศช่วงเก็บเกี่ยว 7 วันข้างหน้า";
const DESCRIPTION =
  "ดูพยากรณ์อากาศ 7 วันข้างหน้ารายจังหวัด ประกอบการวางแผนเก็บเกี่ยว แยกระดับฝนตามเกณฑ์ของกรมอุตุนิยมวิทยา ข้อมูลพยากรณ์เท่านั้น ไม่ใช่คำแนะนำวันเก็บเกี่ยว";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/harvest-weather-planner",
});

const FAQS: ToolFaq[] = [
  {
    q: "เครื่องมือนี้บอกวันที่เหมาะเก็บเกี่ยวหรือไม่",
    a: "ไม่ เครื่องมือนี้แสดงเฉพาะพยากรณ์อากาศ 7 วันข้างหน้าและระดับฝนตามเกณฑ์ของกรมอุตุนิยมวิทยาเท่านั้น การตัดสินใจเก็บเกี่ยวขึ้นกับชนิดพืชและสภาพแปลง ใช้ข้อมูลนี้ประกอบการวางแผนเท่านั้น",
  },
  {
    q: "ระดับฝนในแต่ละวันคำนวณจากอะไร",
    a: "ใช้เกณฑ์ปริมาณฝนสะสมรายวันของกรมอุตุนิยมวิทยา: ฝนน้อย (ไม่เกิน 10 มม.) ฝนปานกลาง (10.1-35 มม.) และฝนหนัก (มากกว่า 35 มม.)",
  },
  {
    q: "ควรเก็บเกี่ยวช่วงฝนน้อยเสมอหรือไม่",
    a: "ไม่จำเป็นเสมอไป ขึ้นกับชนิดพืชและวิธีเก็บเกี่ยว บางพืชได้รับผลกระทบจากความชื้นมากกว่าฝน ควรพิจารณาสภาพแปลงจริงและความรู้เฉพาะพืชประกอบ",
  },
  {
    q: "พยากรณ์ 7 วันแม่นยำแค่ไหน",
    a: "ความแม่นยำจะลดลงเมื่อวันพยากรณ์ยิ่งไกลออกไป ควรตรวจสอบพยากรณ์อีกครั้งใกล้วันที่วางแผนจริง",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/harvest-weather-planner",
  breadcrumbLabel: TITLE,
  faqs: FAQS,
});

const weekdayFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
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

// เกณฑ์ปริมาณฝนสะสมรายวัน กรมอุตุนิยมวิทยา (tmd.go.th) — จัดกลุ่มเป็นภาษากลาง ไม่ตัดสินใจแทนเกษตรกร
function rainNote(rainMm: number | null): string {
  if (rainMm == null) return "ไม่ระบุปริมาณฝน";
  if (rainMm > 35) return "ฝนหนักตามพยากรณ์";
  if (rainMm > 10) return "ฝนปานกลางตามพยากรณ์";
  return "ฝนน้อยตามพยากรณ์";
}

export default async function HarvestWeatherPlannerPage({
  searchParams,
}: {
  searchParams: { province?: string };
}) {
  const regions = provincesByRegion();
  const selectedSlug = searchParams.province ?? "";
  const province = selectedSlug ? findProvinceBySlug(selectedSlug) : null;

  const view = province ? await getProvinceWeather(province.slug) : null;

  return (
    <ToolShell
      icon="🌾"
      title={TITLE}
      intro="เลือกจังหวัด แล้วดูพยากรณ์อากาศ 7 วันข้างหน้าประกอบการวางแผนเก็บเกี่ยว"
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
        <button type="submit" className="btn-primary">
          ดูพยากรณ์ 7 วัน
        </button>
      </form>

      {selectedSlug && !province && (
        <p className="mt-6 text-sm text-coral">ไม่พบจังหวัดที่เลือก กรุณาเลือกใหม่</p>
      )}

      {province && (
        <div className="mt-10">
          {!view ? (
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
                  พยากรณ์ 7 วันข้างหน้า — {province.nameTh}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {view.daily.map((d: DailyPoint) => {
                    const cond = condInfo(d.cond);
                    return (
                      <div key={d.time} className="card">
                        <p className="text-sm text-stone">
                          {weekdayFmt.format(new Date(d.time))} {dateShortFmt.format(new Date(d.time))}
                        </p>
                        <p className="mt-1 font-semibold text-ink">{cond.labelTh}</p>
                        <p className="mt-2 text-sm text-ink/90">
                          {d.tempMinC != null ? d.tempMinC.toFixed(0) : "–"}–
                          {d.tempMaxC != null ? d.tempMaxC.toFixed(0) : "–"}°C ·{" "}
                          {d.rainMm != null ? `${d.rainMm.toFixed(1)} มม.` : "–"} ·{" "}
                          {d.humidityPct != null ? `${Math.round(d.humidityPct)}%` : "–"}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-stone">{rainNote(d.rainMm)}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-stone">
                  ระดับฝนอ้างอิงเกณฑ์ปริมาณฝนสะสมรายวัน กรมอุตุนิยมวิทยา (tmd.go.th)
                </p>
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
                <p className="mt-1">ดึงข้อมูลล่าสุด: {dateTimeFmt.format(new Date(view.fetchedAt))} น.</p>
                <p className="mt-1">ระบบแคชข้อมูลประมาณ 1 ชั่วโมง</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="cc-tip mt-10">
        <p className="cc-tip-title">ข้อมูลนี้ไม่ตัดสินวันเก็บเกี่ยว</p>
        <p className="mt-2 text-[15px] text-ink/90">
          การตัดสินใจเก็บเกี่ยวขึ้นกับชนิดพืชและสภาพแปลง ใช้ข้อมูลนี้ประกอบการวางแผนเท่านั้น
        </p>
      </div>

      <div className="mt-14 space-y-10">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">วิธีใช้เครื่องมือ</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เลือกจังหวัดที่ต้องการวางแผนเก็บเกี่ยว</li>
            <li>กด &ldquo;ดูพยากรณ์ 7 วัน&rdquo;</li>
            <li>ดูอุณหภูมิ ฝน ความชื้น และระดับฝนของแต่ละวันประกอบการวางแผน</li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">ข้อจำกัด</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เป็นข้อมูลพยากรณ์ ไม่ใช่คำแนะนำวันเก็บเกี่ยว และไม่ใช่คำวินิจฉัยทางวิชาการเกษตร</li>
            <li>ยิ่งวันไกลจากวันนี้ ความแม่นยำของพยากรณ์ยิ่งลดลง</li>
            <li>พิกัดอ้างอิงตัวเมือง/ศาลากลางจังหวัด พื้นที่ห่างไกลอาจคลาดเคลื่อนได้</li>
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
