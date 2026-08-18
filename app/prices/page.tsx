import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getLatestPrices, getPriceDataStatus } from "@/lib/agri-data/service";
import { baht } from "@/lib/format";

export const revalidate = 300;

const TITLE = "ราคาสินค้าเกษตรล่าสุด";
const DESCRIPTION =
  "ติดตามราคาสินค้าเกษตรล่าสุดจากแหล่งข้อมูลทางการ แยกประเภทราคาหน้าฟาร์ม ขายส่ง ขายปลีก พร้อมวันที่ของข้อมูลกำกับทุกรายการ และเครื่องมือคำนวณรายได้จากราคาที่เห็น";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/prices" });

const PRICE_TYPE_LABEL: Record<string, string> = {
  "farm-gate": "ราคาหน้าฟาร์ม",
  wholesale: "ราคาขายส่ง",
  retail: "ราคาขายปลีก",
};

const dateTh = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function PricesPage() {
  const [status, latest] = await Promise.all([getPriceDataStatus(), getLatestPrices(30)]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/prices#webpage`,
        url: `${SITE_URL}/prices`,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "th-TH",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/prices#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "ราคาสินค้าเกษตร", item: `${SITE_URL}/prices` },
        ],
      },
    ],
  };

  return (
    <>
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="bg-mist">
          <div className="container-x py-16">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:underline">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="text-ink">ราคาสินค้าเกษตร</span>
            </nav>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              ราคาสินค้าเกษตรล่าสุด
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone">
              ราคาจากแหล่งข้อมูลทางการ อัปเดตรายวัน แยกประเภทราคาชัดเจน
              พร้อมวันที่ของข้อมูลกำกับทุกรายการ — ไม่ใช่ราคาซื้อขายแบบเรียลไทม์
            </p>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">
            {!status.hasData ? (
              <div className="rounded-2xl bg-mist p-8 text-center sm:p-12">
                <span className="text-4xl" aria-hidden>
                  📊
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold text-ink">
                  ยังไม่ได้เชื่อมต่อแหล่งข้อมูลราคา
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-stone">
                  ระบบราคาสินค้าเกษตรพร้อมทำงานแล้ว แต่กำลังรอการเชื่อมต่อกับฐานข้อมูลราคาทางการ
                  เราจะแสดงเฉพาะข้อมูลจริงจากแหล่งที่ตรวจสอบได้เท่านั้น
                  จะไม่มีการแสดงราคาสมมติหรือราคาที่แต่งขึ้น
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm text-stone">
                  อ่านแนวทางการจัดการข้อมูลได้ที่{" "}
                  <Link href="/data-methodology" className="font-semibold text-ink underline">
                    วิธีการจัดการข้อมูลของเรา
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone">
                  ข้อมูลล่าสุดจากแหล่งข้อมูล:{" "}
                  <strong className="text-ink">
                    {status.latestSourceDate ? dateTh.format(status.latestSourceDate) : "-"}
                  </strong>{" "}
                  · {status.productCount} รายการสินค้า
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {latest.map((row) => (
                    <div key={`${row.productId}-${row.priceType}`} className="rounded-2xl bg-mist p-6">
                      <h2 className="font-display text-lg font-bold text-ink">{row.productName}</h2>
                      <p className="mt-1 text-xs text-stone">
                        {PRICE_TYPE_LABEL[row.priceType] ?? row.priceType}
                      </p>
                      <p className="mt-3 font-display text-2xl font-bold text-ink">
                        {row.priceAvg != null ? baht(row.priceAvg) : "-"}
                        {row.unit ? <span className="text-sm font-normal text-stone"> /{row.unit}</span> : null}
                      </p>
                      {row.priceMin != null && row.priceMax != null ? (
                        <p className="mt-1 text-xs text-stone">
                          ช่วง {baht(row.priceMin)} – {baht(row.priceMax)}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-stone">ข้อมูลวันที่ {dateTh.format(row.sourceDate)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-linen p-6">
                <h2 className="font-display text-lg font-bold text-ink">คำนวณรายได้จากราคาที่เห็น</h2>
                <p className="mt-2 text-sm text-stone">
                  รู้ราคาแล้ว ลองคำนวณรายได้ กำไร และราคาคุ้มทุนของฟาร์มคุณต่อได้เลย
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/tools/farm-income-calculator" className="btn-secondary">
                    คำนวณรายได้ฟาร์ม
                  </Link>
                  <Link href="/tools/farm-break-even-calculator" className="btn-secondary">
                    จุดคุ้มทุน
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl bg-linen p-6">
                <h2 className="font-display text-lg font-bold text-ink">ความรู้เรื่องต้นทุนและตลาด</h2>
                <p className="mt-2 text-sm text-stone">
                  บทความต้นทุน-กำไร และการขายผลผลิต จากคลังความรู้ของเรา
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/cost-profit" className="btn-secondary">
                    ต้นทุน-กำไร
                  </Link>
                  <Link href="/market" className="btn-secondary">
                    ตลาดและการขาย
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-stone">
              แหล่งข้อมูล: ฐานข้อมูลราคาสินค้าเกษตรทางการ (ดู{" "}
              <Link href="/data-sources" className="underline">
                แหล่งข้อมูลของเรา
              </Link>
              ) · ราคาเป็นข้อมูลรายวันตามแหล่งข้อมูล ไม่ใช่ราคาซื้อขายแบบเรียลไทม์ ·
              ราคาแต่ละประเภท (หน้าฟาร์ม/ขายส่ง/ขายปลีก) แสดงแยกกันเสมอ
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
