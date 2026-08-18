// ─────────────────────────────────────────────────────────────
// Pure calculation logic for seed / seedling quantity planning.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type SeedPlanInput = {
  areaRai: number;
  seedRatePerRaiKg: number;
  pricePerKg?: number;
};

export type SeedPlanResult = {
  totalSeedKg: number;
  /** ต้นทุนรวมค่าเมล็ดพันธุ์ — null ถ้าไม่ได้ระบุราคาต่อกก. */
  totalCost: number | null;
  /** ต้นทุนต่อไร่ — null ถ้าไม่มีราคา หรือพื้นที่ <= 0 */
  costPerRai: number | null;
};

/**
 * คำนวณปริมาณเมล็ดพันธุ์ที่ต้องใช้จากอัตราต่อไร่และพื้นที่ปลูก
 * ปริมาณรวม = พื้นที่ (ไร่) × อัตราเมล็ดพันธุ์ต่อไร่ (กก.)
 */
export function computeSeedPlan(input: SeedPlanInput): SeedPlanResult {
  const { areaRai, seedRatePerRaiKg, pricePerKg } = input;

  const totalSeedKg = areaRai * seedRatePerRaiKg;
  const totalCost = pricePerKg !== undefined ? totalSeedKg * pricePerKg : null;
  const costPerRai = totalCost !== null && areaRai > 0 ? totalCost / areaRai : null;

  return { totalSeedKg, totalCost, costPerRai };
}
