"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeRequiredFlow, type RequiredFlowInput, type RequiredFlowResult } from "@/lib/calc/pumpFlow";

type N = number | "";

const TOOL_SLUG = "pump-size-calculator";

const DEFAULTS = {
  totalLitersPerCycle: 2000 as N,
  operatingHours: 2 as N,
};

function buildSummaryText(r: RequiredFlowResult): string {
  return [
    "คำนวณอัตราการไหลปั๊มน้ำเกษตร",
    `อัตราการไหลขั้นต่ำ: ${num(r.litersPerHour)} ลิตร/ชั่วโมง`,
    `เท่ากับ: ${num(r.cubicMPerHour)} ลบ.ม./ชั่วโมง`,
    "* นี่คือ flow ขั้นต่ำเท่านั้น การเลือกปั๊มจริงต้องคิด Total Dynamic Head (ความสูงยก + ความเสียดทานท่อ) เพิ่มเติม",
  ].join("\n");
}

export default function PumpSizeCalculator() {
  const [totalLitersPerCycle, setTotalLitersPerCycle] = useState<N>(DEFAULTS.totalLitersPerCycle);
  const [operatingHours, setOperatingHours] = useState<N>(DEFAULTS.operatingHours);

  const [result, setResult] = useState<RequiredFlowResult | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, { tool: TOOL_SLUG, result_group: "ok" });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: RequiredFlowInput = {
      totalLitersPerCycle: val(totalLitersPerCycle),
      operatingHours: val(operatingHours),
    };
    setCopyStatus("idle");
    setAttempted(true);
    setResult(computeRequiredFlow(input));
  }

  function handleReset() {
    setTotalLitersPerCycle(DEFAULTS.totalLitersPerCycle);
    setOperatingHours(DEFAULTS.operatingHours);
    setResult(null);
    setAttempted(false);
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
          กรอกน้ำที่ต้องจ่ายต่อรอบและเวลาทำงาน
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับระบบน้ำจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="น้ำที่ต้องจ่ายต่อรอบ"
            value={totalLitersPerCycle}
            onChange={setTotalLitersPerCycle}
            suffix="ลิตร"
            step={100}
            hint={
              "ได้จากเครื่องมือคำนวณน้ำ /tools/irrigation-calculator หากยังไม่ทราบตัวเลขนี้"
            }
          />
          <NumberField
            label="ชั่วโมงทำงานต่อรอบ"
            value={operatingHours}
            onChange={setOperatingHours}
            suffix="ชม./รอบ"
            step={0.5}
            hint="จำนวนชั่วโมงที่ต้องการเปิดปั๊มให้จ่ายน้ำครบตามที่ต้องการต่อรอบ"
          />
        </div>

        <p className="mt-3 text-sm text-stone">
          ยังไม่ทราบปริมาณน้ำที่ต้องใช้ต่อรอบ?{" "}
          <Link
            href="/tools/irrigation-calculator"
            className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
            onClick={() =>
              track(TOOL_EVENTS.related_tool_click, {
                tool: TOOL_SLUG,
                target: "/tools/irrigation-calculator",
              })
            }
          >
            ใช้เครื่องมือคำนวณน้ำก่อน
          </Link>
        </p>

        <div className="cc-tip">
          <p className="cc-tip-title">⚠️ นี่คืออัตราการไหลขั้นต่ำเท่านั้น</p>
          <p className="mt-2 text-sm text-ink/90">
            ตัวเลขที่ได้เป็นอัตราการไหลขั้นต่ำที่ปั๊มต้องทำได้เท่านั้น
            การเลือกปั๊มน้ำจริงต้องคิด <strong>Total Dynamic Head (TDH)</strong> เพิ่มเติมด้วย — ทั้งความสูงยกน้ำ
            (จากแหล่งน้ำถึงจุดใช้) และความเสียดทานในท่อ (ยาว/สั้น เล็ก/ใหญ่ ข้องอกี่จุด) เครื่องมือนี้ไม่ได้คำนวณ TDH ให้
            ควรปรึกษาร้านปั๊มน้ำหรือช่างเพื่อเลือกรุ่นที่เหมาะสมกับหน้างานจริง
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณอัตราการไหล
          </button>
          <button onClick={handleReset} className="btn-secondary no-print">
            ล้างค่า
          </button>
        </div>
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {!result && !attempted && (
          <div className="rounded-2xl bg-mist p-6 text-sm text-stone">
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณอัตราการไหล&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {!result && attempted && (
          <div className="rounded-2xl bg-mist p-6 text-sm text-coral">
            กรุณากรอกชั่วโมงทำงานต่อรอบให้มากกว่า 0 เพื่อคำนวณอัตราการไหล
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">อัตราการไหลขั้นต่ำที่ต้องการ</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {num(result.litersPerHour)} L/h
              </div>
              <p className="mt-1 text-sm text-stone">{num(result.cubicMPerHour)} m³/h</p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="อัตราการไหลขั้นต่ำ" value={`${num(result.litersPerHour)} L/h`} strong />
                    <Row label="เท่ากับ" value={`${num(result.cubicMPerHour)} m³/h`} />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">⚠️ ยังต้องคิด Total Dynamic Head (TDH)</p>
                <p className="mt-2 text-xs text-stone">
                  ตัวเลขนี้เป็น flow ขั้นต่ำเท่านั้น การเลือกปั๊มจริงต้องรวมความสูงยกน้ำและความเสียดทานท่อเข้าไปด้วย
                  ปรึกษาร้านปั๊มน้ำหรือช่างก่อนตัดสินใจซื้อ
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์เป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น ไม่ใช่คำแนะนำรุ่นหรือกำลัง (HP) ของปั๊มที่ต้องซื้อ
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/irrigation-calculator", label: "คำนวณน้ำ ระบบน้ำหยด/สปริงเกอร์" },
                  { href: "/tools/solar-pump-calculator", label: "ประเมินขนาดแผงโซลาร์สำหรับปั๊มน้ำ" },
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
