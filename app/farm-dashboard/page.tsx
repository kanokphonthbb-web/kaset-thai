import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FarmDashboard from "@/components/FarmDashboard";
import { pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const TITLE = "แดชบอร์ดเกษตรกร — อากาศ ราคา และเครื่องมือ ในหน้าเดียว";
const DESCRIPTION =
  "ตั้งค่าจังหวัด พืช และขนาดฟาร์มครั้งเดียว แล้วดูพยากรณ์อากาศเกษตร ช่วงฝนน้อย ราคาสินค้า และเครื่องมือคำนวณที่ใช้บ่อยได้ในหน้าเดียว ข้อมูลเก็บในเครื่องคุณ ไม่ต้องสมัครสมาชิก";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/farm-dashboard" });

export default function FarmDashboardPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/farm-dashboard#webpage`,
        url: `${SITE_URL}/farm-dashboard`,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "th-TH",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/farm-dashboard#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "แดชบอร์ดเกษตรกร", item: `${SITE_URL}/farm-dashboard` },
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
              <span className="text-ink">แดชบอร์ดเกษตรกร</span>
            </nav>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              แดชบอร์ดเกษตรกร
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone">
              อากาศ ราคา ปฏิทินปลูก และเครื่องมือที่ใช้บ่อย รวมไว้ในหน้าเดียวสำหรับฟาร์มของคุณ
              — เปิดดูได้ทุกเช้าก่อนวางแผนงาน
            </p>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">
            <FarmDashboard />
            <p className="mt-8 text-xs text-stone">
              การตั้งค่าฟาร์มเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น (localStorage) ไม่ส่งขึ้นเซิร์ฟเวอร์ ·
              ข้อมูลพยากรณ์: กรมอุตุนิยมวิทยา (ดู{" "}
              <Link href="/data-sources" className="underline">
                แหล่งข้อมูลของเรา
              </Link>
              )
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
