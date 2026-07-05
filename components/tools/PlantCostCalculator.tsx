"use client";

import { useMemo, useState } from "react";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";

type N = number | "";

export default function PlantCostCalculator() {
  const [area, setArea] = useState<N>(1);
  const [seed, setSeed] = useState<N>(700);
  const [fertilizer, setFertilizer] = useState<N>(1200);
  const [labor, setLabor] = useState<N>(1500);
  const [other, setOther] = useState<N>(600);
  const [yieldPerRai, setYieldPerRai] = useState<N>(650);
  const [price, setPrice] = useState<N>(12);

  const r = useMemo(() => {
    const a = val(area);
    const costPerRai = val(seed) + val(fertilizer) + val(labor) + val(other);
    const totalCost = costPerRai * a;
    const totalYield = val(yieldPerRai) * a;
    const revenue = totalYield * val(price);
    const profit = revenue - totalCost;
    const profitPerRai = a > 0 ? profit / a : 0;
    const breakEvenPrice = val(yieldPerRai) > 0 ? costPerRai / val(yieldPerRai) : 0;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { costPerRai, totalCost, totalYield, revenue, profit, profitPerRai, breakEvenPrice, marginPct };
  }, [area, seed, fertilizer, labor, other, yieldPerRai, price]);

  const profitable = r.profit >= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกข้อมูลต้นทุน
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับพืชและพื้นที่ของคุณ
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="พื้นที่ปลูก" value={area} onChange={setArea} suffix="ไร่" step={0.5} />
          <NumberField label="ค่าเมล็ดพันธุ์ / ต้นกล้า" value={seed} onChange={setSeed} suffix="บาท/ไร่" step={50} />
          <NumberField label="ค่าปุ๋ยและสารบำรุง" value={fertilizer} onChange={setFertilizer} suffix="บาท/ไร่" step={50} />
          <NumberField label="ค่าแรงงาน" value={labor} onChange={setLabor} suffix="บาท/ไร่" step={50} />
          <NumberField label="ค่าน้ำ ไฟ และอื่น ๆ" value={other} onChange={setOther} suffix="บาท/ไร่" step={50} />
          <NumberField label="ผลผลิตที่คาดว่าจะได้" value={yieldPerRai} onChange={setYieldPerRai} suffix="กก./ไร่" step={10} />
          <NumberField label="ราคาขาย" value={price} onChange={setPrice} suffix="บาท/กก." step={0.5} />
        </div>

        <div className="mt-6 rounded-2xl bg-lime-canopy p-4 text-sm text-ink">
          <span className="font-semibold">💡 จุดคุ้มทุน:</span> ถ้าขายได้ต่ำกว่า{" "}
          <span className="font-bold">{num(r.breakEvenPrice)} บาท/กก.</span>{" "}
          จะเริ่มขาดทุน
        </div>
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-mist p-6">
          <p className="eyebrow">ผลลัพธ์โดยประมาณ</p>
          <div
            className="mt-2 font-display text-4xl font-bold"
            style={{ color: profitable ? "#2d8c3a" : "#e44b4b" }}
          >
            {profitable ? "กำไร" : "ขาดทุน"} {baht(Math.abs(r.profit))} บาท
          </div>
          <p className="mt-1 text-sm text-stone">
            เฉลี่ย {baht(r.profitPerRai)} บาท/ไร่ · อัตรากำไร {num(r.marginPct)}%
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="ต้นทุนต่อไร่" value={`${baht(r.costPerRai)} บาท`} />
            <Row label="ต้นทุนรวม" value={`${baht(r.totalCost)} บาท`} />
            <Row label="ผลผลิตรวม" value={`${num(r.totalYield)} กก.`} />
            <Row label="รายได้รวม" value={`${baht(r.revenue)} บาท`} strong />
          </dl>
        </div>
        <p className="mt-3 text-xs text-stone">
          * เป็นการประมาณการเพื่อวางแผนเบื้องต้น ผลจริงขึ้นกับสภาพพื้นที่
          ราคาตลาด และการจัดการ
        </p>
        <button
          onClick={() => window.print()}
          className="btn-secondary no-print mt-4 w-full"
        >
          🖨️ พิมพ์ / บันทึก PDF
        </button>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-ash/60 pt-3">
      <dt className="text-stone">{label}</dt>
      <dd className={strong ? "font-display font-bold text-ink" : "font-semibold text-ink"}>
        {value}
      </dd>
    </div>
  );
}
