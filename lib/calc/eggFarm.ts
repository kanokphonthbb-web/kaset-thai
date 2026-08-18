// ─────────────────────────────────────────────────────────────
// Pure calculation logic for egg-laying hen farm daily profit.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type EggFarmProfitInput = {
  hens: number;
  layRatePct: number;
  eggPrice: number;
  feedKgPerHenPerDay: number;
  feedPricePerKg: number;
  otherCostPerDay?: number;
};

export type EggFarmProfitResult = {
  eggsPerDay: number;
  revenuePerDay: number;
  feedCostPerDay: number;
  otherCostPerDay: number;
  profitPerDay: number;
  profitPerMonth: number;
};

/**
 * คำนวณกำไรฟาร์มไก่ไข่ต่อวันและต่อเดือน
 * จำนวนไข่ต่อวัน = จำนวนแม่ไก่ × อัตราการไข่ (%) — ไม่ปัดเศษ (ค่าเฉลี่ยจริงมีเศษได้)
 * อัตราการไข่ถูกจำกัดช่วง 0-100%
 */
export function computeEggFarmProfit(input: EggFarmProfitInput): EggFarmProfitResult {
  const { hens, layRatePct, eggPrice, feedKgPerHenPerDay, feedPricePerKg } = input;
  const otherCostPerDay = input.otherCostPerDay ?? 0;

  const clampedLayRatePct = Math.min(100, Math.max(0, layRatePct));

  const eggsPerDay = hens * (clampedLayRatePct / 100);
  const revenuePerDay = eggsPerDay * eggPrice;
  const feedCostPerDay = hens * feedKgPerHenPerDay * feedPricePerKg;
  const profitPerDay = revenuePerDay - feedCostPerDay - otherCostPerDay;
  const profitPerMonth = profitPerDay * 30;

  return {
    eggsPerDay,
    revenuePerDay,
    feedCostPerDay,
    otherCostPerDay,
    profitPerDay,
    profitPerMonth,
  };
}
