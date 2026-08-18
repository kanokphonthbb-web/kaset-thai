"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  computeSolarPumpEstimate,
  type SolarPumpEstimateInput,
  type SolarPumpEstimateResult,
} from "@/lib/calc/solarPump";

type N = number | "";

const TOOL_SLUG = "solar-pump-calculator";

const DEFAULTS = {
  pumpWatts: 750,
  hoursPerDay: 4,
  sunHoursPerDay: 4.5,
  systemLossPct: 30,
} satisfies SolarPumpEstimateInput;

function buildSummaryText(r: SolarPumpEstimateResult): string {
  return [
    "ประเมินขนาดแผงโซลาร์สำหรับปั๊มน้ำ",
    `พลังงาน/วัน: ${num(r.energyWhPerDay)} Wh`,
    `ขนาดแผงโดยประมาณ: ${r.requiredPanelWatts === null ? "-" : `${num(r.requiredPanelWatts)} วัตต์`}`,
    "* เป็นการประมาณเบื้องต้นเท่านั้น ไม่ใช่การออกแบบระบบไฟฟ้า ควรให้ช่างหรือวิศวกรตรวจสอบก่อนติดตั้งจริง",
  ].join("\n");
}

export default function SolarPumpCalculator() {
  const [pumpWatts, setPumpWatts] = useState<N>(DEFAULTS.pumpWatts);
  const [hoursPerDay, setHoursPerDay] = useState<N>(DEFAULTS.hoursPerDay);
  const [sunHoursPerDay, setSunHoursPerDay] = useState<N>(DEFAULTS.sunHoursPerDay);
  const [systemLossPct, setSystemLossPct] = useState<N>(DEFAULTS.systemLossPct);

  const [result, setResult] = useState<SolarPumpEstimateResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.requiredPanelWatts === null ? "no_sun_hours" : "ok",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: SolarPumpEstimateInput = {
      pumpWatts: val(pumpWatts),
      hoursPerDay: val(hoursPerDay),
      sunHoursPerDay: val(sunHoursPerDay),
      systemLossPct: val(systemLossPct),
    };
    setCopyStatus("idle");
    setResult(computeSolarPumpEstimate(input));
  }

  function handleReset() {
    setPumpWatts(DEFAULTS.pumpWatts);
    setHoursPerDay(DEFAULTS.hoursPerDay);
    setSunHoursPerDay(DEFAULTS.sunHoursPerDay);
    setSystemLossPct(DEFAULTS.systemLossPct);
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
          กรอกกำลังปั๊มและชั่วโมงใช้งาน
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับปั๊มและพื้นที่จริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="กำลังปั๊ม" value={pumpWatts} onChange={setPumpWatts} suffix="วัตต์" step={50} />
          <NumberField
            label="ชั่วโมงใช้งาน/วัน"
            value={hoursPerDay}
            onChange={setHoursPerDay}
            suffix="ชม./วัน"
            step={0.5}
          />
          <NumberField
            label="ชั่วโมงแดด/วัน"
            value={sunHoursPerDay}
            onChange={setSunHoursPerDay}
            suffix="ชม./วัน"
            step={0.5}
            hint="ค่ากลาง 4.5 ชม. ควรปรับตามพื้นที่และฤดูกาลจริง"
          />
          <NumberField
            label="การสูญเสียของระบบ"
            value={systemLossPct}
            onChange={setSystemLossPct}
            suffix="%"
            step={5}
            hint="สายไฟ อินเวอร์เตอร์ แบตเตอรี่ ฯลฯ ค่าเริ่มต้น 30% ปรับได้"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            ประเมินขนาดแผงโซลาร์
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;ประเมินขนาดแผงโซลาร์&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ขนาดแผงโซลาร์โดยประมาณ</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {result.requiredPanelWatts === null ? "-" : `${num(result.requiredPanelWatts)} วัตต์`}
              </div>
              <p className="mt-1 text-sm text-stone">พลังงาน {num(result.energyWhPerDay)} Wh/วัน</p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="พลังงาน/วัน" value={`${num(result.energyWhPerDay)} Wh`} />
                    <Row
                      label="ขนาดแผงโดยประมาณ"
                      value={result.requiredPanelWatts === null ? "-" : `${num(result.requiredPanelWatts)} วัตต์`}
                      strong
                    />
                  </tbody>
                </table>
              </div>

              <div className="card mt-4" style={{ borderLeft: "4px solid #e6a23c" }}>
                <p className="text-sm font-semibold text-ink">
                  ⚠️ นี่คือ<span className="font-bold">การประมาณเบื้องต้นเท่านั้น</span> ไม่ใช่การออกแบบระบบไฟฟ้า
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink/90">
                  <li>สายไฟ คอนโทรลเลอร์ เบรกเกอร์ และแรงดันไฟฟ้าต้องให้ช่างหรือวิศวกรตรวจสอบ</li>
                  <li>ชั่วโมงแดดจริงต่างกันตามพื้นที่ ฤดูกาล และสภาพอากาศแต่ละวัน</li>
                  <li>ไม่ควรติดตั้งระบบไฟฟ้าด้วยตนเองโดยไม่มีความรู้ความปลอดภัยที่เพียงพอ</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์เป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น ไม่ใช่การออกแบบระบบไฟฟ้าที่สมบูรณ์
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/irrigation-calculator", label: "คำนวณน้ำ ระบบน้ำหยด/สปริงเกอร์" },
                  { href: "/tools/pump-size-calculator", label: "คำนวณขนาดปั๊มน้ำเกษตร" },
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
