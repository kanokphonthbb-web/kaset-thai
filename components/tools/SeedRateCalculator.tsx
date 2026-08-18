"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeSeedPlan, type SeedPlanInput, type SeedPlanResult } from "@/lib/calc/seedRate";

type N = number | "";

const TOOL_SLUG = "seed-rate-calculator";

const DEFAULTS = {
  areaRai: 5 as N,
  seedRatePerRaiKg: 15 as N,
  pricePerKg: 25 as N,
};

function numOrDash(n: number | null): string {
  return n === null ? "-" : num(n);
}

function bahtOrDash(n: number | null): string {
  return n === null ? "-" : `${baht(n)} บาท`;
}

function buildSummaryText(r: SeedPlanResult): string {
  return [
    "คำนวณเมล็ดพันธุ์ต่อไร่",
    `เมล็ดที่ต้องใช้: ${num(r.totalSeedKg)} กก.`,
    `ต้นทุนรวม: ${bahtOrDash(r.totalCost)}`,
    `ต้นทุนต่อไร่: ${r.costPerRai === null ? "-" : `${baht(r.costPerRai)} บาท/ไร่`}`,
    "* อัตราเมล็ดพันธุ์ควรอ้างอิงคำแนะนำทางการหรือฉลากเมล็ดพันธุ์ ไม่ใช่การรับประกันผลผลิต",
  ].join("\n");
}

export default function SeedRateCalculator() {
  const [areaRai, setAreaRai] = useState<N>(DEFAULTS.areaRai);
  const [seedRatePerRaiKg, setSeedRatePerRaiKg] = useState<N>(DEFAULTS.seedRatePerRaiKg);
  const [pricePerKg, setPricePerKg] = useState<N>(DEFAULTS.pricePerKg);

  const [result, setResult] = useState<SeedPlanResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.totalCost === null ? "no_price" : "with_price",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: SeedPlanInput = {
      areaRai: val(areaRai),
      seedRatePerRaiKg: val(seedRatePerRaiKg),
      ...(pricePerKg !== "" ? { pricePerKg: val(pricePerKg) } : {}),
    };
    setCopyStatus("idle");
    setResult(computeSeedPlan(input));
  }

  function handleReset() {
    setAreaRai(DEFAULTS.areaRai);
    setSeedRatePerRaiKg(DEFAULTS.seedRatePerRaiKg);
    setPricePerKg(DEFAULTS.pricePerKg);
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
          กรอกพื้นที่และอัตราเมล็ดพันธุ์
        </h2>
        <p className="mt-1 text-sm text-stone">
          อัตราเมล็ดพันธุ์ควรอ้างอิงคำแนะนำทางการหรือฉลากเมล็ดพันธุ์ที่ใช้ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="พื้นที่" value={areaRai} onChange={setAreaRai} suffix="ไร่" step={1} />
          <NumberField
            label="อัตราเมล็ดพันธุ์"
            value={seedRatePerRaiKg}
            onChange={setSeedRatePerRaiKg}
            suffix="กก./ไร่"
            step={1}
            hint="ยึดคำแนะนำของกรมการข้าว/กรมวิชาการเกษตร หรือฉลากเมล็ดพันธุ์"
          />
          <NumberField
            label="ราคาเมล็ดพันธุ์ (ถ้ามี)"
            value={pricePerKg}
            onChange={setPricePerKg}
            suffix="บาท/กก."
            step={1}
            hint="เว้นว่างได้หากไม่ต้องการคำนวณต้นทุน"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณเมล็ดพันธุ์
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณเมล็ดพันธุ์&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">เมล็ดพันธุ์ที่ต้องใช้</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {num(result.totalSeedKg)} กก.
              </div>
              {result.totalCost !== null && (
                <p className="mt-1 text-sm text-stone">ต้นทุนรวม {baht(result.totalCost)} บาท</p>
              )}

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="เมล็ดที่ต้องใช้" value={`${num(result.totalSeedKg)} กก.`} strong />
                    <Row label="ต้นทุนรวม" value={bahtOrDash(result.totalCost)} />
                    <Row
                      label="ต้นทุนต่อไร่"
                      value={result.costPerRai === null ? "-" : `${baht(result.costPerRai)} บาท/ไร่`}
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>เมล็ดที่ต้องใช้ = พื้นที่ (ไร่) × อัตราเมล็ดพันธุ์ต่อไร่ (กก.)</li>
                  <li>ต้นทุนรวม = เมล็ดที่ต้องใช้ × ราคาต่อ กก.</li>
                  <li>ต้นทุนต่อไร่ = ต้นทุนรวม ÷ พื้นที่ (ไร่)</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * เป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น อัตราเมล็ดพันธุ์ที่เหมาะสมต่างกันตามพืชและวิธีปลูก
              ควรยึดคำแนะนำของกรมการข้าว/กรมวิชาการเกษตร/ฉลากเมล็ดพันธุ์เป็นหลัก
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/plant-spacing-calculator", label: "คำนวณจำนวนต้นที่ปลูกได้" },
                  { href: "/tools/plant-cost", label: "คำนวณต้นทุนปลูกพืช" },
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
