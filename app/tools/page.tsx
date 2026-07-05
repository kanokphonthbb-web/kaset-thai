import { pageMeta } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { TOOLS } from "@/lib/data";

export const metadata = pageMeta({ title: "เครื่องมือช่วยเกษตรกร", description: "รวมเครื่องมือช่วยเกษตรกรไทย คำนวณต้นทุนปลูกพืช คำนวณต้นทุนเลี้ยงสัตว์ ปฏิทินเพาะปลูก และเช็กโรคเบื้องต้น", path: "/tools" });

export default function ToolsIndexPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <span className="eyebrow">เครื่องมือ</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-ink">
              เครื่องมือช่วยเกษตรกร
            </h1>
            <p className="mt-3 max-w-2xl text-stone">
              ไม่ใช่แค่อ่าน แต่ช่วยคิดต้นทุนและวางแผนก่อนลงมือทำจริง
            </p>
          </div>
        </section>

        <section className="bg-paper py-20">
          <div className="container-x">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.title} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
