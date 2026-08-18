"use client";

import { useEffect, useState } from "react";
import NumberField from "@/components/NumberField";
import RelatedToolLinks from "@/components/tools/RelatedToolLinks";
import { baht, num, val } from "@/lib/format";
import { track, TOOL_EVENTS } from "@/lib/analytics";
import {
  computeFertilizerPlan,
  computeNpkContent,
  type FertilizerPlanInput,
  type FertilizerPlanResult,
  type NpkContentInput,
  type NpkContentResult,
} from "@/lib/calc/fertilizer";

type N = number | "";
type Mode = "plan" | "npk";

const TOOL_SLUG = "fertilizer-calculator";

const PLAN_DEFAULTS = {
  areaRai: 1 as N,
  ratePerRaiKg: 50 as N,
  bagSizeKg: 50 as N,
  bagPrice: 600 as N,
};

const NPK_DEFAULTS = {
  n: 15 as N,
  p: 15 as N,
  k: 15 as N,
  amountKg: 50 as N,
};

function buildPlanSummary(r: FertilizerPlanResult): string {
  return [
    "คำนวณปุ๋ยต่อไร่",
    `ปริมาณปุ๋ยรวม: ${num(r.totalKg)} กก.`,
    r.bags === null ? "จำนวนกระสอบ: คำนวณไม่ได้ (ขนาดกระสอบต้องมากกว่า 0)" : `จำนวนกระสอบ: ${num(r.bags)} กระสอบ`,
    r.totalCost === null ? "ต้นทุนรวม: -" : `ต้นทุนรวม: ${baht(r.totalCost)} บาท`,
    r.costPerRai === null ? "ต้นทุนต่อไร่: -" : `ต้นทุนต่อไร่: ${baht(r.costPerRai)} บาท/ไร่`,
    "* อัตราปุ๋ยที่ใช้คำนวณมาจากตัวเลขที่ผู้ใช้ป้อนเอง ไม่ใช่คำแนะนำอัตราปุ๋ยจากเครื่องมือนี้",
  ].join("\n");
}

function buildNpkSummary(r: NpkContentResult): string {
  return [
    "คำนวณธาตุอาหารจากสูตรปุ๋ย",
    `ไนโตรเจน (N): ${num(r.nKg)} กก.`,
    `ฟอสฟอรัส (P₂O₅): ${num(r.p2o5Kg)} กก.`,
    `โพแทสเซียม (K₂O): ${num(r.k2oKg)} กก.`,
  ].join("\n");
}

