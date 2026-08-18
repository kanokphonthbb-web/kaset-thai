"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeBreakEven, type BreakEvenInput, type BreakEvenResult } from "@/lib/calc/breakEven";

type N = number | "";

const TOOL_SLUG = "farm-break-even-calculator";

const DEFAULTS = {
  fixedCosts: 10000,
  variableCosts: 20000,
  expectedYieldKg: 3000,
  sellingPricePerKg: 12,
} satisfies BreakEvenInput;

function numOrDash(n: number | null): string {
  return n === null ? "-" : num(n);
}

function buildSummaryText(r: BreakEvenResult): string {
  return [
    "คำนวณจุดคุ้มทุนฟาร์ม",
    `ต้นทุนรวม: ${baht(r.totalCost)} บาท`,
    `ราคาคุ้มทุนต่อ กก.: ${numOrDash(r.breakEvenPricePerKg)} บาท/กก.`,
    `ผลผลิตคุ้มทุน: ${numOrDash(r.breakEvenYieldKg)} กก.`,
    `รายได้คาด: ${baht(r.expectedRevenue)} บาท`,
    `กำไรคาด: ${baht(r.expectedProfit)} บาท`,
    `ROI: ${r.roiPct === null ? "-" : `${num(r.roiPct)}%`}`,
    "* เป็นการประมาณการจากข้อมูลที่ป้อนเท่านั้น ไม่ใช่การรับประกันผลตอบแทน",
  ].join("\n");
}

export default function FarmBreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState<N>(DEFAULTS.fixedCosts);
  const [variableCosts, setVariableCosts] = useState<N>(DEFAULTS.variableCosts);
  const [expectedYieldKg, setExpectedYieldKg] = useState<N>(DEFAULTS.expectedYieldKg);
  const [sellingPricePerKg, setSellingPricePerKg] = useState<N>(DEFAULTS.sellingPricePerKg);

  const [result, setResult] = useState<BreakEvenResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.expectedProfit >= 0 ? "profit_positive" : "profit_negative",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: BreakEvenInput = {
      fixedCosts: val(fixedCosts),
      variableCosts: val(variableCosts),
      expectedYieldKg: val(expectedYieldKg),
      sellingPricePerKg: val(sellingPricePerKg),
    };
    setCopyStatus("idle");
    setResult(computeBreakEven(input));
  }

  function handleReset() {
    setFixedCosts(DEFAULTS.fixedCosts);
    setVariableCosts(DEFAULTS.variableCosts);
    setExpectedYieldKg(DEFAULTS.expectedYieldKg);
    setSellingPricePerKg(DEFAULTS.sellingPricePerKg);
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

  const isPositive = result ? result.expectedProfit >= 0 : true;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกต้นทุนและผลผลิตที่คาด
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับต้นทุนและแผนการขายจริงของคุณ
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="ต้นทุนคงที่"
            value={fixedCosts}
            onChange={setFixedCosts}
            suffix="บาท"
            step={500}
            hint="เช่น ค่าเช่าที่ดิน ค่าเสื่อมอุปกรณ์ ไม่เปลี่ยนตามผลผลิต"
          />
          <NumberField
            label="ต้นทุนผันแปร"
            value={variableCosts}
            onChange={setVariableCosts}
            suffix="บาท"
            step={500}
            hint="เช่น พันธุ์ ปุ๋ย ค่าแรง ที่เปลี่ยนตามปริมาณผลผลิต"
          />
          <NumberField
            label="ผลผลิตที่คาด"
            value={expectedYieldKg}
            onChange={setExpectedYieldKg}
            suffix="กก."
            step={100}
          />
          <NumberField
            label="ราคาขายที่คาด"
            value={sellingPricePerKg}
            onChange={setSellingPricePerKg}
            suffix="บาท/กก."
            step={1}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณจุดคุ้มทุน
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณจุดคุ้มทุน&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">กำไรคาดการณ์</p>
              <div
                className={`mt-2 font-display text-4xl font-bold ${
                  isPositive ? "text-forest" : "text-coral"
                }`}
              >
                {baht(result.expectedProfit)} บาท
              </div>
              <p className="mt-1 text-sm text-stone">
                ต้นทุนรวม {baht(result.totalCost)} บาท · รายได้คาด {baht(result.expectedRevenue)} บาท
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ต้นทุนรวม" value={`${baht(result.totalCost)} บาท`} />
                    <Row label="ราคาคุ้มทุนต่อ กก." value={`${numOrDash(result.breakEvenPricePerKg)} บาท/กก.`} strong />
                    <Row label="ผลผลิตคุ้มทุน" value={`${numOrDash(result.breakEvenYieldKg)} กก.`} strong />
                    <Row label="รายได้คาด" value={`${baht(result.expectedRevenue)} บาท`} />
                    <Row label="กำไรคาด" value={`${baht(result.expectedProfit)} บาท`} strong />
                    <Row label="ROI" value={result.roiPct === null ? "-" : `${num(result.roiPct)}%`} />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>ต้นทุนรวม = ต้นทุนคงที่ + ต้นทุนผันแปร</li>
                  <li>ราคาคุ้มทุนต่อ กก. = ต้นทุนรวม ÷ ผลผลิตที่คาด</li>
                  <li>ผลผลิตคุ้มทุน = ต้นทุนรวม ÷ ราคาขายที่คาด</li>
                  <li>รายได้คาด = ผลผลิตที่คาด × ราคาขายที่คาด</li>
                  <li>กำไรคาด = รายได้คาด − ต้นทุนรวม</li>
                  <li>ROI (%) = (กำไรคาด ÷ ต้นทุนรวม) × 100</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์ทั้งหมดเป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น
              ไม่ใช่การรับประกันผลตอบแทน โปรดตรวจสอบกับต้นทุนจริงและสภาพตลาดก่อนตัดสินใจ
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <Link
                  href="/tools/farm-income-calculator"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, {
                      tool: TOOL_SLUG,
                      target: "/tools/farm-income-calculator",
                    })
                  }
                >
                  คำนวณรายได้-กำไรฟาร์ม
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
