import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "แหล่งข้อมูลของเกษตรกรไทย",
  description:
    "เว็บไซต์เกษตรกรไทยใช้ข้อมูลจากแหล่งทางการ เช่น กรมอุตุนิยมวิทยา และหน่วยงานด้านการเกษตรของรัฐ หน้านี้อธิบายว่าข้อมูลแต่ละส่วนมาจากไหน อัปเดตเมื่อไร และมีข้อจำกัดอะไร",
  path: "/data-sources",
});

const SOURCES = [
  {
    name: "กรมอุตุนิยมวิทยา (TMD)",
    what: "ข้อมูลพยากรณ์อากาศรายชั่วโมง (สูงสุด 48 ชั่วโมง) และรายวัน (ประมาณ 7 วัน) ที่ใช้ในหน้าอากาศเกษตรและเครื่องมือวางแผนงานฟาร์ม",
    update:
      "ระบบดึงข้อมูลจาก API ของกรมอุตุนิยมวิทยาและแคชไว้ประมาณ 1 ชั่วโมง เวลาที่แสดงบนหน้าเว็บคือเวลาของข้อมูลพยากรณ์ ไม่ใช่เวลาที่กรมอุตุนิยมวิทยาประมวลผลโมเดล",
    limits:
      "ข้อมูลเป็นการพยากรณ์ ไม่ใช่การรับรองสภาพอากาศจริง ตัวชี้วัดที่เว็บไซต์คำนวณ (เช่น ช่วงฝนน้อย) เป็นตัวช่วยวางแผนของเว็บไซต์ ไม่ใช่ประกาศเตือนภัยทางการ",
    link: "https://www.tmd.go.th",
  },
  {
    name: "ข้อมูลราคาสินค้าเกษตร",
    what: "ระบบราคาสินค้าเกษตรออกแบบมาให้เชื่อมกับฐานข้อมูลราคาทางการของหน่วยงานรัฐ (สำนักงานเศรษฐกิจการเกษตร)",
    update:
      "ขณะนี้ยังไม่ได้เชื่อมต่อแหล่งข้อมูลราคา หน้าราคาจะแสดงสถานะ \"ยังไม่ได้เชื่อมต่อแหล่งข้อมูล\" จนกว่าจะมีข้อมูลจริง — เว็บไซต์ไม่แสดงราคาสมมติหรือราคาที่แต่งขึ้นเด็ดขาด",
    limits:
      "เมื่อเชื่อมต่อแล้ว ราคาจะเป็นข้อมูลรายวันตามแหล่งข้อมูล ไม่ใช่ราคาซื้อขายแบบเรียลไทม์ และราคาแต่ละประเภท (หน้าฟาร์ม ขายส่ง ขายปลีก) จะแสดงแยกกันเสมอ",
    link: "https://www.oae.go.th",
  },
  {
    name: "หน่วยงานวิชาการเกษตรของรัฐ",
    what: "แนวทางการเพาะปลูก อัตราปุ๋ย มาตรฐาน GAP ข้อมูลโรคพืชและสัตว์ ในบทความและเครื่องมือ อ้างอิงเอกสารเผยแพร่ของกรมวิชาการเกษตร กรมส่งเสริมการเกษตร กรมปศุสัตว์ และกรมประมง",
    update: "ตรวจทานเมื่อจัดทำบทความ และระบุแหล่งอ้างอิงท้ายบทความ",
    limits:
      "คำแนะนำเชิงตัวเลข (อัตราปุ๋ย ยา วัคซีน) ควรยึดฉลากผลิตภัณฑ์และคำแนะนำของเจ้าหน้าที่ในพื้นที่เป็นหลัก เว็บไซต์ไม่กำหนดอัตราการใช้สารเคมีเอง",
    link: "https://www.doa.go.th",
  },
];

export default function DataSourcesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <span className="eyebrow">ความโปร่งใสของข้อมูล</span>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              แหล่งข้อมูลของเกษตรกรไทย
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone">
              ข้อมูลอากาศ ราคา และความรู้เกษตรบนเว็บไซต์นี้อ้างอิงจากแหล่งทางการ
              หน้านี้สรุปว่าข้อมูลแต่ละส่วนมาจากไหน อัปเดตอย่างไร และมีข้อจำกัดอะไรบ้าง
            </p>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x space-y-6">
            {SOURCES.map((s) => (
              <div key={s.name} className="rounded-2xl bg-mist p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-ink">{s.name}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-ink">ใช้ทำอะไร</dt>
                    <dd className="mt-1 text-stone">{s.what}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">การอัปเดต</dt>
                    <dd className="mt-1 text-stone">{s.update}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">ข้อจำกัด</dt>
                    <dd className="mt-1 text-stone">{s.limits}</dd>
                  </div>
                </dl>
                <a
                  href={s.link}
                  target="_blank"
                  rel="nofollow noopener"
                  className="mt-4 inline-block text-sm font-semibold text-ink underline"
                >
                  เว็บไซต์หน่วยงาน →
                </a>
              </div>
            ))}
            <p className="text-sm text-stone">
              อ่านวิธีการจัดการข้อมูลโดยละเอียดได้ที่{" "}
              <Link href="/data-methodology" className="font-semibold text-ink underline">
                วิธีการจัดการข้อมูลของเรา
              </Link>{" "}
              — พบข้อมูลที่ไม่ถูกต้อง? แจ้งเราได้จากหน้า{" "}
              <Link href="/about" className="font-semibold text-ink underline">
                เกี่ยวกับเรา
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
