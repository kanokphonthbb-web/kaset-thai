import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import ProductCard from "@/components/ProductCard";
import { getAllStarterKits, getStarterKit } from "@/lib/starterKits";

type Params = { params: { kitId: string } };

export function generateStaticParams() {
  return getAllStarterKits().map((k) => ({ kitId: k.kitId }));
}

export function generateMetadata({ params }: Params) {
  const kit = getStarterKit(params.kitId);
  if (!kit) return pageMeta({ title: "ไม่พบชุดเริ่มต้น", description: "ไม่พบชุดเริ่มต้นที่ต้องการ", noindex: true });
  return pageMeta({
    title: kit.name,
    description: kit.summary || `รวมของที่ต้องมี/เสริมสำหรับ ${kit.name} เลือกซื้อเป็นชิ้น ๆ ได้เอง`,
    path: `/tools/starter-kits/${kit.kitId}`,
  });
}

export default function StarterKitDetailPage({ params }: Params) {
  const kit = getStarterKit(params.kitId);
  if (!kit) notFound();

  const required = kit.components.filter((c) => c.importance === "required").sort((a, b) => a.order - b.order);
  const optional = kit.components.filter((c) => c.importance === "optional").sort((a, b) => a.order - b.order);

  return (
    <ToolShell icon="🧰" title={kit.name} intro={`สำหรับ: ${kit.targetUser}`}>
      <div className="mb-10 rounded-2xl bg-mist p-6">
        <p className="eyebrow">ภาพรวมชุด</p>
        <p className="mt-2 text-[15px] text-ink/90">{kit.summary}</p>
        <p className="mt-3 text-xs text-stone">
          * แสดงเป็นชุดแนวคิดเพื่อให้เห็นภาพรวม แต่ละชิ้นลิงก์ไปหน้าสินค้าแยกกัน เลือกซื้อเฉพาะที่ต้องการได้เลย ไม่จำเป็นต้องซื้อครบทุกชิ้น
        </p>
      </div>

      {required.length > 0 && (
        <ComponentGroup title="ต้องมี" icon="✅" components={required} />
      )}
      {optional.length > 0 && (
        <ComponentGroup title="เสริม" icon="➕" components={optional} />
      )}

      <div className="mt-12">
        <Link href="/tools/starter-kits" className="btn-secondary">
          ← ดูชุดเริ่มต้นอื่น
        </Link>
      </div>
    </ToolShell>
  );
}

function ComponentGroup({
  title,
  icon,
  components,
}: {
  title: string;
  icon: string;
  components: ReturnType<typeof getAllStarterKits>[number]["components"];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink">
        {icon} {title}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <div key={c.name} className="rounded-2xl bg-mist p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-semibold text-ink">{c.name}</h3>
              {c.quantityHint && <span className="text-sm text-stone">({c.quantityHint})</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {c.products.map((p) => (
                <ProductCard key={p.slug} product={{ id: p.slug, slug: p.slug, name: p.name, imageUrl: p.imageUrl }} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
