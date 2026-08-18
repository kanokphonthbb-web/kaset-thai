// ─────────────────────────────────────────────────────────────
// Pure calculation logic for break-even analysis.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type BreakEvenInput = {
  fixedCosts: number;
  variableCosts: number;
  expectedYieldKg: number;
  sellingPricePerKg: number;
};

export type BreakEvenResult = {
  totalCost: number;
  /** ราคาขายต่อกก. ที่คุ้มทุนพอดี — null ถ้าไม่มีผลผลิต */
  breakEvenPricePerKg: number | null;
  /** ผลผลิต (กก.) ที่ต้องขายให้คุ้มทุน — null ถ้าราคาขายเป็น 0 หรือติดลบ */
  breakEvenYieldKg: number | null;
  expectedRevenue: number;
  expectedProfit: number;
  /** ผลตอบแทนต่อการลงทุน (%) — null ถ้าต้นทุนรวมเป็น 0 */
  roiPct: number | null;
};

/**
 * วิเคราะห์จุดคุ้มทุนของการเพาะปลูก
 * ต้นทุนรวม = ต้นทุนคงที่ + ต้นทุนผันแปร
 * ราคาคุ้มทุน = ต้นทุนรวม / ผลผลิตที่คาดว่าจะได้
 * ผลผลิตคุ้มทุน = ต้นทุนรวม / ราคาขายต่อกก.
 */
export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCosts, variableCosts, expectedYieldKg, sellingPricePerKg } = input;

  const totalCost = fixedCosts + variableCosts;
  const breakEvenPricePerKg = expectedYieldKg > 0 ? totalCost / expectedYieldKg : null;
  const breakEvenYieldKg = sellingPricePerKg > 0 ? totalCost / sellingPricePerKg : null;
  const expectedRevenue = expectedYieldKg * sellingPricePerKg;
  const expectedProfit = expectedRevenue - totalCost;
  const roiPct = totalCost > 0 ? (expectedProfit / totalCost) * 100 : null;

  return {
    totalCost,
    breakEvenPricePerKg,
    breakEvenYieldKg,
    expectedRevenue,
    expectedProfit,
    roiPct,
  };
}
