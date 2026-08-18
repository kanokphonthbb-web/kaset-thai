import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WeatherViewPing from "@/components/WeatherViewPing";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { findProvinceBySlug } from "@/lib/weather/locations";
import { getProvinceWeather } from "@/lib/weather/weatherService";
import { condInfo, type CondInfo } from "@/lib/weather/condCodes";

type Params = { params: { province: string } };

// ISR: render on demand, cache ~1 ชม. ตามรอบแคชของ TMD adapter
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

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
const weekdayFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
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

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const province = findProvinceBySlug(params.province);
  if (!province) notFound();
  const title = `อากาศ${province.nameTh}วันนี้ พยากรณ์ฝนเพื่อวางแผนการเกษตร`;
  const description = `พยากรณ์อากาศจังหวัด${province.nameTh}จากกรมอุตุนิยมวิทยา เช็กฝน อุณหภูมิ ลม ความชื้น ช่วงฝนน้อยตามข้อมูลพยากรณ์ และตัวชี้วัดสำหรับวางแผนงานฟาร์ม`;
  return pageMeta({ title, description, path: `/weather/${province.slug}` });
}

export default async function ProvinceWeatherPage({ params }: Params) {
  const province = findProvinceBySlug(params.province);
  if (!province) notFound();

  const view = await getProvinceWeather(province.slug);

  const url = `${SITE_URL}/weather/${province.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `อากาศ${province.nameTh}วันนี้ พยากรณ์ฝนเพื่อวางแผนการเกษตร`,
        inLanguage: "th-TH",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "อากาศเกษตร", item: `${SITE_URL}/weather` },
          { "@type": "ListItem", position: 3, name: province.nameTh, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WeatherViewPing province={province.slug} />
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-14">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href="/weather" className="hover:text-ink">
                อากาศเกษตร
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="font-medium text-ink">{province.nameTh}</span>
            </nav>

            <h1 className="mt-4 font-display text-4xl font-bold leading-snug text-ink">
              พยากรณ์อากาศเพื่อการเกษตร จังหวัด{province.nameTh}
            </h1>
            <p className="mt-3 max-w-2xl text-stone">
              ข้อมูลพยากรณ์จากกรมอุตุนิยมวิทยา ใช้วางแผนรดน้ำ ใส่ปุ๋ย พ่นสาร และเก็บเกี่ยว
            </p>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">
            {!view ? (
              <div className="card">
                <p className="font-semibold text-ink">
                  แหล่งข้อมูลพยากรณ์ยังไม่ตอบสนองในขณะนี้ กรุณาลองใหม่ภายหลัง
                </p>
                <p className="mt-2 text-sm text-stone">
                  ไม่สามารถดึงพยากรณ์อากาศจังหวัด{province.nameTh}ได้ในขณะนี้
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://www.tmd.go.th"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    ดูข้อมูลที่กรมอุตุนิยมวิทยา
                  </a>
                  <Link href="/weather" className="btn-secondary">
                    ← เลือกจังหวัดอื่น
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {/* ตอนนี้ */}
                <div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                    ตอนนี้ / ชั่วโมงล่าสุดตามพยากรณ์
                  </h2>
                  {view.now ? (
                    <div className="card mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <div>
                        <p className="text-xs text-stone">อุณหภูมิ</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                          {view.now.tempC != null ? `${view.now.tempC.toFixed(1)}°C` : "ไม่ระบุ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone">สภาพอากาศ</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                          {COND_EMOJI[condInfo(view.now.cond).group]} {condInfo(view.now.cond).labelTh}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone">ความชื้น</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                          {view.now.humidityPct != null ? `${Math.round(view.now.humidityPct)}%` : "ไม่ระบุ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone">ฝน</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                          {view.now.rainMm != null ? `${view.now.rainMm.toFixed(1)} มม.` : "ไม่ระบุ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone">ลม</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                          {view.now.windSpeedMs != null ? `${view.now.windSpeedMs.toFixed(1)} ม./วินาที` : "ไม่ระบุ"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="card mt-4 text-sm text-stone">ยังไม่มีข้อมูลชั่วโมงปัจจุบัน</p>
                  )}
                </div>

                {/* ตัวชี้วัด */}
                {view.indicators.length > 0 && (
                  <div>
                    <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                      ตัวชี้วัดสภาพอากาศสำหรับงานฟาร์ม
                    </h2>
                    <p className="mt-2 text-sm text-stone">
                      ตัวชี้วัดสภาพอากาศโดยเกษตรกรไทย (ไม่ใช่ประกาศเตือนภัยของกรมอุตุนิยมวิทยา)
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {view.indicators.map((ind) => (
                        <div
                          key={ind.id}
                          className={`card border-l-4 ${
                            ind.severity === "caution" ? "border-coral" : "border-gold"
                          }`}
                        >
                          <p className="font-semibold text-ink">{ind.labelTh}</p>
                          <p className="mt-1 text-sm text-ink/90">{ind.messageTh}</p>
                          <p className="mt-2 text-xs text-stone">แหล่งเกณฑ์: {ind.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ฝนสะสม */}
                <div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                    ฝนสะสมตามพยากรณ์
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

                {/* ช่วงฝนน้อย */}
                <div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                    ช่วงฝนน้อยตามข้อมูลพยากรณ์
                  </h2>
                  {view.lowRainWindows6h.length > 0 ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {view.lowRainWindows6h.slice(0, 3).map((w, i) => (
                        <div key={i} className="card">
                          <p className="text-sm text-stone">{dateShortFmt.format(new Date(w.start))}</p>
                          <p className="mt-1 font-semibold text-ink">
                            {timeFmt.format(new Date(w.start))}–{timeFmt.format(new Date(w.end))}
                          </p>
                          <p className="mt-1 text-xs text-stone">ต่อเนื่อง {w.hours} ชม.</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-stone">
                      ไม่พบช่วงฝนน้อยต่อเนื่อง 6 ชม. ใน 48 ชม. ข้างหน้า ตามข้อมูลพยากรณ์
                    </p>
                  )}
                  <Link
                    href={`/tools/rain-window-planner?province=${province.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-ink underline decoration-dotted underline-offset-4 hover:text-stone"
                  >
                    ปรับช่วงชั่วโมงต่อเนื่องเองด้วยเครื่องมือหาช่วงฝนน้อย →
                  </Link>
                </div>

                {/* 24-hour timeline */}
                <div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                    พยากรณ์รายชั่วโมง (24 ชม. ข้างหน้า)
                  </h2>
                  <div className="mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none sm:mx-0 sm:px-0">
                    {view.hourly.map((h) => {
                      const cond = condInfo(h.cond);
                      return (
                        <div key={h.time} className="card w-32 shrink-0 text-center">
                          <p className="text-xs text-stone">{timeFmt.format(new Date(h.time))}</p>
                          <p className="mt-2 text-2xl" aria-hidden>
                            {COND_EMOJI[cond.group]}
                          </p>
                          <p className="mt-1 text-xs text-ink/80">{cond.labelTh}</p>
                          <p className="mt-2 font-semibold text-ink">
                            {h.tempC != null ? `${h.tempC.toFixed(0)}°C` : "–"}
                          </p>
                          <p className="mt-1 text-xs text-stone">
                            ฝน {h.rainMm != null ? h.rainMm.toFixed(1) : "0"} มม.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7-day daily */}
                <div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                    พยากรณ์รายวัน (ประมาณ 7 วันข้างหน้า)
                  </h2>
                  <div className="cc-table-wrap mt-4">
                    <table>
                      <thead>
                        <tr>
                          <th>วันที่</th>
                          <th>สภาพอากาศ</th>
                          <th>อุณหภูมิ</th>
                          <th>ฝน</th>
                          <th>ความชื้น</th>
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
                              <td>
                                {COND_EMOJI[cond.group]} {cond.labelTh}
                              </td>
                              <td>
                                {d.tempMinC != null ? d.tempMinC.toFixed(0) : "–"}–
                                {d.tempMaxC != null ? d.tempMaxC.toFixed(0) : "–"}°C
                              </td>
                              <td>{d.rainMm != null ? `${d.rainMm.toFixed(1)} มม.` : "–"}</td>
                              <td>{d.humidityPct != null ? `${Math.round(d.humidityPct)}%` : "–"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* วางแผนงานฟาร์มต่อ */}
                <div className="card">
                  <p className="font-display text-lg font-bold text-ink">วางแผนงานฟาร์มต่อ</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/tools/rain-window-planner?province=${province.slug}`}
                      className="btn-secondary"
                    >
                      🌤️ หาช่วงฝนน้อย
                    </Link>
                    <Link href="/tools/irrigation-calculator" className="btn-secondary">
                      💧 คำนวณการให้น้ำ
                    </Link>
                    <Link
                      href={`/tools/harvest-weather-planner?province=${province.slug}`}
                      className="btn-secondary"
                    >
                      🌾 วางแผนเก็บเกี่ยว
                    </Link>
                    <Link href="/tools/calendar" className="btn-secondary">
                      📅 ปฏิทินเพาะปลูก
                    </Link>
                    <Link href="/tools/disease-check" className="btn-secondary">
                      🔎 เช็กโรคเบื้องต้น
                    </Link>
                  </div>
                </div>

                {/* Attribution */}
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
                  <p className="mt-1">ระบบแคชข้อมูลประมาณ 1 ชั่วโมง ตัวเลขอาจคลาดเคลื่อนไปจากพยากรณ์จริง ณ ขณะนี้ได้เล็กน้อย</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
