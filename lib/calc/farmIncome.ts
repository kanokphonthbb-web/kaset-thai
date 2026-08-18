// ─────────────────────────────────────────────────────────────
// Pure calculation logic for farm income / profit estimation.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type FarmIncomeInput = {
  areaRai: number;
  yieldPerRai: number; // ผลผลิตต่อไร่ (กก.)
  pricePerKg: number;
  totalCost: number;
};

export type FarmIncomeResult = {
  totalYieldKg: number;
  revenue: number;
  cost: number;
  profit: number;
  /** กำไรเป็น % ของรายได้ — null ถ้ารายได้เป็น 0 (หารด้วยศูนย์ไม่ได้) */
  profitMarginPct: number | null;
  /** รายได้ต่อไร่ — null ถ้าพื้นที่ <= 0 */
  revenuePerRai: number | null;
  /** กำไรต่อไร่ — null ถ้าพื้นที่ <= 0 */
  profitPerRai: number | null;
  /** ราคาขายต่อกก. ที่ทำให้คุ้มทุนพอดี (ต้นทุนรวม / ผลผลิตรวม) — null ถ้าไม่มีผลผลิต */
  breakEvenPricePerKg: number | null;
};

/**
 * คำนวณรายได้-กำไรจากการทำฟาร์ม
 * ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)
 * รายได้ = ผลผลิตรวม × ราคาต่อกก.
 * กำไร = รายได้ - ต้นทุนรวม
 */
export function computeFarmIncome(input: FarmIncomeInput): FarmIncomeResult {
  const { areaRai, yieldPerRai, pricePerKg, totalCost } = input;

  const totalYieldKg = areaRai * yieldPerRai;
  const revenue = totalYieldKg * pricePerKg;
  const cost = totalCost;
  const profit = revenue - cost;

  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : null;
  const revenuePerRai = areaRai > 0 ? revenue / areaRai : null;
  const profitPerRai = areaRai > 0 ? profit / areaRai : null;
  const breakEvenPricePerKg = totalYieldKg > 0 ? totalCost / totalYieldKg : null;

  return {
    totalYieldKg,
    revenue,
    cost,
    profit,
    profitMarginPct,
    revenuePerRai,
    profitPerRai,
    breakEvenPricePerKg,
  };
}
