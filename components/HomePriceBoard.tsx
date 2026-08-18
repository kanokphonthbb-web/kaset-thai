import Link from "next/link";
import { baht } from "@/lib/format";

// ตารางราคาสินค้าหลักบนหน้าแรก — server-rendered (ISR 5 นาที) เห็นได้ทันทีไม่ต้องกด
export interface HomePriceRow {
  name: string;
  priceAvg: number;
  unit: string | null;
}

export default function HomePriceBoard({
  rows,
  sourceDateTh,
}: {
  rows: HomePriceRow[];
  sourceDateTh: string | null;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-paper p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">📊 ราคาสินค้าเกษตรวันนี้</h3>
        {sourceDateTh ? <span className="text-xs text-stone">ข้อมูลวันที่ {sourceDateTh}</span> : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-stone">
          ข้อมูลราคายังไม่พร้อมใช้งานในขณะนี้ — ดูรายละเอียดที่หน้าราคา
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-linen">
          {rows.map((r) => (
            <li key={r.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span className="text-ink">{r.name}</span>
              <span className="shrink-0 font-semibold text-ink">
                {baht(r.priceAvg)}
                {r.unit ? <span className="font-normal text-stone"> /{r.unit}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <Link href="/prices" className="btn-secondary">
          ดูราคาทั้งหมด →
        </Link>
      </div>
      <p className="mt-3 text-xs text-stone">
        แหล่งข้อมูล: สำนักงานเศรษฐกิจการเกษตร · ราคาตลาดรายวัน ไม่ใช่เรียลไทม์
      </p>
    </div>
  );
}
