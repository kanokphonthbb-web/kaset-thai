"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  yieldFromPlants,
  yieldFromArea,
  type YieldFromPlantsResult,
  type YieldFromAreaResult,
} from "@/lib/calc/cropYield";

type N = number | "";
type Mode = "plants" | "area";

const TOOL_SLUG = "crop-yield-calculator";

const DEFAULTS = {
  plants: 1000,
  survivalRatePct: 90,
  yieldPerPlantKg: 2,
  areaRai: 5,
  yieldPerRaiKg: 500,
  pricePerKg: 10,
};

type Result =
  | { mode: "plants"; data: YieldFromPlantsResult }
  | { mode: "area"; data: YieldFromAreaResult };

function buildSummaryText(r: Result): string {
  if (r.mode === "plants") {
    return [
      "ประเมินผลผลิตพืช (จากจำนวนต้น)",
      `จำนวนต้นรอด: ${num(r.data.survivingPlants)} ต้น`,
      `ผลผลิตรวม: ${num(r.data.totalYieldKg)} กก.`,
      r.data.estimatedRevenue !== null ? `มูลค่าประมาณ: ${baht(r.data.estimatedRevenue)} บาท` : "",
      "* เป็นการประมาณจากตัวเลขที่ผู้ใช้กรอก ไม่ใช่การพยากรณ์ผลผลิตจริง",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "ประเมินผลผลิตพืช (จากพื้นที่)",
    `ผลผลิตรวม: ${num(r.data.totalYieldKg)} กก.`,
    r.data.estimatedRevenue !== null ? `มูลค่าประมาณ: ${baht(r.data.estimatedRevenue)} บาท` : "",
    "* เป็นการประมาณจากตัวเลขที่ผู้ใช้กรอก ไม่ใช่การพยากรณ์ผลผลิตจริง",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CropYieldCalculator() {
  const [mode, setMode] = useState<Mode>("plants");

  // mode: plants
  const [plants, setPlants] = useState<N>(DEFAULTS.plants);
  const [survivalRatePct, setSurvivalRatePct] = useState<N>(DEFAULTS.survivalRatePct);
  const [yieldPerPlantKg, setYieldPerPlantKg] = useState<N>(DEFAULTS.yieldPerPlantKg);
  const [pricePerKgPlants, setPricePerKgPlants] = useState<N>("");

  // mode: area
  const [areaRai, setAreaRai] = useState<N>(DEFAULTS.areaRai);
  const [yieldPerRaiKg, setYieldPerRaiKg] = useState<N>(DEFAULTS.yieldPerRaiKg);
  const [pricePerKgArea, setPricePerKgArea] = useState<N>("");

  const [result, setResult] = useState<Result | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    const hasPrice = result.data.estimatedRevenue !== null;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: `${result.mode}_${hasPrice ? "with_price" : "no_price"}`,
    });
  }, [result]);

  function handleModeChange(next: Mode) {
    setMode(next);
    setResult(null);
    setCopyStatus("idle");
  }

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    setCopyStatus("idle");
    if (mode === "plants") {
      const data = yieldFromPlants({
        plants: val(plants),
        survivalRatePct: val(survivalRatePct),
        yieldPerPlantKg: val(yieldPerPlantKg),
        pricePerKg: pricePerKgPlants === "" ? undefined : val(pricePerKgPlants),
      });
      setResult({ mode: "plants", data });
    } else {
      const data = yieldFromArea({
        areaRai: val(areaRai),
        yieldPerRaiKg: val(yieldPerRaiKg),
        pricePerKg: pricePerKgArea === "" ? undefined : val(pricePerKgArea),
      });
      setResult({ mode: "area", data });
    }
  }

  function handleReset() {
    setPlants(DEFAULTS.plants);
    setSurvivalRatePct(DEFAULTS.survivalRatePct);
    setYieldPerPlantKg(DEFAULTS.yieldPerPlantKg);
    setPricePerKgPlants("");
    setAreaRai(DEFAULTS.areaRai);
    setYieldPerRaiKg(DEFAULTS.yieldPerRaiKg);
    setPricePerKgArea("");
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
          เลือกวิธีประเมินผลผลิต
        </h2>
        <p className="mt-1 text-sm text-stone">
          เลือกได้ว่าจะประเมินจากจำนวนต้นที่ปลูก หรือจากพื้นที่ทั้งหมด
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleModeChange("plants")}
            className={mode === "plants" ? "btn-primary" : "btn-secondary"}
          >
            จากจำนวนต้น
          </button>
          <button
            onClick={() => handleModeChange("area")}
            className={mode === "area" ? "btn-primary" : "btn-secondary"}
          >
            จากพื้นที่
          </button>
        </div>

        {mode === "plants" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberField label="จำนวนต้นที่ปลูก" value={plants} onChange={setPlants} suffix="ต้น" step={10} />
            <NumberField
              label="อัตรารอด"
              value={survivalRatePct}
              onChange={setSurvivalRatePct}
              suffix="%"
              step={1}
              hint="เปอร์เซ็นต์ต้นที่คาดว่าจะรอดจนเก็บเกี่ยว"
            />
            <NumberField
              label="ผลผลิตต่อต้น"
              value={yieldPerPlantKg}
              onChange={setYieldPerPlantKg}
              suffix="กก./ต้น"
              step={0.5}
            />
            <NumberField
              label="ราคาขาย (ไม่บังคับ)"
              value={pricePerKgPlants}
              onChange={setPricePerKgPlants}
              suffix="บาท/กก."
              step={1}
              hint="กรอกถ้าต้องการดูมูลค่าประมาณ"
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberField label="พื้นที่" value={areaRai} onChange={setAreaRai} suffix="ไร่" step={1} />
            <NumberField
              label="ผลผลิตต่อไร่"
              value={yieldPerRaiKg}
              onChange={setYieldPerRaiKg}
              suffix="กก./ไร่"
              step={10}
            />
            <NumberField
              label="ราคาขาย (ไม่บังคับ)"
              value={pricePerKgArea}
              onChange={setPricePerKgArea}
              suffix="บาท/กก."
              step={1}
              hint="กรอกถ้าต้องการดูมูลค่าประมาณ"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            ประเมินผลผลิต
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;ประเมินผลผลิต&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ผลผลิตรวมโดยประมาณ</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {num(result.data.totalYieldKg)} กก.
              </div>
              {result.data.estimatedRevenue !== null && (
                <p className="mt-1 text-sm text-stone">
                  มูลค่าประมาณ {baht(result.data.estimatedRevenue)} บาท
                </p>
              )}

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    {result.mode === "plants" && (
                      <Row label="จำนวนต้นรอด" value={`${num(result.data.survivingPlants)} ต้น`} />
                    )}
                    <Row label="ผลผลิตรวม" value={`${num(result.data.totalYieldKg)} กก.`} strong />
                    {result.data.estimatedRevenue !== null && (
                      <Row label="มูลค่าประมาณ" value={`${baht(result.data.estimatedRevenue)} บาท`} strong />
                    )}
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  {result.mode === "plants" ? (
                    <>
                      <li>จำนวนต้นรอด = จำนวนต้น × อัตรารอด (%)</li>
                      <li>ผลผลิตรวม = จำนวนต้นรอด × ผลผลิตต่อต้น</li>
                    </>
                  ) : (
                    <li>ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)</li>
                  )}
                  <li>มูลค่าประมาณ = ผลผลิตรวม × ราคาขายต่อ กก. (เมื่อกรอกราคา)</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * เป็นการประมาณจากตัวเลขที่ผู้ใช้กรอก ไม่ใช่การพยากรณ์ผลผลิตจริง
              ผลผลิตจริงขึ้นอยู่กับสภาพอากาศ ดิน โรคและแมลง และการดูแลรักษาตลอดฤดูปลูก
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
                  href="/tools/plant-cost"
                  className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
                  onClick={() =>
                    track(TOOL_EVENTS.related_tool_click, {
                      tool: TOOL_SLUG,
                      target: "/tools/plant-cost",
                    })
                  }
                >
                  คำนวณต้นทุนปลูกพืช
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
