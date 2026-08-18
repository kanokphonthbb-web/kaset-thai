"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeFcr, type FcrInput, type FcrResult } from "@/lib/calc/fcr";

type N = number | "";

const TOOL_SLUG = "fcr-calculator";

const DEFAULTS = {
  feedConsumedKg: 150,
  startWeightKg: 100,
  endWeightKg: 200,
};

function numOrDash(n: number | null): string {
  return n === null ? "-" : num(n);
}

function buildSummaryText(r: FcrResult): string {
  return [
    "คำนวณ FCR (อัตราแลกเนื้อ)",
    `น้ำหนักที่เพิ่ม: ${num(r.weightGainKg)} กก.`,
    `FCR: ${numOrDash(r.fcr)}`,
    `ต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม: ${r.feedCostPerKgGain === null ? "-" : `${num(r.feedCostPerKgGain)} บาท`}`,
    "* เป็นการคำนวณจากข้อมูลที่ป้อนเท่านั้น ไม่ใช่ค่ามาตรฐานตามสายพันธุ์",
  ].join("\n");
}

export default function FcrCalculator() {
  const [feedConsumedKg, setFeedConsumedKg] = useState<N>(DEFAULTS.feedConsumedKg);
  const [startWeightKg, setStartWeightKg] = useState<N>(DEFAULTS.startWeightKg);
  const [endWeightKg, setEndWeightKg] = useState<N>(DEFAULTS.endWeightKg);
  const [feedCostTotal, setFeedCostTotal] = useState<N>("");

  const [result, setResult] = useState<FcrResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.fcr === null ? "no_gain" : "ok",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: FcrInput = {
      feedConsumedKg: val(feedConsumedKg),
      startWeightKg: val(startWeightKg),
      endWeightKg: val(endWeightKg),
      feedCostTotal: feedCostTotal === "" ? undefined : val(feedCostTotal),
    };
    setCopyStatus("idle");
    setResult(computeFcr(input));
  }

  function handleReset() {
    setFeedConsumedKg(DEFAULTS.feedConsumedKg);
    setStartWeightKg(DEFAULTS.startWeightKg);
    setEndWeightKg(DEFAULTS.endWeightKg);
    setFeedCostTotal("");
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกข้อมูลอาหารและน้ำหนัก
        </h2>
        <p className="mt-1 text-sm text-stone">
          ใช้ได้กับปลา ไก่ สุกร หรือสัตว์เลี้ยงชนิดอื่นที่บันทึกน้ำหนักเป็นช่วงเวลาได้
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="อาหารที่ใช้ทั้งหมด"
            value={feedConsumedKg}
            onChange={setFeedConsumedKg}
            suffix="กก."
            step={10}
          />
          <NumberField
            label="น้ำหนักเริ่มต้น"
            value={startWeightKg}
            onChange={setStartWeightKg}
            suffix="กก."
            step={10}
          />
          <NumberField
            label="น้ำหนักสุดท้าย"
            value={endWeightKg}
            onChange={setEndWeightKg}
            suffix="กก."
            step={10}
          />
          <NumberField
            label="ค่าอาหารรวม (ไม่บังคับ)"
            value={feedCostTotal}
            onChange={setFeedCostTotal}
            suffix="บาท"
            step={100}
            hint="กรอกถ้าต้องการดูต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณ FCR
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณ FCR&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && result.fcr === null && (
          <div className="rounded-2xl bg-mist p-6">
            <p className="eyebrow">ไม่สามารถคำนวณ FCR ได้</p>
            <p className="mt-2 text-sm text-ink">
              น้ำหนักที่เพิ่มต้องมากกว่า 0 กรุณาตรวจสอบน้ำหนักเริ่มต้นและน้ำหนักสุดท้ายอีกครั้ง
              (น้ำหนักที่เพิ่มขณะนี้: {num(result.weightGainKg)} กก.)
            </p>
          </div>
        )}

        {result && result.fcr !== null && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">FCR (อัตราแลกเนื้อ)</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {num(result.fcr)}
              </div>
              <p className="mt-1 text-sm text-stone">
                น้ำหนักที่เพิ่ม {num(result.weightGainKg)} กก. · ยิ่งค่าน้อยยิ่งประหยัดอาหาร
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="น้ำหนักที่เพิ่ม" value={`${num(result.weightGainKg)} กก.`} />
                    <Row label="FCR" value={num(result.fcr)} strong />
                    {result.feedCostPerKgGain !== null && (
                      <Row
                        label="ต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม"
                        value={`${num(result.feedCostPerKgGain)} บาท`}
                        strong
                      />
                    )}
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>น้ำหนักที่เพิ่ม = น้ำหนักสุดท้าย − น้ำหนักเริ่มต้น</li>
                  <li>FCR = อาหารที่ใช้ทั้งหมด (กก.) ÷ น้ำหนักที่เพิ่ม (กก.)</li>
                  <li>ต้นทุนอาหารต่อ กก. น้ำหนักที่เพิ่ม = ค่าอาหารรวม ÷ น้ำหนักที่เพิ่ม (เมื่อกรอกค่าอาหาร)</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ค่าอ้างอิง FCR ที่ดีแตกต่างกันตามชนิดสัตว์ สายพันธุ์ และสูตรอาหาร
              โปรดดูเอกสารของกรมปศุสัตว์หรือกรมประมงประกอบการประเมิน
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <Link
                  href="/tools/animal-cost"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, {
                      tool: TOOL_SLUG,
                      target: "/tools/animal-cost",
                    })
                  }
                >
                  คำนวณต้นทุนเลี้ยงสัตว์
                </Link>
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
