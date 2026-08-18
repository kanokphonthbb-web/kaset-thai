import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { provincesByRegion } from "@/lib/weather/locations";

const TITLE = "พยากรณ์อากาศเพื่อการเกษตร เช็กฝน อุณหภูมิ ลม รายจังหวัด";
const DESCRIPTION =
  "พยากรณ์อากาศเพื่อการเกษตรรายจังหวัด ข้อมูลจากกรมอุตุนิยมวิทยา เช็กฝน อุณหภูมิ ลม ความชื้น และช่วงฝนน้อยตามข้อมูลพยากรณ์ ใช้วางแผนรดน้ำ ใส่ปุ๋ย และเก็บเกี่ยว";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/weather",
});

const WEATHER_TOOLS = [
  {
    href: "/tools/rain-window-planner",
    icon: "🌤️",
    title: "หาช่วงฝนน้อย",
    desc: "เช็กช่วงฝนน้อยตามข้อมูลพยากรณ์ 48 ชม. ข้างหน้า สำหรับวางแผนงานที่ต้องเลี่ยงฝน",
  },
  {
    href: "/tools/rainfall-forecast-calculator",
    icon: "🌧️",
    title: "ฝนสะสมตามพยากรณ์",
    desc: "ดูฝนสะสม 24 / 48 / 72 ชม. และฝนรายวัน 7 วันข้างหน้าตามพยากรณ์",
  },
  {
    href: "/tools/harvest-weather-planner",
    icon: "🌾",
    title: "สภาพอากาศช่วงเก็บเกี่ยว",
    desc: "ดูพยากรณ์ 7 วันข้างหน้าประกอบการวางแผนเก็บเกี่ยว แยกตามเกณฑ์ฝนของกรมอุตุฯ",
  },
];

const FAQS = [
  {
    q: "ข้อมูลพยากรณ์อากาศมาจากไหน",
    a: "ข้อมูลทั้งหมดดึงจากกรมอุตุนิยมวิทยา (TMD) ผ่านระบบพยากรณ์ nwpapi เว็บไซต์นี้นำมาแสดงผลและคำนวณตัวชี้วัดเพิ่มเติมสำหรับงานเกษตรเท่านั้น ไม่ได้ปรับแก้ค่าพยากรณ์ต้นทาง",
  },
  {
    q: "ข้อมูลอัปเดตบ่อยแค่ไหน",
    a: "ระบบดึงข้อมูลจากกรมอุตุนิยมวิทยาและแคชไว้ประมาณ 1 ชั่วโมงต่อพื้นที่ เพื่อความรวดเร็วและลดภาระคำขอ ทุกหน้าจะแสดงเวลาที่ดึงข้อมูลล่าสุดกำกับไว้เสมอ",
  },
  {
    q: "พยากรณ์ล่วงหน้าได้กี่วัน",
    a: "พยากรณ์รายชั่วโมงมีความละเอียดสูงสุด 48 ชั่วโมงข้างหน้า ส่วนพยากรณ์รายวันมีให้ประมาณ 7 วันข้างหน้า (ขึ้นกับข้อมูลที่กรมอุตุนิยมวิทยาเปิดให้ในขณะนั้น)",
  },
  {
    q: "ทำไมค่าที่เห็นต่างจากแอปพยากรณ์อากาศอื่น",
    a: "แต่ละแอปอาจใช้โมเดลพยากรณ์ จุดพิกัด และรอบเวลาคำนวณต่างกัน ทำให้ตัวเลขคลาดเคลื่อนกันได้บ้าง ข้อมูลบนเว็บนี้อ้างอิงจากกรมอุตุนิยมวิทยาโดยตรงและควรใช้ประกอบการตัดสินใจ ไม่ใช่คำยืนยันขั้นสุดท้าย",
  },
  {
    q: "ตัวชี้วัดสภาพอากาศ (เช่น ฝนหนัก ลมแรง) คือประกาศเตือนภัยหรือไม่",
    a: "ไม่ใช่ ตัวชี้วัดที่แสดงในแต่ละหน้าจังหวัดเป็น \"ตัวชี้วัดสภาพอากาศโดยเกษตรกรไทย\" ที่คำนวณจากเกณฑ์ทางการของกรมอุตุนิยมวิทยา เพื่อช่วยวางแผนงานฟาร์มเท่านั้น ไม่ใช่ประกาศเตือนภัยของกรมอุตุนิยมวิทยา ควรติดตามประกาศเตือนภัยจริงที่ tmd.go.th",
  },
];

export default function WeatherHubPage() {
  const url = `${SITE_URL}/weather`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "th-TH",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "อากาศเกษตร", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  const regions = provincesByRegion();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* Hero band */}
        <section className="bg-mist">
          <div className="container-x py-16">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="font-medium text-ink">อากาศเกษตร</span>
            </nav>

            <div className="mt-6 flex items-start gap-4">
              <span className="text-5xl" aria-hidden>
                ⛅
              </span>
              <div>
                <h1 className="font-display text-4xl font-bold leading-snug text-ink">
                  พยากรณ์อากาศเพื่อการเกษตร
                </h1>
                <p className="mt-3 max-w-2xl text-stone">
                  ใช้ข้อมูลพยากรณ์จากกรมอุตุนิยมวิทยา ประกอบกับตัวชี้วัดสำหรับวางแผนงานฟาร์ม
                  เช่น รดน้ำ ใส่ปุ๋ย พ่นสาร และเก็บเกี่ยว เลือกจังหวัดของคุณด้านล่าง
                  หรือใช้เครื่องมือช่วยวางแผนเฉพาะงาน
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Weather tools */}
        <section className="bg-paper py-16">
          <div className="container-x">
            <SectionHeader
              eyebrow="เครื่องมืออากาศเกษตร"
              title="วางแผนงานฟาร์มด้วยพยากรณ์อากาศ"
              desc="เลือกเครื่องมือที่ตรงกับงานที่กำลังวางแผน"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {WEATHER_TOOLS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="card flex h-full flex-col transition-colors hover:bg-linen"
                >
                  <span className="text-3xl" aria-hidden>
                    {t.icon}
                  </span>
                  <p className="mt-3 font-display text-lg font-bold text-ink">{t.title}</p>
                  <p className="mt-2 text-sm text-stone">{t.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Province directory */}
        <section className="bg-linen py-16">
          <div className="container-x">
            <SectionHeader
              eyebrow="เลือกจังหวัด"
              title="พยากรณ์อากาศรายจังหวัด"
              desc="ครบทั้ง 77 จังหวัด แบ่งตามภูมิภาค"
            />
            <div className="mt-10 space-y-10">
              {regions.map((r) => (
                <div key={r.region}>
                  <h2 className="font-display text-xl font-bold leading-snug text-ink">
                    {r.labelTh}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.provinces.map((p) => (
                      <Link key={p.slug} href={`/weather/${p.slug}`} className="tag-chip hover:bg-paper">
                        {p.nameTh}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-paper py-16">
          <div className="container-x max-w-3xl">
            <SectionHeader eyebrow="คำถามที่พบบ่อย" title="เกี่ยวกับข้อมูลพยากรณ์อากาศ" align="left" />
            <div className="mt-8 space-y-3">
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
        </section>
      </main>
      <Footer />
    </>
  );
}
