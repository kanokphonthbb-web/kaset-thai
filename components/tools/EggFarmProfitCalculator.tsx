"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  computeEggFarmProfit,
  type EggFarmProfitInput,
  type EggFarmProfitResult,
} from "@/lib/calc/eggFarm";

type N = number | "";

const TOOL_SLUG = "egg-farm-profit-calculator";

const DEFAULTS = {
  hens: 100,
  layRatePct: 80,
  eggPrice: 3.5,
  feedKgPerHenPerDay: 0.12,
  feedPricePerKg: 14,
  otherCostPerDay: 50,
} satisfies EggFarmProfitInput;

function buildSummaryText(r: EggFarmProfitResult): string {
  return [
    "คำนวณกำไรฟาร์มไก่ไข่",
    `ไข่/วัน: ${num(r.eggsPerDay)} ฟอง`,
    `รายได้/วัน: ${baht(r.revenuePerDay)} บาท`,
    `ค่าอาหาร/วัน: ${baht(r.feedCostPerDay)} บาท`,
    `ค่าใช้จ่ายอื่น/วัน: ${baht(r.otherCostPerDay)} บาท`,
    `กำไร/วัน: ${baht(r.profitPerDay)} บาท`,
    `กำไร/เดือน (30 วัน): ${baht(r.profitPerMonth)} บาท`,
    "* อัตราการให้ไข่และปริมาณอาหารต่างกันตามสายพันธุ์ อายุ และฤดูกาล ใช้ตัวเลขจริงของฟาร์มคุณ",
  ].join("\n");
}

export default function EggFarmProfitCalculator() {
  const [hens, setHens] = useState<N>(DEFAULTS.hens);
  const [layRatePct, setLayRatePct] = useState<N>(DEFAULTS.layRatePct);
  const [eggPrice, setEggPrice] = useState<N>(DEFAULTS.eggPrice);
  const [feedKgPerHenPerDay, setFeedKgPerHenPerDay] = useState<N>(DEFAULTS.feedKgPerHenPerDay);
  const [feedPricePerKg, setFeedPricePerKg] = useState<N>(DEFAULTS.feedPricePerKg);
  const [otherCostPerDay, setOtherCostPerDay] = useState<N>(DEFAULTS.otherCostPerDay);

  const [result, setResult] = useState<EggFarmProfitResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.profitPerDay >= 0 ? "profit_positive" : "profit_negative",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: EggFarmProfitInput = {
      hens: val(hens),
      layRatePct: val(layRatePct),
      eggPrice: val(eggPrice),
      feedKgPerHenPerDay: val(feedKgPerHenPerDay),
      feedPricePerKg: val(feedPricePerKg),
      otherCostPerDay: val(otherCostPerDay),
    };
    setCopyStatus("idle");
    setResult(computeEggFarmProfit(input));
  }

  function handleReset() {
    setHens(DEFAULTS.hens);
    setLayRatePct(DEFAULTS.layRatePct);
    setEggPrice(DEFAULTS.eggPrice);
    setFeedKgPerHenPerDay(DEFAULTS.feedKgPerHenPerDay);
    setFeedPricePerKg(DEFAULTS.feedPricePerKg);
    setOtherCostPerDay(DEFAULTS.otherCostPerDay);
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

  const isPositive = result ? result.profitPerDay >= 0 : true;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          กรอกจำนวนแม่ไก่ อัตราไข่ และต้นทุน
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับฟาร์มจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="จำนวนแม่ไก่" value={hens} onChange={setHens} suffix="ตัว" step={10} />
          <NumberField
            label="อัตราการให้ไข่"
            value={layRatePct}
            onChange={setLayRatePct}
            suffix="%"
            step={1}
            hint="เปอร์เซ็นต์ของแม่ไก่ที่ไข่ในแต่ละวัน ต่างกันตามสายพันธุ์/อายุ/ฤดู"
          />
          <NumberField label="ราคาไข่" value={eggPrice} onChange={setEggPrice} suffix="บาท/ฟอง" step={0.1} />
          <NumberField
            label="อาหารต่อตัวต่อวัน"
            value={feedKgPerHenPerDay}
            onChange={setFeedKgPerHenPerDay}
            suffix="กก./ตัว/วัน"
            step={0.01}
          />
          <NumberField label="ราคาอาหาร" value={feedPricePerKg} onChange={setFeedPricePerKg} suffix="บาท/กก." step={1} />
          <NumberField
            label="ค่าใช้จ่ายอื่น/วัน"
            value={otherCostPerDay}
            onChange={setOtherCostPerDay}
            suffix="บาท/วัน"
            step={10}
            hint="เช่น ค่าไฟ ค่าแรง ยา/วัคซีน วัสดุรองพื้น"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณกำไรฟาร์มไก่ไข่
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณกำไรฟาร์มไก่ไข่&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">กำไรโดยประมาณต่อวัน</p>
              <div
                className={`mt-2 font-display text-4xl font-bold ${
                  isPositive ? "text-forest" : "text-coral"
                }`}
              >
                {baht(result.profitPerDay)} บาท
              </div>
              <p className="mt-1 text-sm text-stone">
                กำไร/เดือน (30 วัน){" "}
                <span className={isPositive ? "text-forest" : "text-coral"}>
                  {baht(result.profitPerMonth)} บาท
                </span>
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ไข่/วัน" value={`${num(result.eggsPerDay)} ฟอง`} />
                    <Row label="รายได้/วัน" value={`${baht(result.revenuePerDay)} บาท`} />
                    <Row label="ค่าอาหาร/วัน" value={`${baht(result.feedCostPerDay)} บาท`} />
                    <Row label="ค่าใช้จ่ายอื่น/วัน" value={`${baht(result.otherCostPerDay)} บาท`} />
                    <Row
                      label="กำไร/วัน"
                      value={`${baht(result.profitPerDay)} บาท`}
                      strong
                    />
                    <Row
                      label="กำไร/เดือน (30 วัน)"
                      value={`${baht(result.profitPerMonth)} บาท`}
                      strong
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>ไข่/วัน = จำนวนแม่ไก่ × อัตราการให้ไข่ (%)</li>
                  <li>รายได้/วัน = ไข่/วัน × ราคาไข่</li>
                  <li>ค่าอาหาร/วัน = จำนวนแม่ไก่ × อาหารต่อตัวต่อวัน × ราคาอาหาร</li>
                  <li>กำไร/วัน = รายได้/วัน − ค่าอาหาร/วัน − ค่าใช้จ่ายอื่น/วัน</li>
                  <li>กำไร/เดือน = กำไร/วัน × 30</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * อัตราการให้ไข่และปริมาณอาหารต่างกันตามสายพันธุ์ อายุ และฤดูกาล ควรใช้ตัวเลขจริงของฟาร์มคุณเพื่อความแม่นยำ
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/livestock-feed-cost-calculator", label: "คำนวณค่าอาหารสัตว์" },
                  { href: "/tools/fcr-calculator", label: "คำนวณ FCR อัตราแลกเนื้อ" },
                  { href: "/tools/animal-cost", label: "คำนวณต้นทุนเลี้ยงสัตว์" },
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
