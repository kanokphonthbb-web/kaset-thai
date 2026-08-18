// ─────────────────────────────────────────────────────────────
// Pure calculation logic for crop yield estimation (per-plant or per-area).
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type YieldFromPlantsInput = {
  plants: number;
  /** อัตรารอด (%) ถูก clamp 0-100 */
  survivalRatePct: number;
  yieldPerPlantKg: number;
  pricePerKg?: number;
};

export type YieldFromPlantsResult = {
  /** จำนวนต้นที่รอด (ปัดลง) */
  survivingPlants: number;
  totalYieldKg: number;
  /** รายได้โดยประมาณ — null ถ้าไม่ระบุราคา */
  estimatedRevenue: number | null;
};

/**
 * ประมาณผลผลิตจากจำนวนต้นและอัตรารอด
 * ต้นที่รอด = จำนวนต้น × อัตรารอด (%) (ปัดลง)
 * ผลผลิตรวม = ต้นที่รอด × ผลผลิตต่อต้น
 */
export function yieldFromPlants(input: YieldFromPlantsInput): YieldFromPlantsResult {
  const { plants, yieldPerPlantKg, pricePerKg } = input;
  const survivalRatePct = Math.min(100, Math.max(0, input.survivalRatePct));

  const survivingPlants = Math.floor(plants * (survivalRatePct / 100));
  const totalYieldKg = survivingPlants * yieldPerPlantKg;
  const estimatedRevenue =
    pricePerKg !== undefined && pricePerKg !== null ? totalYieldKg * pricePerKg : null;

  return { survivingPlants, totalYieldKg, estimatedRevenue };
}

export type YieldFromAreaInput = {
  areaRai: number;
  yieldPerRaiKg: number;
  pricePerKg?: number;
};

export type YieldFromAreaResult = {
  totalYieldKg: number;
  /** รายได้โดยประมาณ — null ถ้าไม่ระบุราคา */
  estimatedRevenue: number | null;
};

/**
 * ประมาณผลผลิตจากพื้นที่ปลูก
 * ผลผลิตรวม = พื้นที่ (ไร่) × ผลผลิตต่อไร่ (กก.)
 */
export function yieldFromArea(input: YieldFromAreaInput): YieldFromAreaResult {
  const { areaRai, yieldPerRaiKg, pricePerKg } = input;

  const totalYieldKg = areaRai * yieldPerRaiKg;
  const estimatedRevenue =
    pricePerKg !== undefined && pricePerKg !== null ? totalYieldKg * pricePerKg : null;

  return { totalYieldKg, estimatedRevenue };
}
