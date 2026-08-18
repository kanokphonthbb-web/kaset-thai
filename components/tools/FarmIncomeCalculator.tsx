"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeFarmIncome, type FarmIncomeInput, type FarmIncomeResult } from "@/lib/calc/farmIncome";

type N = number | "";

const TOOL_SLUG = "farm-income-calculator";

const DEFAULTS = {
  areaRai: 5,
  yieldPerRai: 600,
  pricePerKg: 10,
  totalCost: 15000,
} satisfies FarmIncomeInput;

function numOrDash(n: number | null): string {
  return n === null ? "-" : num(n);
}

function buildSummaryText(r: FarmIncomeResult): string {
  return [
    "คำนวณรายได้-กำไรฟาร์ม",
    `ผลผลิตรวม: ${num(r.totalYieldKg)} กก.`,
    `รายได้: ${baht(r.revenue)} บาท`,
    `ต้นทุนรวม: ${baht(r.cost)} บาท`,
    `กำไร: ${baht(r.profit)} บาท`,
    `กำไรต่อไร่: ${numOrDash(r.profitPerRai)} บาท/ไร่`,
    `รายได้ต่อไร่: ${numOrDash(r.revenuePerRai)} บาท/ไร่`,
    `อัตรากำไร: ${r.profitMarginPct === null ? "-" : `${num(r.profitMarginPct)}%`}`,
    `ราคาคุ้มทุนต่อ กก.: ${numOrDash(r.breakEvenPricePerKg)} บาท/กก.`,
    "* เป็นการประมาณการจากข้อมูลที่ป้อนเท่านั้น ไม่ใช่การรับประกันกำไร",
  ].join("\n");
}

