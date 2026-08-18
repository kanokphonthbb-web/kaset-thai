"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { thaiCompositeToSqm, convertArea } from "@/lib/landArea";
import { computePlantCount, type PlantSpacingInput, type PlantSpacingResult } from "@/lib/calc/plantSpacing";

type N = number | "";

const TOOL_SLUG = "plant-spacing-calculator";

const DEFAULTS = {
  rai: 1 as N,
  ngan: 0 as N,
  sqwah: 0 as N,
  rowSpacingM: 1 as N,
  plantSpacingM: 1 as N,
  usablePct: 100 as N,
};

function buildSummaryText(r: PlantSpacingResult): string {
  return [
    "คำนวณจำนวนต้นจากระยะปลูก",
    `พื้นที่ใช้ปลูกได้จริง: ${num(r.usableAreaSqm)} ตารางเมตร`,
    `พื้นที่ต่อต้น: ${num(r.areaPerPlantSqm)} ตารางเมตร/ต้น`,
    r.plantCount === null
      ? "จำนวนต้นโดยประมาณ: คำนวณไม่ได้ (ระยะปลูกต้องมากกว่า 0)"
      : `จำนวนต้นโดยประมาณ: ${num(r.plantCount)} ต้น`,
    r.plantsPerRai === null ? "ต้นต่อไร่: -" : `ต้นต่อไร่: ${num(r.plantsPerRai)} ต้น/ไร่`,
    "* เป็นการประมาณการทางเรขาคณิตเท่านั้น ไม่ได้คำนึงถึงระยะปลูกที่เหมาะสมต่อชนิดพืช",
  ].join("\n");
}

export default function PlantSpacingCalculator() {
  const [rai, setRai] = useState<N>(DEFAULTS.rai);
  const [ngan, setNgan] = useState<N>(DEFAULTS.ngan);
  const [sqwah, setSqwah] = useState<N>(DEFAULTS.sqwah);
  const [rowSpacingM, setRowSpacingM] = useState<N>(DEFAULTS.rowSpacingM);
  const [plantSpacingM, setPlantSpacingM] = useState<N>(DEFAULTS.plantSpacingM);
  const [usablePct, setUsablePct] = useState<N>(DEFAULTS.usablePct);

  const [result, setResult] = useState<PlantSpacingResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.plantCount === null ? "invalid_spacing" : "ok",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: PlantSpacingInput = {
      areaSqm: thaiCompositeToSqm(val(rai), val(ngan), val(sqwah)),
      rowSpacingM: val(rowSpacingM),
      plantSpacingM: val(plantSpacingM),
      usablePct: val(usablePct),
    };
    setCopyStatus("idle");
    setResult(computePlantCount(input));
  }

  function handleReset() {
    setRai(DEFAULTS.rai);
    setNgan(DEFAULTS.ngan);
    setSqwah(DEFAULTS.sqwah);
    setRowSpacingM(DEFAULTS.rowSpacingM);
    setPlantSpacingM(DEFAULTS.plantSpacingM);
    setUsablePct(DEFAULTS.usablePct);
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
        <h2 className="font-display text-xl font-bold text-ink">กรอกพื้นที่และระยะปลูก</h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับแปลงและระยะปลูกจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <p className="mt-6 text-sm font-semibold text-ink">พื้นที่ปลูก</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <NumberField label="ไร่" value={rai} onChange={setRai} step={1} />
          <NumberField label="งาน" value={ngan} onChange={setNgan} step={1} />
          <NumberField label="ตารางวา" value={sqwah} onChange={setSqwah} step={1} />
        </div>

        <p className="mt-6 text-sm font-semibold text-ink">ระยะปลูก</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="ระยะระหว่างแถว"
            value={rowSpacingM}
            onChange={setRowSpacingM}
            suffix="เมตร"
            step={0.5}
          />
          <NumberField
            label="ระยะระหว่างต้น"
            value={plantSpacingM}
            onChange={setPlantSpacingM}
            suffix="เมตร"
            step={0.5}
          />
          <NumberField
            label="% พื้นที่ใช้ปลูกได้จริง"
            value={usablePct}
            onChange={setUsablePct}
            suffix="%"
            step={5}
            hint="หักทางเดิน คันดิน หรือพื้นที่ที่ปลูกไม่ได้ ค่าเริ่มต้น 100%"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณจำนวนต้น
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณจำนวนต้น&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && result.plantCount === null && (
          <div className="rounded-2xl bg-mist p-6">
            <p className="eyebrow">ไม่สามารถคำนวณได้</p>
            <p className="mt-2 text-sm text-ink">ระยะระหว่างแถวและระยะระหว่างต้นต้องมากกว่า 0</p>
          </div>
        )}

        {result && result.plantCount !== null && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">จำนวนต้นโดยประมาณ</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">{num(result.plantCount)} ต้น</div>
              <p className="mt-1 text-sm text-stone">
                {result.plantsPerRai !== null && `${num(result.plantsPerRai)} ต้น/ไร่ · `}
                พื้นที่ใช้ปลูกได้จริง {num(result.usableAreaSqm)} ตารางเมตร
                {" "}({num(convertArea(result.usableAreaSqm, "sqm", "rai"))} ไร่)
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="พื้นที่ใช้ปลูกได้จริง" value={`${num(result.usableAreaSqm)} ตร.ม.`} />
                    <Row label="พื้นที่ต่อต้น" value={`${num(result.areaPerPlantSqm)} ตร.ม./ต้น`} />
                    <Row label="จำนวนต้นโดยประมาณ" value={`${num(result.plantCount)} ต้น`} strong />
                    <Row
                      label="ต้นต่อไร่"
                      value={result.plantsPerRai === null ? "-" : `${num(result.plantsPerRai)} ต้น/ไร่`}
                      strong
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>พื้นที่ใช้ปลูกได้จริง = พื้นที่ทั้งหมด × % ใช้ได้</li>
                  <li>พื้นที่ต่อต้น = ระยะระหว่างแถว × ระยะระหว่างต้น</li>
                  <li>จำนวนต้น = พื้นที่ใช้ปลูกได้จริง ÷ พื้นที่ต่อต้น (ปัดลง)</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * เป็นการประมาณการทางเรขาคณิตจากพื้นที่และระยะปลูกที่ป้อนเท่านั้น ไม่ได้คำนึงถึงระยะปลูกที่เหมาะสมกับพืชแต่ละชนิด
              โปรดตรวจสอบระยะปลูกที่แนะนำสำหรับพืชของคุณก่อนตัดสินใจ
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/land-area-converter", label: "แปลงหน่วยพื้นที่ ไร่ งาน ตารางวา" },
                  { href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยที่ต้องใช้ต่อพื้นที่" },
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
      <td className={strong ? "font-display font-bold text-ink" : "font-semibold text-ink"}>{value}</td>
    </tr>
  );
}
