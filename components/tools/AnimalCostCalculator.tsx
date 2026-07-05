"use client";

import { useMemo, useState } from "react";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";

type N = number | "";

export default function AnimalCostCalculator() {
  const [count, setCount] = useState<N>(100);
  const [breed, setBreed] = useState<N>(45);
  const [feed, setFeed] = useState<N>(120);
  const [health, setHealth] = useState<N>(15);
  const [fixed, setFixed] = useState<N>(8000);
  const [survival, setSurvival] = useState<N>(92);
  const [revenuePerHead, setRevenuePerHead] = useState<N>(230);

  const r = useMemo(() => {
    const c = val(count);
    const variablePerHead = val(breed) + val(feed) + val(health);
    const totalVariable = variablePerHead * c;
    const totalCost = totalVariable + val(fixed);
    const survivors = c * (val(survival) / 100);
    const revenue = survivors * val(revenuePerHead);
    const profit = revenue - totalCost;
    const breakEvenPerHead = survivors > 0 ? totalCost / survivors : 0;
    const roiPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { variablePerHead, totalCost, survivors, revenue, profit, breakEvenPerHead, roiPct };
  }, [count, breed, feed, health, fixed, survival, revenuePerHead]);

  const profitable = r.profit >= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกข้อมูลการเลี้ยงต่อ 1 รอบ
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวอย่างตั้งค่าไว้แบบเลี้ยงไก่เนื้อ ปรับตามชนิดสัตว์ที่คุณเลี้ยงได้
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="จำนวนที่เลี้ยง" value={count} onChange={setCount} suffix="ตัว" step={10} />
          <NumberField label="ค่าพันธุ์สัตว์" value={breed} onChange={setBreed} suffix="บาท/ตัว" step={5} />
          <NumberField label="ค่าอาหารตลอดรอบ" value={feed} onChange={setFeed} suffix="บาท/ตัว" step={10} />
          <NumberField label="ค่ายา วัคซีน และดูแล" value={health} onChange={setHealth} suffix="บาท/ตัว" step={5} />
          <NumberField label="ค่าโรงเรือน/อุปกรณ์ (รวม)" value={fixed} onChange={setFixed} suffix="บาท" step={500} />
          <NumberField label="อัตรารอด" value={survival} onChange={setSurvival} suffix="%" min={0} step={1} hint="สัดส่วนสัตว์ที่รอดจนขายได้" />
          <NumberField label="รายได้เมื่อขาย" value={revenuePerHead} onChange={setRevenuePerHead} suffix="บาท/ตัว" step={10} />
        </div>

        <div className="mt-6 rounded-2xl bg-lime-canopy p-4 text-sm text-ink">
          <span className="font-semibold">💡 จุดคุ้มทุน:</span> ต้องขายได้อย่างน้อย{" "}
          <span className="font-bold">{baht(r.breakEvenPerHead)} บาท/ตัว</span>{" "}
          จึงจะไม่ขาดทุน
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-mist p-6">
          <p className="eyebrow">ผลลัพธ์ต่อรอบ (โดยประมาณ)</p>
          <div
            className="mt-2 font-display text-4xl font-bold"
            style={{ color: profitable ? "#2d8c3a" : "#e44b4b" }}
          >
            {profitable ? "กำไร" : "ขาดทุน"} {baht(Math.abs(r.profit))} บาท
          </div>
          <p className="mt-1 text-sm text-stone">
            ผลตอบแทน (ROI) {num(r.roiPct)}% ต่อรอบ
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="ต้นทุนแปรผัน/ตัว" value={`${baht(r.variablePerHead)} บาท`} />
            <Row label="สัตว์ที่คาดว่าจะรอด" value={`${num(r.survivors)} ตัว`} />
            <Row label="ต้นทุนรวม" value={`${baht(r.totalCost)} บาท`} />
            <Row label="รายได้รวม" value={`${baht(r.revenue)} บาท`} strong />
          </dl>
        </div>
        <p className="mt-3 text-xs text-stone">
          * เป็นการประมาณการเพื่อวางแผน ควรเผื่อความเสี่ยงเรื่องโรคและราคาตลาด
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
