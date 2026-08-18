"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import { computeFeedCost, type FeedCostInput, type FeedCostResult } from "@/lib/calc/feedCost";

type N = number | "";

const TOOL_SLUG = "livestock-feed-cost-calculator";

const DEFAULTS = {
  animals: 20,
  feedKgPerAnimalPerDay: 2,
  feedPricePerKg: 15,
  days: 30,
} satisfies FeedCostInput;

function buildSummaryText(r: FeedCostResult): string {
  return [
    "คำนวณค่าอาหารสัตว์",
    `อาหาร/วัน: ${num(r.feedKgPerDay)} กก.`,
    `อาหารรวม: ${num(r.feedKgTotal)} กก.`,
    `ค่าอาหารรวม: ${baht(r.totalCost)} บาท`,
    `ค่าอาหาร/ตัว: ${r.costPerAnimal === null ? "-" : `${baht(r.costPerAnimal)} บาท`}`,
    "* เป็นการประมาณการจากข้อมูลที่ป้อนเท่านั้น ใช้ได้กับสัตว์ทุกชนิดที่คิดอาหารเป็นกก./ตัว/วัน",
  ].join("\n");
}

export default function LivestockFeedCostCalculator() {
  const [animals, setAnimals] = useState<N>(DEFAULTS.animals);
  const [feedKgPerAnimalPerDay, setFeedKgPerAnimalPerDay] = useState<N>(DEFAULTS.feedKgPerAnimalPerDay);
  const [feedPricePerKg, setFeedPricePerKg] = useState<N>(DEFAULTS.feedPricePerKg);
  const [days, setDays] = useState<N>(DEFAULTS.days);

  const [result, setResult] = useState<FeedCostResult | null>(null);
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
    const input: FeedCostInput = {
      animals: val(animals),
      feedKgPerAnimalPerDay: val(feedKgPerAnimalPerDay),
      feedPricePerKg: val(feedPricePerKg),
      days: val(days),
    };
    setCopyStatus("idle");
    setResult(computeFeedCost(input));
  }

  function handleReset() {
    setAnimals(DEFAULTS.animals);
    setFeedKgPerAnimalPerDay(DEFAULTS.feedKgPerAnimalPerDay);
    setFeedPricePerKg(DEFAULTS.feedPricePerKg);
    setDays(DEFAULTS.days);
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
          กรอกจำนวนสัตว์และปริมาณอาหาร
        </h2>
        <p className="mt-1 text-sm text-stone">
          ใช้ได้กับสัตว์ทุกชนิด เช่น วัว หมู ไก่ ปลา ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับฟาร์มจริงของคุณ
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="จำนวนสัตว์" value={animals} onChange={setAnimals} suffix="ตัว" step={1} />
          <NumberField
            label="อาหารต่อตัวต่อวัน"
            value={feedKgPerAnimalPerDay}
            onChange={setFeedKgPerAnimalPerDay}
            suffix="กก./ตัว/วัน"
            step={0.1}
          />
          <NumberField label="ราคาอาหาร" value={feedPricePerKg} onChange={setFeedPricePerKg} suffix="บาท/กก." step={1} />
          <NumberField label="จำนวนวัน" value={days} onChange={setDays} suffix="วัน" step={1} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณค่าอาหารสัตว์
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณค่าอาหารสัตว์&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ค่าอาหารรวม</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {baht(result.totalCost)} บาท
              </div>
              <p className="mt-1 text-sm text-stone">
                {num(result.feedKgTotal)} กก. ตลอดช่วงเวลาที่กรอก
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="อาหาร/วัน" value={`${num(result.feedKgPerDay)} กก.`} />
                    <Row label="อาหารรวม" value={`${num(result.feedKgTotal)} กก.`} />
                    <Row label="ค่าอาหารรวม" value={`${baht(result.totalCost)} บาท`} strong />
                    <Row
                      label="ค่าอาหาร/ตัว"
                      value={result.costPerAnimal === null ? "-" : `${baht(result.costPerAnimal)} บาท`}
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>อาหาร/วัน = จำนวนสัตว์ × อาหารต่อตัวต่อวัน</li>
                  <li>อาหารรวม = อาหาร/วัน × จำนวนวัน</li>
                  <li>ค่าอาหารรวม = อาหารรวม × ราคาอาหารต่อกก.</li>
                  <li>ค่าอาหาร/ตัว = ค่าอาหารรวม ÷ จำนวนสัตว์</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์เป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น ใช้ได้กับสัตว์ทุกชนิด (วัว หมู ไก่ ปลา ฯลฯ)
              ที่คิดปริมาณอาหารเป็นกก./ตัว/วัน
            </p>

            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/egg-farm-profit-calculator", label: "คำนวณกำไรฟาร์มไก่ไข่" },
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
