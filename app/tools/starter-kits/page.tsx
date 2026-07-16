import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import { getAllStarterKits } from "@/lib/starterKits";

export const metadata = pageMeta({
  title: "ชุดเริ่มต้น",
  description: "รวมของที่ต้องมี/เสริมสำหรับงานเกษตรแต่ละแบบ ปลูกพืช เลี้ยงสัตว์ ประมง ดินน้ำปุ๋ย และอื่น ๆ เลือกซื้อเป็นชิ้น ๆ ได้เอง",
  path: "/tools/starter-kits",
});

const CATEGORY_ORDER = [
  "ปลูกพืช",
  "เลี้ยงสัตว์ / ปศุสัตว์",
  "ประมง / สัตว์น้ำ",
  "ดิน น้ำ ปุ๋ย",
  "โรคและการดูแล",
  "ตลาด แปรรูป และการขาย",
  "เกษตรผสมผสาน / จัดการฟาร์ม",
  "เทคโนโลยี อุปกรณ์ และเครื่องมือ",
];

export default function StarterKitsPage() {
  const kits = getAllStarterKits();
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    kits: kits.filter((k) => k.category === category),
  })).filter((g) => g.kits.length > 0);

  return (
    <ToolShell
      icon="🧰"
      title="ชุดเริ่มต้น"
      intro="รวมของที่ต้องมี/เสริมสำหรับงานเกษตรแต่ละแบบ กดเข้าไปดูรายการ แล้วเลือกซื้อของแต่ละชิ้นได้เองตามที่ต้องการ ไม่ใช่การขายเป็นเซ็ตเดียว"
    >
      <div className="space-y-14">
        {groups.map((g) => (
          <section key={g.category}>
            <h2 className="font-display text-xl font-bold text-ink">{g.category}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.kits.map((kit) => {
                const componentCount = kit.components.length;
                const requiredCount = kit.components.filter((c) => c.importance === "required").length;
                return (
                  <Link
                    key={kit.kitId}
                    href={`/tools/starter-kits/${kit.kitId}`}
                    className="group flex h-full flex-col rounded-2xl bg-mist p-5 transition-colors hover:bg-linen"
                  >
                    <h3 className="font-display text-lg font-bold text-ink">{kit.name}</h3>
                    <p className="mt-1.5 text-sm text-stone">สำหรับ: {kit.targetUser}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-ink/80">{kit.summary}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                      {requiredCount} รายการหลัก · {componentCount} รายการทั้งหมด
                      <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                        →
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </ToolShell>
  );
}
