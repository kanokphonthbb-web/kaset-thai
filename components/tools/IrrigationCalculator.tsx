"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeIrrigation, type IrrigationInput, type IrrigationResult } from "@/lib/calc/irrigation";

type N = number | "";

const TOOL_SLUG = "irrigation-calculator";

const DEFAULTS = {
  plants: 100 as N,
  emittersPerPlant: 1 as N,
  litersPerHourPerEmitter: 4 as N,
  hoursPerCycle: 1 as N,
  cyclesPerDay: 1 as N,
  daysPerMonth: 30 as N,
  waterCostPerCubicM: "" as N,
};

function buildSummaryText(r: IrrigationResult, flowLPerHour: number): string {
  return [
    "คำนวณปริมาณน้ำระบบน้ำหยด/สปริงเกอร์",
    `ลิตร/รอบ: ${num(r.litersPerCycle)} ลิตร`,
    `ลิตร/วัน: ${num(r.litersPerDay)} ลิตร`,
    `ลบ.ม./วัน: ${num(r.cubicMPerDay)} ลบ.ม.`,
    `ลบ.ม./เดือน: ${num(r.cubicMPerMonth)} ลบ.ม.`,
    r.monthlyWaterCost === null ? "ค่าน้ำ/เดือน: -" : `ค่าน้ำ/เดือน: ${baht(r.monthlyWaterCost)} บาท`,
    `อัตราไหลรวมของระบบ: ${num(flowLPerHour)} ลิตร/ชั่วโมง`,
  ].join("\n");
}

export default function IrrigationCalculator() {
  const [plants, setPlants] = useState<N>(DEFAULTS.plants);
  const [emittersPerPlant, setEmittersPerPlant] = useState<N>(DEFAULTS.emittersPerPlant);
  const [litersPerHourPerEmitter, setLitersPerHourPerEmitter] = useState<N>(DEFAULTS.litersPerHourPerEmitter);
  const [hoursPerCycle, setHoursPerCycle] = useState<N>(DEFAULTS.hoursPerCycle);
  const [cyclesPerDay, setCyclesPerDay] = useState<N>(DEFAULTS.cyclesPerDay);
  const [daysPerMonth, setDaysPerMonth] = useState<N>(DEFAULTS.daysPerMonth);
  const [waterCostPerCubicM, setWaterCostPerCubicM] = useState<N>(DEFAULTS.waterCostPerCubicM);

  const [result, setResult] = useState<IrrigationResult | null>(null);
  const [flowLPerHour, setFlowLPerHour] = useState(0);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.monthlyWaterCost === null ? "ok_no_cost" : "ok_with_cost",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const costInput = val(waterCostPerCubicM);
    const input: IrrigationInput = {
      plants: val(plants),
      emittersPerPlant: val(emittersPerPlant),
      litersPerHourPerEmitter: val(litersPerHourPerEmitter),
      hoursPerCycle: val(hoursPerCycle),
      cyclesPerDay: val(cyclesPerDay),
      daysPerMonth: val(daysPerMonth),
      ...(waterCostPerCubicM !== "" ? { waterCostPerCubicM: costInput } : {}),
    };
    setCopyStatus("idle");
    setFlowLPerHour(val(plants) * val(emittersPerPlant) * val(litersPerHourPerEmitter));
    setResult(computeIrrigation(input));
  }

  function handleReset() {
    setPlants(DEFAULTS.plants);
    setEmittersPerPlant(DEFAULTS.emittersPerPlant);
    setLitersPerHourPerEmitter(DEFAULTS.litersPerHourPerEmitter);
    setHoursPerCycle(DEFAULTS.hoursPerCycle);
    setCyclesPerDay(DEFAULTS.cyclesPerDay);
    setDaysPerMonth(DEFAULTS.daysPerMonth);
    setWaterCostPerCubicM(DEFAULTS.waterCostPerCubicM);
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
    const text = buildSummaryText(result, flowLPerHour);
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
        <h2 className="font-display text-xl font-bold text-ink">กรอกข้อมูลระบบน้ำหยด/สปริงเกอร์</h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับระบบและแปลงจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="จำนวนต้น" value={plants} onChange={setPlants} suffix="ต้น" step={10} />
          <NumberField
            label="หัวจ่ายต่อต้น"
            value={emittersPerPlant}
            onChange={setEmittersPerPlant}
            suffix="หัว/ต้น"
            step={1}
          />
          <NumberField
            label="อัตราไหลต่อหัวจ่าย"
            value={litersPerHourPerEmitter}
            onChange={setLitersPerHourPerEmitter}
            suffix="ลิตร/ชม."
            step={0.5}
          />
          <NumberField label="ชั่วโมงต่อรอบ" value={hoursPerCycle} onChange={setHoursPerCycle} suffix="ชม./รอบ" step={0.5} />
          <NumberField label="จำนวนรอบต่อวัน" value={cyclesPerDay} onChange={setCyclesPerDay} suffix="รอบ/วัน" step={1} />
          <NumberField label="จำนวนวันที่รดต่อเดือน" value={daysPerMonth} onChange={setDaysPerMonth} suffix="วัน/เดือน" step={1} />
          <NumberField
            label="ราคาน้ำ (ถ้ามี)"
            value={waterCostPerCubicM}
            onChange={setWaterCostPerCubicM}
            suffix="บาท/ลบ.ม."
            step={1}
            hint="เว้นว่างได้หากไม่ต้องการคำนวณค่าน้ำ"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณปริมาณน้ำ
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณปริมาณน้ำ&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ปริมาณน้ำต่อวัน</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">{num(result.cubicMPerDay)} ลบ.ม.</div>
              <p className="mt-1 text-sm text-stone">
                {num(result.litersPerDay)} ลิตร/วัน · {num(result.cubicMPerMonth)} ลบ.ม./เดือน
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ลิตร/รอบ" value={`${num(result.litersPerCycle)} ลิตร`} />
                    <Row label="ลิตร/วัน" value={`${num(result.litersPerDay)} ลิตร`} strong />
                    <Row label="ลบ.ม./วัน" value={`${num(result.cubicMPerDay)} ลบ.ม.`} strong />
                    <Row label="ลบ.ม./เดือน" value={`${num(result.cubicMPerMonth)} ลบ.ม.`} strong />
                    <Row
                      label="ค่าน้ำ/เดือน"
                      value={result.monthlyWaterCost === null ? "-" : `${baht(result.monthlyWaterCost)} บาท`}
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">อัตราไหลรวมของระบบ (สำหรับเลือกขนาดปั๊ม)</p>
                <p className="mt-2 text-sm text-ink">{num(flowLPerHour)} ลิตร/ชั่วโมง</p>
                <p className="mt-1 text-xs text-stone">
                  อัตราไหลรวม = จำนวนต้น × หัวจ่ายต่อต้น × อัตราไหลต่อหัวจ่าย นำตัวเลขนี้ไปใช้ต่อที่{" "}
                  <Link
                    href="/tools/pump-size-calculator"
                    className="underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  >
                    เครื่องมือคำนวณขนาดปั๊มน้ำ
                  </Link>{" "}
                  ได้เลย
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์เป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น แรงดันน้ำ การอุดตัน และความสูญเสียในระบบจริงอาจทำให้ปริมาณน้ำจริงต่างจากนี้
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/land-area-converter", label: "แปลงหน่วยพื้นที่ ไร่ งาน ตารางวา" },
                  { href: "/tools/plant-spacing-calculator", label: "คำนวณจำนวนต้นที่ปลูกได้" },
                  { href: "/tools/fertilizer-calculator", label: "คำนวณปุ๋ยต่อไร่" },
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
