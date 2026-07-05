import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CATEGORIES } from "@/lib/data";

export const metadata = pageMeta({ title: "เกี่ยวกับเรา", description: "เกษตรกรไทย คือคลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม", path: "/about" });

const VALUES = [
  {
    icon: "✍️",
    title: "อ่านง่าย ทำตามได้จริง",
    text: "เขียนด้วยภาษาที่เข้าใจง่าย เหมือนผู้เชี่ยวชาญอธิบายให้คนทำจริงฟัง ไม่ใช้ศัพท์ยาก",
  },
  {
    icon: "🧮",
    title: "เน้นต้นทุนและกำไร",
    text: "ทุกเรื่องเชื่อมโยงกับต้นทุน กำไร และจุดคุ้มทุน พร้อมเครื่องมือช่วยคำนวณ",
  },
  {
    icon: "🌱",
    title: "เหมาะกับมือใหม่",
    text: "เริ่มจากศูนย์ได้ ครอบคลุมตั้งแต่ปลูกพืช เลี้ยงสัตว์ ประมง ไปจนถึงการขาย",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <span className="eyebrow">เกี่ยวกับเรา</span>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              คลังความรู้เกษตร ที่คนไทยใช้ได้จริง
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone">
              เกษตรกรไทย คือคลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช
              เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม
            </p>
          </div>
        </section>

        <section className="bg-paper py-20">
          <div className="container-x">
            <div className="grid gap-6 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-2xl bg-mist p-6">
                  <span className="text-3xl" aria-hidden>
                    {v.icon}
                  </span>
                  <h2 className="mt-4 font-display text-lg font-bold text-ink">
                    {v.title}
                  </h2>
                  <p className="mt-2 text-sm text-stone">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-linen py-20">
          <div className="container-x">
            <h2 className="font-display text-2xl font-bold text-ink">
              เนื้อหาที่เราครอบคลุม
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.title}
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/search" className="btn-primary">
                🔍 เริ่มค้นหาความรู้
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
