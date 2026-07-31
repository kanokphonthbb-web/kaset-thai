"use client";

import { useEffect, useState, type ReactNode } from "react";
import NumberField from "@/components/NumberField";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  calculateMinimumSellingPrice,
  type MSPInput,
  type MSPResult,
} from "@/lib/minimumSellingPrice";

type N = number | "";

const TOOL_SLUG = "minimum-selling-price";

const DEFAULTS = {
  rawMaterialCost: 1000,
  laborCost: 500,
  waterCost: 100,
  electricityCost: 150,
  fertilizerFeedCost: 200,
  equipmentCost: 300,
  depreciation: 250,
  packagingCost: 100,
  shippingCost: 200,
  platformFeePct: 20,
  totalYield: 100,
  wasteAmount: 10,
  targetProfitPct: 30,
} satisfies MSPInput;

function buildSummaryText(r: MSPResult): string {
  if (r.error) {
    return `คำนวณราคาขายขั้นต่ำ\nไม่สามารถคำนวณได้: ${r.error}`;
  }
  return [
    "คำนวณราคาขายขั้นต่ำ",
    `ต้นทุนรวม: ${baht(r.totalCost)} บาท`,
    `ผลผลิตขายได้: ${num(r.sellableYield)} หน่วย`,
    `ต้นทุนต่อหน่วย: ${num(r.costPerUnit)} บาท/หน่วย`,
    `ราคาขายขั้นต่ำ (ไม่ขาดทุน): ${num(r.minPrice)} บาท/หน่วย`,
    `ราคาขายที่ได้กำไรตามเป้าหมาย: ${num(r.priceAtTargetProfit)} บาท/หน่วย`,
    `กำไรต่อหน่วย: ${num(r.profitPerUnit)} บาท/หน่วย`,
    `จุดคุ้มทุน: ${num(r.breakEvenUnits)} หน่วย`,
    `ราคาส่งตัวอย่าง: ${num(r.wholesalePrice)} บาท/หน่วย`,
    `ราคาปลีกตัวอย่าง: ${num(r.retailPrice)} บาท/หน่วย`,
    "* เป็นการประมาณการจากข้อมูลที่ป้อนเท่านั้น ไม่ใช่การรับประกันกำไร",
  ].join("\n");
}

