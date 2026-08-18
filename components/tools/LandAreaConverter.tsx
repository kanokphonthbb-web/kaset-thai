"use client";

import { useEffect, useMemo, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  AREA_UNIT_LABEL_TH,
  convertArea,
  thaiCompositeToSqm,
  formatThaiArea,
  type AreaUnit,
} from "@/lib/landArea";

type N = number | "";
type Mode = "single" | "composite";

const TOOL_SLUG = "land-area-converter";
const DEBOUNCE_MS = 400;

const UNIT_ORDER: AreaUnit[] = ["rai", "ngan", "sqwah", "sqm", "hectare", "acre"];

const SINGLE_DEFAULTS = { value: 1 as N, fromUnit: "rai" as AreaUnit };
const COMPOSITE_DEFAULTS = { rai: 1 as N, ngan: 0 as N, sqwah: 0 as N };

function buildSummaryText(totalSqm: number): string {
  const lines = ["แปลงหน่วยพื้นที่", `พื้นที่รวม (แบบไทย): ${formatThaiArea(totalSqm)}`];
  for (const unit of UNIT_ORDER) {
    lines.push(`${AREA_UNIT_LABEL_TH[unit]}: ${num(convertArea(totalSqm, "sqm", unit))}`);
  }
  return lines.join("\n");
}

export default function LandAreaConverter() {
  const [mode, setMode] = useState<Mode>("single");

  const [value, setValue] = useState<N>(SINGLE_DEFAULTS.value);
  const [fromUnit, setFromUnit] = useState<AreaUnit>(SINGLE_DEFAULTS.fromUnit);

  const [raiVal, setRaiVal] = useState<N>(COMPOSITE_DEFAULTS.rai);
  const [nganVal, setNganVal] = useState<N>(COMPOSITE_DEFAULTS.ngan);
  const [sqwahVal, setSqwahVal] = useState<N>(COMPOSITE_DEFAULTS.sqwah);

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  const totalSqm = useMemo(() => {
    if (mode === "single") {
      return convertArea(val(value), fromUnit, "sqm");
    }
    return thaiCompositeToSqm(val(raiVal), val(nganVal), val(sqwahVal));
  }, [mode, value, fromUnit, raiVal, nganVal, sqwahVal]);

  // Debounced tool_result — fires after the user pauses typing/changing
  // inputs, instead of on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      track(TOOL_EVENTS.tool_result, { tool: TOOL_SLUG, result_group: "ok", mode });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [mode, value, fromUnit, raiVal, nganVal, sqwahVal]);

  function handleReset() {
    setMode("single");
    setValue(SINGLE_DEFAULTS.value);
    setFromUnit(SINGLE_DEFAULTS.fromUnit);
    setRaiVal(COMPOSITE_DEFAULTS.rai);
    setNganVal(COMPOSITE_DEFAULTS.ngan);
    setSqwahVal(COMPOSITE_DEFAULTS.sqwah);
    setCopyStatus("idle");
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
    window.print();
  }

  async function handleCopy() {
    track(TOOL_EVENTS.tool_export, { tool: TOOL_SLUG });
    const text = buildSummaryText(totalSqm);
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
        <h2 className="font-display text-xl font-bold text-ink">กรอกพื้นที่ที่ต้องการแปลง</h2>
        <p className="mt-1 text-sm text-stone">ผลลัพธ์จะอัปเดตทันทีเมื่อเปลี่ยนค่า ไม่ต้องกดคำนวณ</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={mode === "single" ? "btn-primary" : "btn-secondary"}
          >
            แปลงหน่วยเดียว
          </button>
          <button
            type="button"
            onClick={() => setMode("composite")}
            className={mode === "composite" ? "btn-primary" : "btn-secondary"}
          >
            รวมพื้นที่ไทย (ไร่-งาน-ตารางวา)
          </button>
        </div>

        {mode === "single" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberField label="จำนวน" value={value} onChange={setValue} step={1} />
            <label className="block">
              <span className="text-sm font-semibold text-ink">หน่วย</span>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as AreaUnit)}
                className="mt-1.5 min-h-[48px] w-full rounded-full bg-paper px-4 text-base text-ink ring-1 ring-ash focus:outline-none focus:ring-2 focus:ring-ink"
              >
                {UNIT_ORDER.map((u) => (
                  <option key={u} value={u}>
                    {AREA_UNIT_LABEL_TH[u]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {mode === "composite" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <NumberField label="ไร่" value={raiVal} onChange={setRaiVal} step={1} />
            <NumberField label="งาน" value={nganVal} onChange={setNganVal} step={1} hint="1 ไร่ = 4 งาน" />
            <NumberField label="ตารางวา" value={sqwahVal} onChange={setSqwahVal} step={1} hint="1 งาน = 100 ตารางวา" />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleReset} className="btn-secondary no-print">
            ล้างค่า
          </button>
        </div>
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-mist p-6">
          <p className="eyebrow">พื้นที่รวม</p>
          <div className="mt-2 font-display text-4xl font-bold text-ink">{formatThaiArea(totalSqm)}</div>
          <p className="mt-1 text-sm text-stone">{num(totalSqm)} ตารางเมตร</p>

          <div className="cc-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>หน่วย</th>
                  <th>ค่าที่แปลงได้</th>
                </tr>
              </thead>
              <tbody>
                {UNIT_ORDER.map((u) => (
                  <tr key={u}>
                    <td className="text-stone">{AREA_UNIT_LABEL_TH[u]}</td>
                    <td className="font-semibold text-ink">{num(convertArea(totalSqm, "sqm", u))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cc-tip">
            <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
              <li>1 ไร่ = 4 งาน = 400 ตารางวา = 1,600 ตารางเมตร</li>
              <li>1 งาน = 100 ตารางวา = 400 ตารางเมตร</li>
              <li>1 ตารางวา = 4 ตารางเมตร</li>
              <li>1 เฮกตาร์ = 10,000 ตารางเมตร, 1 เอเคอร์ = 4,046.8564224 ตารางเมตร</li>
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
          <RelatedToolLinks
            tool={TOOL_SLUG}
            links={[
              { href: "/tools/plant-spacing-calculator", label: "คำนวณจำนวนต้นที่ปลูกได้จากพื้นที่นี้" },
              { href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยที่ต้องใช้ต่อพื้นที่นี้" },
              { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืชต่อไร่" },
            ]}
          />
        </div>

        <div className="no-print mt-4 flex flex-col gap-2">
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
      </aside>
    </div>
  );
}