export default function FertilizerCalculator() {
  const [mode, setMode] = useState<Mode>("plan");

  // Mode 1: ปริมาณ + ต้นทุน
  const [areaRai, setAreaRai] = useState<N>(PLAN_DEFAULTS.areaRai);
  const [ratePerRaiKg, setRatePerRaiKg] = useState<N>(PLAN_DEFAULTS.ratePerRaiKg);
  const [bagSizeKg, setBagSizeKg] = useState<N>(PLAN_DEFAULTS.bagSizeKg);
  const [bagPrice, setBagPrice] = useState<N>(PLAN_DEFAULTS.bagPrice);
  const [planResult, setPlanResult] = useState<FertilizerPlanResult | null>(null);

  // Mode 2: ธาตุอาหาร
  const [n, setN] = useState<N>(NPK_DEFAULTS.n);
  const [p, setP] = useState<N>(NPK_DEFAULTS.p);
  const [k, setK] = useState<N>(NPK_DEFAULTS.k);
  const [amountKg, setAmountKg] = useState<N>(NPK_DEFAULTS.amountKg);
  const [npkResult, setNpkResult] = useState<NpkContentResult | null>(null);
  const [npkError, setNpkError] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    track(TOOL_EVENTS.tool_view, { tool: TOOL_SLUG });
  }, []);

  useEffect(() => {
    if (mode !== "plan" || !planResult) return;
    track(TOOL_EVENTS.tool_result, {
      tool: TOOL_SLUG,
      result_group: planResult.bags === null ? "invalid_bag_size" : "ok",
      mode,
    });
  }, [mode, planResult]);

  useEffect(() => {
    if (mode !== "npk") return;
    if (npkError) {
      track(TOOL_EVENTS.tool_result, { tool: TOOL_SLUG, result_group: "invalid_formula", mode });
    } else if (npkResult) {
      track(TOOL_EVENTS.tool_result, { tool: TOOL_SLUG, result_group: "ok", mode });
    }
  }, [mode, npkResult, npkError]);

  function handleCalculatePlan() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG, mode: "plan" });
    const input: FertilizerPlanInput = {
      areaRai: val(areaRai),
      ratePerRaiKg: val(ratePerRaiKg),
      bagSizeKg: val(bagSizeKg),
      bagPrice: val(bagPrice),
    };
    setCopyStatus("idle");
    setPlanResult(computeFertilizerPlan(input));
  }

  function handleCalculateNpk() {
    track(TOOL_EVENTS.tool_submit, { tool: TOOL_SLUG, mode: "npk" });
    const input: NpkContentInput = {
      formula: { n: val(n), p: val(p), k: val(k) },
      amountKg: val(amountKg),
    };
    setCopyStatus("idle");
    try {
      setNpkResult(computeNpkContent(input));
      setNpkError(null);
    } catch (e) {
      setNpkResult(null);
      setNpkError(e instanceof Error ? e.message : "ค่าที่กรอกไม่ถูกต้อง");
    }
  }

  function handleReset() {
    setAreaRai(PLAN_DEFAULTS.areaRai);
    setRatePerRaiKg(PLAN_DEFAULTS.ratePerRaiKg);
    setBagSizeKg(PLAN_DEFAULTS.bagSizeKg);
    setBagPrice(PLAN_DEFAULTS.bagPrice);
    setPlanResult(null);
    setN(NPK_DEFAULTS.n);
    setP(NPK_DEFAULTS.p);
    setK(NPK_DEFAULTS.k);
    setAmountKg(NPK_DEFAULTS.amountKg);
    setNpkResult(null);
    setNpkError(null);
    setCopyStatus("idle");
    track(TOOL_EVENTS.tool_reset, { tool: TOOL_SLUG });
  }

  function handlePrint() {
    track(TOOL_EVENTS.tool_print, { tool: TOOL_SLUG });
    window.print();
  }

  async function handleCopy() {
    const text =
      mode === "plan" && planResult
        ? buildPlanSummary(planResult)
        : mode === "npk" && npkResult
          ? buildNpkSummary(npkResult)
          : null;
    if (!text) return;
    track(TOOL_EVENTS.tool_export, { tool: TOOL_SLUG, mode });
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

  const hasResult = (mode === "plan" && planResult) || (mode === "npk" && (npkResult || npkError));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Inputs */}
      <div className="rounded-2xl bg-mist p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">เลือกโหมดการคำนวณ</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("plan")}
            className={mode === "plan" ? "btn-primary" : "btn-secondary"}
          >
            ปริมาณ + ต้นทุน
          </button>
          <button
            type="button"
            onClick={() => setMode("npk")}
            className={mode === "npk" ? "btn-primary" : "btn-secondary"}
          >
            ธาตุอาหาร (NPK)
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-ash bg-paper p-4 text-xs text-stone">
          ⚠️ เครื่องมือนี้ไม่แนะนำอัตราปุ๋ยเอง อัตราที่ใช้คำนวณควรมาจากคำแนะนำทางการ เช่น กรมวิชาการเกษตร
          หรือค่าวิเคราะห์ดินของแปลงคุณ
        </div>

        {mode === "plan" && (
          <>
            <p className="mt-6 text-sm text-stone">
              ตัวเลขเริ่มต้นเป็นเพียงตัวอย่าง ปรับให้ตรงกับอัตราปุ๋ยและราคาจริงของคุณ แล้วกด &quot;คำนวณ&quot;
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField label="พื้นที่" value={areaRai} onChange={setAreaRai} suffix="ไร่" step={1} />
              <NumberField
                label="อัตราปุ๋ยต่อไร่"
                value={ratePerRaiKg}
                onChange={setRatePerRaiKg}
                suffix="กก./ไร่"
                step={5}
                hint="ใช้อัตราจากคำแนะนำทางการหรือค่าวิเคราะห์ดินของคุณ"
              />
              <NumberField label="ขนาดกระสอบ" value={bagSizeKg} onChange={setBagSizeKg} suffix="กก./กระสอบ" step={5} />
              <NumberField label="ราคาต่อกระสอบ" value={bagPrice} onChange={setBagPrice} suffix="บาท" step={10} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleCalculatePlan} className="btn-primary">
                คำนวณปริมาณและต้นทุน
              </button>
              <button onClick={handleReset} className="btn-secondary no-print">
                ล้างค่า
              </button>
            </div>
          </>
        )}

        {mode === "npk" && (
          <>
            <p className="mt-6 text-sm text-stone">
              กรอกสูตรปุ๋ย (ตัวเลข N-P-K บนถุงปุ๋ย เช่น 15-15-15) และน้ำหนักปุ๋ยที่ใช้ แล้วกด &quot;คำนวณ&quot;
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <NumberField label="N (ไนโตรเจน)" value={n} onChange={setN} suffix="%" step={1} min={0} />
              <NumberField label="P (ฟอสฟอรัส)" value={p} onChange={setP} suffix="%" step={1} min={0} />
              <NumberField label="K (โพแทสเซียม)" value={k} onChange={setK} suffix="%" step={1} min={0} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField label="น้ำหนักปุ๋ยที่ใช้" value={amountKg} onChange={setAmountKg} suffix="กก." step={5} />
            </div>
            <p className="mt-3 text-xs text-stone">
              หมายเหตุ: สูตรปุ๋ยไทยแสดงค่า P เป็น P₂O₅ และ K เป็น K₂O อยู่แล้ว จึงไม่มีการแปลงหน่วยเพิ่มเติม
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleCalculateNpk} className="btn-primary">
                คำนวณธาตุอาหาร
              </button>
              <button onClick={handleReset} className="btn-secondary no-print">
                ล้างค่า
              </button>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {!hasResult && (
          <div className="rounded-2xl bg-mist p-6 text-sm text-stone">
            กรอกข้อมูลด้านซ้ายแล้วกด &quot;คำนวณ&quot; เพื่อดูผลลัพธ์
          </div>
        )}

        {mode === "plan" && planResult && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ปริมาณปุ๋ยที่ต้องใช้</p>
              <div className="mt-2 font-display text-4xl font-bold text-ink">{num(planResult.totalKg)} กก.</div>
              <p className="mt-1 text-sm text-stone">
                {planResult.bags !== null && `${num(planResult.bags)} กระสอบ`}
                {planResult.totalCost !== null && ` · รวม ${baht(planResult.totalCost)} บาท`}
              </p>

              <div className="cc-table-wrap">
                <table>
                  <tbody>
                    <Row label="ปริมาณปุ๋ยรวม" value={`${num(planResult.totalKg)} กก.`} />
                    <Row
                      label="จำนวนกระสอบ"
                      value={planResult.bags === null ? "-" : `${num(planResult.bags)} กระสอบ`}
                      strong
                    />
                    <Row
                      label="ต้นทุนรวม"
                      value={planResult.totalCost === null ? "-" : `${baht(planResult.totalCost)} บาท`}
                      strong
                    />
                    <Row
                      label="ต้นทุนต่อไร่"
                      value={planResult.costPerRai === null ? "-" : `${baht(planResult.costPerRai)} บาท/ไร่`}
                    />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">สูตรที่ใช้คำนวณ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone">
                  <li>ปริมาณรวม = พื้นที่ (ไร่) × อัตราต่อไร่ (กก.)</li>
                  <li>จำนวนกระสอบ = ปริมาณรวม ÷ ขนาดกระสอบ (ปัดขึ้น)</li>
                  <li>ต้นทุนรวม = จำนวนกระสอบ × ราคาต่อกระสอบ</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone">
              * เครื่องมือนี้ไม่แนะนำอัตราปุ๋ยเอง อัตราที่ใช้คำนวณมาจากตัวเลขที่คุณป้อนเท่านั้น
            </p>
          </>
        )}

        {mode === "npk" && npkError && (
          <div className="rounded-2xl bg-mist p-6">
            <p className="eyebrow">ไม่สามารถคำนวณได้</p>
            <p className="mt-2 text-sm text-ink">ค่า N, P, K ต้องอยู่ระหว่าง 0-100</p>
          </div>
        )}

        {mode === "npk" && npkResult && !npkError && (
          <>
            <div className="rounded-2xl bg-mist p-6">
              <p className="eyebrow">ธาตุอาหารที่ได้รับ</p>
              <div className="cc-table-wrap mt-2">
                <table>
                  <tbody>
                    <Row label="ไนโตรเจน (N)" value={`${num(npkResult.nKg)} กก.`} strong />
                    <Row label="ฟอสฟอรัส (P₂O₅)" value={`${num(npkResult.p2o5Kg)} กก.`} strong />
                    <Row label="โพแทสเซียม (K₂O)" value={`${num(npkResult.k2oKg)} กก.`} strong />
                  </tbody>
                </table>
              </div>

              <div className="cc-tip">
                <p className="cc-tip-title">หมายเหตุ</p>
                <p className="mt-2 text-xs text-stone">
                  สูตรปุ๋ยไทย (N-P-K บนถุง) แสดงค่า P เป็น P₂O₅ และ K เป็น K₂O อยู่แล้ว ตัวเลขข้างต้นจึงเป็นน้ำหนักของ
                  P₂O₅ และ K₂O ไม่ใช่ธาตุฟอสฟอรัสหรือโพแทสเซียมบริสุทธิ์
                </p>
              </div>
            </div>
          </>
        )}

        {hasResult && (
          <>
            <div className="mt-4">
              <p className="eyebrow">เครื่องมือที่เกี่ยวข้อง</p>
              <RelatedToolLinks
                tool={TOOL_SLUG}
                links={[
                  { href: "/tools/land-area-converter", label: "แปลงหน่วยพื้นที่ ไร่ งาน ตารางวา" },
                  { href: "/tools/plant-spacing-calculator", label: "คำนวณจำนวนต้นที่ปลูกได้" },
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