export default function MinimumSellingPrice({
  affiliateRecommendations,
}: {
  // Passed in as a resolved node from the server page component — this
  // client component must not import/render server components (e.g.
  // AffiliateRecommendations, which reads the DB via Prisma) directly.
  affiliateRecommendations?: ReactNode;
}) {
  const [rawMaterialCost, setRawMaterialCost] = useState<N>(DEFAULTS.rawMaterialCost);
  const [laborCost, setLaborCost] = useState<N>(DEFAULTS.laborCost);
  const [waterCost, setWaterCost] = useState<N>(DEFAULTS.waterCost);
  const [electricityCost, setElectricityCost] = useState<N>(DEFAULTS.electricityCost);
  const [fertilizerFeedCost, setFertilizerFeedCost] = useState<N>(DEFAULTS.fertilizerFeedCost);
  const [equipmentCost, setEquipmentCost] = useState<N>(DEFAULTS.equipmentCost);
  const [depreciation, setDepreciation] = useState<N>(DEFAULTS.depreciation);
  const [packagingCost, setPackagingCost] = useState<N>(DEFAULTS.packagingCost);
  const [shippingCost, setShippingCost] = useState<N>(DEFAULTS.shippingCost);
  const [platformFeePct, setPlatformFeePct] = useState<N>(DEFAULTS.platformFeePct);
  const [totalYield, setTotalYield] = useState<N>(DEFAULTS.totalYield);
  const [wasteAmount, setWasteAmount] = useState<N>(DEFAULTS.wasteAmount);
  const [targetProfitPct, setTargetProfitPct] = useState<N>(DEFAULTS.targetProfitPct);

  const [result, setResult] = useState<MSPResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (!result) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: result.error ? "error" : "ok",
    });
  }, [result]);

  function handleCalculate() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG });
    const input: MSPInput = {
      rawMaterialCost: val(rawMaterialCost),
      laborCost: val(laborCost),
      waterCost: val(waterCost),
      electricityCost: val(electricityCost),
      fertilizerFeedCost: val(fertilizerFeedCost),
      equipmentCost: val(equipmentCost),
      depreciation: val(depreciation),
      packagingCost: val(packagingCost),
      shippingCost: val(shippingCost),
      platformFeePct: val(platformFeePct),
      totalYield: val(totalYield),
      wasteAmount: val(wasteAmount),
      targetProfitPct: val(targetProfitPct),
    };
    setCopyStatus("idle");
    setResult(calculateMinimumSellingPrice(input));
  }

  function handleReset() {
    setRawMaterialCost(DEFAULTS.rawMaterialCost);
    setLaborCost(DEFAULTS.laborCost);
    setWaterCost(DEFAULTS.waterCost);
    setElectricityCost(DEFAULTS.electricityCost);
    setFertilizerFeedCost(DEFAULTS.fertilizerFeedCost);
    setEquipmentCost(DEFAULTS.equipmentCost);
    setDepreciation(DEFAULTS.depreciation);
    setPackagingCost(DEFAULTS.packagingCost);
    setShippingCost(DEFAULTS.shippingCost);
    setPlatformFeePct(DEFAULTS.platformFeePct);
    setTotalYield(DEFAULTS.totalYield);
    setWasteAmount(DEFAULTS.wasteAmount);
    setTargetProfitPct(DEFAULTS.targetProfitPct);
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
          กรอกต้นทุนและผลผลิต
        </h2>
        <p className="mt-1 text-sm text-stone">
          ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับต้นทุนจริงของคุณ แล้วกด &quot;คำนวณ&quot;
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField label="ต้นทุนวัตถุดิบ" value={rawMaterialCost} onChange={setRawMaterialCost} suffix="บาท" step={50} />
          <NumberField label="ค่าแรงงาน" value={laborCost} onChange={setLaborCost} suffix="บาท" step={50} />
          <NumberField label="ค่าน้ำ" value={waterCost} onChange={setWaterCost} suffix="บาท" step={10} />
          <NumberField label="ค่าไฟฟ้า" value={electricityCost} onChange={setElectricityCost} suffix="บาท" step={10} />
          <NumberField label="ค่าปุ๋ย/อาหารสัตว์" value={fertilizerFeedCost} onChange={setFertilizerFeedCost} suffix="บาท" step={50} />
          <NumberField label="ค่าอุปกรณ์" value={equipmentCost} onChange={setEquipmentCost} suffix="บาท" step={50} />
          <NumberField label="ค่าเสื่อมราคา" value={depreciation} onChange={setDepreciation} suffix="บาท" step={50} />
          <NumberField label="ค่าบรรจุภัณฑ์" value={packagingCost} onChange={setPackagingCost} suffix="บาท" step={10} />
          <NumberField label="ค่าขนส่ง" value={shippingCost} onChange={setShippingCost} suffix="บาท" step={10} />
          <NumberField label="ค่าธรรมเนียมแพลตฟอร์ม" value={platformFeePct} onChange={setPlatformFeePct} suffix="%" step={1} />
          <NumberField label="ผลผลิตทั้งหมด" value={totalYield} onChange={setTotalYield} suffix="กก./ชิ้น" step={5} hint="ใช้หน่วยใดก็ได้ เช่น กิโลกรัม หรือ ชิ้น" />
          <NumberField label="ของเสีย/ของเสียหาย" value={wasteAmount} onChange={setWasteAmount} suffix="กก./ชิ้น" step={1} hint="หน่วยเดียวกับผลผลิตทั้งหมด" />
          <NumberField label="กำไรเป้าหมาย" value={targetProfitPct} onChange={setTargetProfitPct} suffix="%" step={5} hint="คิดเป็น % ของต้นทุนต่อหน่วย" />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleCalculate} className="btn-primary">
            คำนวณราคาขายขั้นต่ำ
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
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณราคาขายขั้นต่ำ&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {result && result.error && (
          <div className="rounded-2xl bg-mist p-6">
            <p className="eyebrow">ไม่สามารถคำนวณได้</p>
            <p className="mt-2 text-sm text-ink">{result.error}</p>
          </div>
        )}

        {result && !result.error && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ราคาขายขั้นต่ำที่ไม่ขาดทุน</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">
                {num(result.minPrice)} บาท
              </div>
              <p className="mt-1 text-sm text-stone">
                ราคาที่ได้กำไรตามเป้าหมาย {num(result.priceAtTargetProfit)} บาท/หน่วย ·
                กำไร {num(result.profitPerUnit)} บาท/หน่วย
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ต้นทุนรวม" value={`${baht(result.totalCost)} บาท`} />
                    <Row label="ผลผลิตขายได้" value={`${num(result.sellableYield)} หน่วย`} />
                    <Row label="ต้นทุนต่อหน่วย" value={`${num(result.costPerUnit)} บาท`} />
                    <Row label="ราคาขายขั้นต่ำ (ไม่ขาดทุน)" value={`${num(result.minPrice)} บาท`} strong />
                    <Row label="ราคาขายที่ได้กำไรตามเป้าหมาย" value={`${num(result.priceAtTargetProfit)} บาท`} strong />
                    <Row label="กำไรต่อหน่วย" value={`${num(result.profitPerUnit)} บาท`} />
                    <Row label="จุดคุ้มทุน" value={`${num(result.breakEvenUnits)} หน่วย`} />
                    <Row label="ราคาส่งตัวอย่าง" value={`${num(result.wholesalePrice)} บาท`} />
                    <Row label="ราคาปลีกตัวอย่าง" value={`${num(result.retailPrice)} บาท`} />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>ต้นทุนต่อหน่วย = ต้นทุนรวม ÷ (ผลผลิตทั้งหมด − ของเสีย)</li>
                  <li>ราคาขายขั้นต่ำ = ต้นทุนต่อหน่วย ÷ (1 − ค่าธรรมเนียมแพลตฟอร์ม%)</li>
                  <li>ราคาขายที่ได้กำไรตามเป้าหมาย = (ต้นทุนต่อหน่วย × (1 + กำไรเป้าหมาย%)) ÷ (1 − ค่าธรรมเนียมแพลตฟอร์ม%)</li>
                  <li>จุดคุ้มทุน = ต้นทุนรวม ÷ เงินที่ได้จริงต่อหน่วยหลังหักค่าธรรมเนียม (ที่ราคาขายตามเป้าหมายกำไร)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-mist p-6">
              <p className="eyebrow">วิเคราะห์ความเสี่ยง (Sensitivity)</p>
              <p className="mt-1 text-sm text-stone">
                ราคาขายขั้นต่ำจะเปลี่ยนไปอย่างไรถ้าผลผลิตลดลงหรือต้นทุนสูงขึ้น
              </p>
              <div className="cc-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>สถานการณ์</th>
                      <th>ต้นทุนต่อหน่วย</th>
                      <th>ราคาขายขั้นต่ำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scenarios.map((s) => (
                      <tr key={s.label}>
                        <td>{s.label}</td>
                        <td>{num(s.costPerUnit)} บาท</td>
                        <td>{num(s.minPrice)} บาท</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone">
              * ผลลัพธ์ทั้งหมดเป็นการประมาณการจากข้อมูลที่คุณป้อนเท่านั้น
              ไม่ใช่การรับประกันกำไรหรือความคุ้มทุน โปรดตรวจสอบกับต้นทุนจริงและสภาพตลาดก่อนตัดสินใจ
            </p>

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

      {result && !result.error && affiliateRecommendations && (
        <div className="lg:col-span-2">{affiliateRecommendations}</div>
      )}
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
