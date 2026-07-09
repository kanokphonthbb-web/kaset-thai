import Link from "next/link";
import Image from "next/image";
import SearchBox from "./SearchBox";
import { statsFor, unsplashUrl, HERO_IMAGE } from "@/lib/data";

export default function Hero({ articleCount }: { articleCount: number }) {
  const bg = unsplashUrl(HERO_IMAGE, 1920);
  const stats = statsFor(articleCount);

  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed real photograph — Thai farmer in a rice paddy */}
      {bg && (
        <Image
          src={bg}
          alt="ชาวนาไทยกำลังดำนาในแปลงข้าว"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      {/* Dark overlay for text legibility */}
      <div aria-hidden className="absolute inset-0 bg-black/45" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/30"
      />

      <div className="container-x relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow text-lime-canopy">
            คลังความรู้เกษตรครบวงจร
          </span>

          <h1 className="mt-5 font-display text-5xl font-bold leading-snug text-paper drop-shadow sm:text-6xl">
            เกษตรกรไทย
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-paper drop-shadow sm:text-xl">
            คลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช เลี้ยงสัตว์
            และสร้างรายได้จากฟาร์ม
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-base text-paper/90 drop-shadow">
            รวมวิธีปลูกพืช เลี้ยงสัตว์ ดูแลโรคพืชโรคสัตว์ ทำปุ๋ย จัดการดินน้ำ
            โรงเรือน ต้นทุน กำไร และแนวทางขายสินค้าเกษตร อ่านง่าย ทำตามได้จริง
            เหมาะสำหรับมือใหม่และเกษตรกรรายย่อย
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/plants" className="btn-primary w-full sm:w-auto">
              🌱 เริ่มจากการปลูกพืช
            </Link>
            <Link
              href="/animals"
              className="btn w-full border border-paper bg-transparent font-medium text-paper hover:bg-paper/10 sm:w-auto"
            >
              🐔 เริ่มจากการเลี้ยงสัตว์
            </Link>
          </div>

          {/* White pill search over the photo */}
          <div id="search" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
            <SearchBox onDark />
          </div>

          {/* Floating dark translucent stats card — the one shadow-driven element */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-black/40 p-6 shadow-xl backdrop-blur sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-paper">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-lime-canopy">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xs text-paper/70">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
