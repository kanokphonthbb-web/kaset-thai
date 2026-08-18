"use client";

import { useEffect, useState } from "react";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  compareFertilizers,
  type FertilizerCompareItem,
  type FertilizerCompareResult,
} from "@/lib/calc/fertilizerCompare";

type N = number | "";

type Row = {
  id: number;
  name: string;
  n: N;
  p: N;
  k: N;
  bagWeightKg: N;
  bagPrice: N;
};

const TOOL_SLUG = "fertilizer-cost-comparison";
const MIN_ROWS = 2;
const MAX_ROWS = 5;

let nextId = 0;
function makeRow(defaults: Partial<Omit<Row, "id">> = {}): Row {
  nextId += 1;
  return {
    id: nextId,
    name: defaults.name ?? "",
    n: defaults.n ?? "",
    p: defaults.p ?? "",
    k: defaults.k ?? "",
    bagWeightKg: defaults.bagWeightKg ?? "",
    bagPrice: defaults.bagPrice ?? "",
  };
}

function defaultRows(): Row[] {
  return [
    makeRow({ name: "สูตร 16-16-16", n: 16, p: 16, k: 16, bagWeightKg: 50, bagPrice: 950 }),
    makeRow({ name: "สูตร 46-0-0", n: 46, p: 0, k: 0, bagWeightKg: 50, bagPrice: 750 }),
  ];
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function costOrDash(n: number | null): string {
  return n === null ? "-" : `${baht(n)} บาท`;
}

function buildSummaryText(results: FertilizerCompareResult[]): string {
  const lines = ["เปรียบเทียบต้นทุนธาตุอาหารปุ๋ย"];
  for (const r of results) {
    lines.push(
      `${r.name}: ${costOrDash(r.costPerKgFertilizer)}/กก.ปุ๋ย · N ${costOrDash(
        r.costPerKgN,
      )}/กก. · P₂O₅ ${costOrDash(r.costPerKgP2O5)}/กก. · K₂O ${costOrDash(r.costPerKgK2O)}/กก.`,
    );
  }
  lines.push("* เปรียบเทียบต้นทุนต่อธาตุอาหารเท่านั้น ไม่ได้ตัดสินว่าสูตรไหน \"ดีกว่า\"");
  return lines.join("\n");
}

export default function FertilizerCostComparison() {
  const [rows, setRows] = useState<Row[]>(() => defaultRows());
  const [results, setResults] = useState<FertilizerCompareResult[] | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!results) return;
    track(TOOL_EVENTS.tool_result, { tool: TOOL_SLUG, result_group: `rows_${results.length}` });
  }, [results]);

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_ROWS ? prev : [...prev, makeRow()]));
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length <= MIN_ROWS ? prev : prev.filter((r) => r.id !== id)));
  }

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const items: FertilizerCompareItem[] = rows.map((r, i) => ({
      name: r.name.trim() || `ปุ๋ยที่ ${i + 1}`,
      n: clampPct(val(r.n)),
      p: clampPct(val(r.p)),
      k: clampPct(val(r.k)),
      bagWeightKg: val(r.bagWeightKg),
      bagPrice: val(r.bagPrice),
    }));
    setCopyStatus("idle");
    setResults(compareFertilizers(items));
  }

  function handleReset() {
    setRows(defaultRows());
    setResults(null);
    setCopyStatus("idle");
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
    window.print();
  }

  async function handleCopy() {
    if (!results) return;
    track(TOOL_EVENTS.tool_export, { tool: TOOL_SLUG });
    const text = buildSummaryText(results);
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
    <div>
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">กรอกข้อมูลปุ๋ยที่ต้องการเปรียบเทียบ</h2>
        <p className="mt-1 text-sm text-stone">
          เพิ่มได้สูงสุด {MAX_ROWS} รายการ ({MIN_ROWS}-{MAX_ROWS} รายการ) สัดส่วน N-P-K กรอกเป็นเปอร์เซ็นต์ (0-100)
        </p>

        <div className="mt-6 flex flex-col gap-6">
          {rows.map((r, i) => (
            <div key={r.id} className="rounded-2xl bg-paper p-5 ring-1 ring-ash">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">รายการที่ {i + 1}</span>
                {rows.length > MIN_ROWS && (
                  <button
                    type="button"
                    onClick={() => removeRow(r.id)}
                    className="btn-secondary min-h-0 px-3 py-1 text-sm no-print"
                  >
                    ลบ
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="ชื่อ/สูตรปุ๋ย"
                  value={r.name}
                  onChange={(v) => updateRow(r.id, { name: v })}
                  placeholder="เช่น 16-16-16"
                />
                <PctField label="N (ไนโตรเจน)" value={r.n} onChange={(v) => updateRow(r.id, { n: v })} />
                <PctField label="P (ฟอสฟอรัส เทียบเป็น P₂O₅)" value={r.p} onChange={(v) => updateRow(r.id, { p: v })} />
                <PctField label="K (โพแทสเซียม เทียบเป็น K₂O)" value={r.k} onChange={(v) => updateRow(r.id, { k: v })} />
                <NumField
                  label="น้ำหนักถุง"
                  suffix="กก."
                  value={r.bagWeightKg}
                  onChange={(v) => updateRow(r.id, { bagWeightKg: v })}
                />
                <NumField
                  label="ราคาถุง"
                  suffix="บาท"
                  value={r.bagPrice}
                  onChange={(v) => updateRow(r.id, { bagPrice: v })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {rows.length < MAX_ROWS && (
            <button type="button" onClick={addRow} className="btn-secondary no-print">
              + เพิ่มรายการ
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            เปรียบเทียบต้นทุน
          </button>
          <button onClick={handleReset} className="btn-secondary no-print">
            ล้างค่า
          </button>
        </div>
      </div>

      {results && (
        <div className="mt-8 rounded-2xl bg-mist p-6 sm:p-8">
          <p className="eyebrow">ผลเปรียบเทียบต้นทุนต่อธาตุอาหาร</p>
          <div className="cc-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ชื่อ/สูตร</th>
                  <th>บาท/กก.ปุ๋ย</th>
                  <th>บาท/กก. N</th>
                  <th>บาท/กก. P₂O₅</th>
                  <th>บาท/กก. K₂O</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-ink">{r.name}</td>
                    <td>{costOrDash(r.costPerKgFertilizer)}</td>
                    <td>{costOrDash(r.costPerKgN)}</td>
                    <td>{costOrDash(r.costPerKgP2O5)}</td>
                    <td>{costOrDash(r.costPerKgK2O)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cc-tip">
            <p className="cc-tip-title">อ่านผลลัพธ์อย่างไร</p>
            <p className="mt-2 text-sm text-ink/90">
              ตารางนี้เปรียบเทียบ <strong>ต้นทุนต่อธาตุอาหารเท่านั้น</strong> ไม่ได้ตัดสินว่าสูตรไหน &quot;ดีกว่า&quot;
              เพราะพืชแต่ละชนิดและแต่ละช่วงการเจริญเติบโตต้องการสัดส่วนธาตุอาหารต่างกัน
              ควรเลือกสูตรปุ๋ยตามความต้องการของพืชก่อน แล้วจึงใช้ตัวเลขนี้เปรียบเทียบความคุ้มค่าระหว่างยี่ห้อที่ให้ธาตุอาหารใกล้เคียงกัน
            </p>
          </div>

          <p className="mt-3 text-xs text-stone">
            * ผลลัพธ์เป็นการคำนวณจากข้อมูลที่คุณป้อนเท่านั้น ค่า &quot;-&quot; หมายถึงคำนวณไม่ได้ (เช่น สัดส่วนธาตุนั้นเป็น 0% หรือไม่ได้กรอกน้ำหนักถุง)
          </p>

          <div className="mt-4">
            <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
            <RelatedToolLinks
              tool={TOOL_SLUG}
              links={[{ href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยต่อไร่" }]}
            />
          </div>

          <div className="no-print mt-4 flex flex-col gap-2 sm:max-w-xs">
            <button onClick={handlePrint} className="btn-secondary w-full">
              🖨️ พิมพ์ / บันทึก PDF
            </button>
            <button onClick={handleCopy} className="btn-secondary w-full">
              📋 คัดลอกผลลัพธ์
            </button>
            {copyStatus === "copied" && <p className="text-center text-xs text-stone">คัดลอกผลลัพธ์แล้ว</p>}
            {copyStatus === "unavailable" && (
              <p className="text-center text-xs text-stone">
                อุปกรณ์นี้ไม่รองรับการคัดลอกอัตโนมัติ กรุณาคัดลอกข้อความด้วยตนเอง
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
        />
      </div>
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: N;
  onChange: (v: N) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
        />
        {suffix && <span className="whitespace-nowrap px-4 text-sm text-stone">{suffix}</span>}
      </div>
    </label>
  );
}

function PctField({ label, value, onChange }: { label: string; value: N; onChange: (v: N) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
        />
        <span className="whitespace-nowrap px-4 text-sm text-stone">%</span>
      </div>
    </label>
  );
}