export default function FarmIncomeCalculator() {
  const [areaRai, setAreaRai] = useState<N>(DEFAULTS.areaRai);
  const [yieldPerRai, setYieldPerRai] = useState<N>(DEFAULTS.yieldPerRai);
  const [pricePerKg, setPricePerKg] = useState<N>(DEFAULTS.pricePerKg);
  const [totalCost, setTotalCost] = useState<N>(DEFAULTS.totalCost);

  const [result, setResult] = useState<FarmIncomeResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.profit >= 0 ? "profit_positive" : "profit_negative",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: FarmIncomeInput = {
      areaRai: val(areaRai),
      yieldPerRai: val(yieldPerRai),
      pricePerKg: val(pricePerKg),
      totalCost: val(totalCost),
    };
    setCopyStatus("idle");
    setResult(computeFarmIncome(input));
  }

  function handleReset() {
    setAreaRai(DEFAULTS.areaRai);
    setYieldPerRai(DEFAULTS.yieldPerRai);
    setPricePerKg(DEFAULTS.pricePerKg);
    setTotalCost(DEFAULTS.totalCost);
    setResult(null);
    setCopyStatus("idle");
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
    window.print();
  }

  async function handleCopy() {
    if (!result) return;
    track(TOOL_EVENTS.tool_export, { tool: TOOL_SLUG });
    const text = buildSummaryText(result);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setCopyStatus("unavailable");
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("unavailable");
    }
  }

  const isPositive = result ? result.profit >= 0 : true;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกพื้นที่ ผลผลิต และต้นทุน
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับข้อมูลจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="พื้นที่" value={areaRai} onChange={setAreaRai} suffix="ไร่" step={1} />
          <NumberField label="ผลผลิตต่อไร่" value={yieldPerRai} onChange={setYieldPerRai} suffix="กก." step={10} />
          <NumberField label="ราคาขาย" value={pricePerKg} onChange={setPricePerKg} suffix="บาท/กก." step={1} />
          <NumberField label="ต้นทุนรวม" value={totalCost} onChange={setTotalCost} suffix="บาท" step={100} hint="ต้นทุนทั้งหมดของรอบผลิตนี้ (พันธุ์ ปุ๋ย แรงงาน ฯลฯ)" />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณรายได้-กำไร
          </button>
          <button onClick={handleReset} className="btn-secondary no-print">
            ล้างค่า
          </button>
        </div>
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {!result && (
          <div className="rounded-2xl bg-mist p-6 text-sm text-stone">
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณรายได้-กำไร&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">กำไรโดยประมาณ</p>
              <div
                className={`mt-2 font-display text-4xl font-bold ${
                  isPositive ? "text-forest" : "text-coral"
                }`}
              >
                {baht(result.profit)} บาท
              </div>
              <p className="mt-1 text-sm text-stone">
                รายได้ {baht(result.revenue)} บาท · ต้นทุนรวม {baht(result.cost)} บาท
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ผลผลิตรวม" value={`${num(result.totalYieldKg)} กก.`} />
                    <Row label="รายได้" value={`${baht(result.revenue)} บาท`} />
                    <Row label="ต้นทุนรวม" value={`${baht(result.cost)} บาท`} />
                    <Row label="กำไร" value={`${baht(result.profit)} บาท`} strong />
                    <Row label="กำไรต่อไร่" value={`${numOrDash(result.profitPerRai)} บาท/ไร่`} />
                    <Row label="รายได้ต่อไร่" value={`${numOrDash(result.revenuePerRai)} บาท/ไร่`} />
                    <Row
                      label="อัตรากำไร"
                      value={result.profitMarginPct === null ? "-" : `${num(result.profitMarginPct)}%`}
                    />
                    <Row label="ราคาคุ้มทุนต่อ กก." value={`${numOrDash(result.breakEvenPricePerKg)} บาท/กก.`} />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)</li>
                  <li>รายได้ = ผลผลิตรวม × ราคาขายต่อ กก.</li>
                  <li>กำไร = รายได้ − ต้นทุนรวม</li>
                  <li>อัตรากำไร (%) = (กำไร ÷ รายได้) × 100</li>
                  <li>ราคาคุ้มทุนต่อ กก. = ต้นทุนรวม ÷ ผลผลิตรวม</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์ทั้งหมดเป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น
              ไม่ใช่การรับประกันกำไร โปรดตรวจสอบกับต้นทุนจริงและราคาตลาดก่อนตัดสินใจ
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <Link
                  href="/tools/farm-break-even-calculator"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, {
                      tool: TOOL_SLUG,
                      target: "/tools/farm-break-even-calculator",
                    })
                  }
                >
                  คำนวณจุดคุ้มทุนฟาร์ม
                </Link>
                <Link
                  href="/tools/minimum-selling-price"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, {
                      tool: TOOL_SLUG,
                      target: "/tools/minimum-selling-price",
                    })
                  }
                >
                  คำนวณราคาขายขั้นต่ำ
                </Link>
                <Link
                  href="/cost-profit"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, { tool: TOOL_SLUG, target: "/cost-profit" })
                  }
                >
                  อ่านเพิ่มเติมเรื่องต้นทุนและกำไร
                </Link>
              </div>
            </div>

            <div className="no-print mt-4 flex flex-col gap-2">
              <button onClick={handlePrint} className="btn-secondary w-full">
                🖨️ พิมพ์ / บันทึก PDF
              </button>
              <button onClick={handleCopy} className="btn-secondary w-full">
                📋 คัดลอกผลลัพธ์
              </button>
              {copyStatus === "copied" && (
                <p className="text-center text-xs text-stone">คัดลอกผลลัพธ์แล้ว</p>
              )}
              {copyStatus === "unavailable" && (
                <p className="text-center text-xs text-stone">
                  อุปกรณ์นี้ไม่รองรับการคัดลอกอัตโนมัติ กรุณาคัดลอกข้อความด้วยตนเอง
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td className="text-stone">{label}</td>
      <td className={strong ? "font-display font-bold text-ink" : "font-semibold text-ink"}>
        {value}
      </td>
    </tr>
  );
}
