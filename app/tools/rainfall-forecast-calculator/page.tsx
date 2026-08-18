import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd, type ToolFaq } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import { provincesByRegion, findProvinceBySlug } from "@/lib/weather/locations";
import { getProvinceWeather } from "@/lib/weather/weatherService";
import { condInfo } from "@/lib/weather/condCodes";

export const dynamic = "force-dynamic";

const TITLE = "ฝนสะสมตามพยากรณ์ 24-72 ชม. และรายวัน 7 วัน";
const DESCRIPTION =
  "เครื่องมือคำนวณฝนสะสมตามพยากรณ์ 24 / 48 / 72 ชั่วโมง และฝนรายวัน 7 วันข้างหน้า รายจังหวัด ข้อมูลจากกรมอุตุนิยมวิทยา ใช้วางแผนระบายน้ำ งานแปลง และเก็บเกี่ยว";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/rainfall-forecast-calculator",
});

const FAQS: ToolFaq[] = [
  {
    q: "ฝนสะสม 72 ชม. ทำไมถึงเป็น \"ค่าประมาณ\"",
    a: "พยากรณ์รายชั่วโมงของกรมอุตุนิยมวิทยาให้ข้อมูลสูงสุด 48 ชั่วโมง ชั่วโมงที่ 49-72 จึงเสริมด้วยฝนรายวันของวันที่ 3 แทน ตัวเลขจึงเป็นค่าประมาณ ไม่ใช่ผลรวมรายชั่วโมงจริงทั้งหมด",
  },
  {
    q: "ตัวเลขฝนสะสมมาจากไหน",
    a: "รวมจากพยากรณ์ฝนรายชั่วโมงของกรมอุตุนิยมวิทยา (24 และ 48 ชม.) ส่วนฝนรายวัน 7 วัน มาจากพยากรณ์รายวันของกรมอุตุนิยมวิทยาโดยตรง",
  },
  {
    q: "ใช้ข้อมูลนี้วางแผนระบายน้ำแปลงได้อย่างไร",
    a: "ดูฝนสะสมที่คาดการณ์ในช่วง 24-72 ชม. ข้างหน้าประกอบกับสภาพการระบายน้ำของแปลงจริง หากฝนสะสมสูงควรตรวจทางระบายน้ำล่วงหน้า",
  },
  {
    q: "ยอดรวมฝนสะสม 7 วันคำนวณอย่างไร",
    a: "เป็นผลรวมของค่าฝนรายวันตามพยากรณ์ทั้ง 7 วัน (ตามพยากรณ์รายวัน) ไม่ใช่ค่าที่วัดได้จริง และอาจเปลี่ยนแปลงเมื่อพยากรณ์อัปเดต",
  },
];

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/rainfall-forecast-calculator",
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

export default async function RainfallForecastCalculatorPage({
  searchParams,
}: {
  searchParams: { province?: string };
}) {
  const regions = provincesByRegion();
  const selectedSlug = searchParams.province ?? "";
  const province = selectedSlug ? findProvinceBySlug(selectedSlug) : null;

  const view = province ? await getProvinceWeather(province.slug) : null;
  const total7d = view ? view.daily.reduce((s, d) => s + (d.rainMm ?? 0), 0) : 0;

  return (
    <ToolShell
      icon="🌧️"
      title={TITLE}
      intro="เลือกจังหวัด แล้วดูฝนสะสมตามพยากรณ์ 24 / 48 / 72 ชม. และฝนรายวัน 7 วันข้างหน้า"
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
          ดูฝนสะสมตามพยากรณ์
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
                  ฝนสะสมตามพยากรณ์ — {province.nameTh}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="card">
                    <p className="text-xs text-stone">24 ชม.</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{view.rain24hMm.toFixed(1)} มม.</p>
                  </div>
                  <div className="card">
                    <p className="text-xs text-stone">48 ชม.</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{view.rain48hMm.toFixed(1)} มม.</p>
                  </div>
                  <div className="card">
                    <p className="text-xs text-stone">72 ชม. (ค่าประมาณ)</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{view.rain72hMm.toFixed(1)} มม.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                  ฝนรายวัน (ประมาณ 7 วันข้างหน้า)
                </h2>
                <div className="cc-table-wrap mt-4">
                  <table>
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>สภาพอากาศ</th>
                        <th>ฝน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.daily.map((d) => {
                        const cond = condInfo(d.cond);
                        return (
                          <tr key={d.time}>
                            <td className="font-medium text-ink">
                              {weekdayFmt.format(new Date(d.time))} {dateShortFmt.format(new Date(d.time))}
                            </td>
                            <td>{cond.labelTh}</td>
                            <td>{d.rainMm != null ? `${d.rainMm.toFixed(1)} มม.` : "–"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-ink/90">
                  รวมฝนสะสม 7 วัน (ตามพยากรณ์รายวัน):{" "}
                  <span className="font-semibold text-ink">{total7d.toFixed(1)} มม.</span>
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
        <p className="cc-tip-title">ใช้ประกอบการวางแผนงานแปลง</p>
        <p className="mt-2 text-[15px] text-ink/90">
          ใช้ตัวเลขฝนสะสมตามพยากรณ์นี้ประกอบการวางแผนระบายน้ำ งานแปลง และการเก็บเกี่ยว
          ควรตรวจสภาพหน้างานจริงประกอบด้วยเสมอ
        </p>
      </div>

      <div className="mt-14 space-y-10">
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">วิธีใช้เครื่องมือ</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เลือกจังหวัดที่ต้องการดูฝนสะสม</li>
            <li>กด &ldquo;ดูฝนสะสมตามพยากรณ์&rdquo;</li>
            <li>ดูฝนสะสม 24/48/72 ชม. และฝนรายวัน 7 วันข้างหน้าประกอบการวางแผน</li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold leading-snug text-ink">ข้อจำกัด</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-ink/90">
            <li>เป็นข้อมูลพยากรณ์ ไม่ใช่ปริมาณฝนที่วัดได้จริง</li>
            <li>ค่าฝน 72 ชม. เป็นค่าประมาณ (เสริมจากฝนรายวัน ไม่ใช่ผลรวมรายชั่วโมงล้วน)</li>
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
