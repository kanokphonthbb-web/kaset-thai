// ─────────────────────────────────────────────────────────────
// Pure calculation logic for fertilizer plan / NPK content.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type FertilizerPlanInput = {
  areaRai: number;
  ratePerRaiKg: number;
  bagSizeKg: number;
  bagPrice: number;
};

export type FertilizerPlanResult = {
  totalKg: number;
  /** จำนวนกระสอบที่ต้องซื้อ (ปัดขึ้น) — null ถ้าขนาดกระสอบ <= 0 */
  bags: number | null;
  /** ต้นทุนรวม = จำนวนกระสอบ × ราคาต่อกระสอบ — null ถ้าขนาดกระสอบ <= 0 */
  totalCost: number | null;
  /** ต้นทุนต่อไร่ — null ถ้าพื้นที่ <= 0 หรือคำนวณต้นทุนรวมไม่ได้ */
  costPerRai: number | null;
};

/**
 * คำนวณแผนใช้ปุ๋ยจากอัตราต่อไร่และขนาดกระสอบ
 * ปริมาณรวม = พื้นที่ (ไร่) × อัตราต่อไร่ (กก.)
 * จำนวนกระสอบ = ปริมาณรวม / ขนาดกระสอบ (ปัดขึ้น เพราะซื้อเศษกระสอบไม่ได้)
 */
export function computeFertilizerPlan(input: FertilizerPlanInput): FertilizerPlanResult {
  const { areaRai, ratePerRaiKg, bagSizeKg, bagPrice } = input;

  const totalKg = areaRai * ratePerRaiKg;
  const bags = bagSizeKg > 0 ? Math.ceil(totalKg / bagSizeKg) : null;
  const totalCost = bags !== null ? bags * bagPrice : null;
  const costPerRai = areaRai > 0 && totalCost !== null ? totalCost / areaRai : null;

  return { totalKg, bags, totalCost, costPerRai };
}

export type NpkFormula = {
  n: number;
  p: number;
  k: number;
};

export type NpkContentInput = {
  formula: NpkFormula;
  amountKg: number;
};

export type NpkContentResult = {
  nKg: number;
  p2o5Kg: number;
  k2oKg: number;
};

/**
 * คำนวณปริมาณธาตุอาหารจากสูตรปุ๋ย (เช่น 15-15-15) และน้ำหนักปุ๋ยที่ใช้
 * หมายเหตุ: ตัวเลข P และ K ในสูตรปุ๋ยของไทยเป็น % ของ P₂O₅ และ K₂O อยู่แล้ว
 * (ไม่ใช่ธาตุ P และ K บริสุทธิ์) จึงไม่มีการแปลงหน่วยเพิ่มเติม — ตัวเลขในสูตรคือ
 * % ของออกไซด์โดยตรง
 */
export function computeNpkContent(input: NpkContentInput): NpkContentResult {
  const { formula, amountKg } = input;

  for (const [key, value] of Object.entries(formula)) {
    if (value < 0 || value > 100) {
      throw new RangeError(`Invalid NPK percentage for ${key}: ${value} (must be 0-100)`);
    }
  }

  return {
    nKg: amountKg * (formula.n / 100),
    p2o5Kg: amountKg * (formula.p / 100),
    k2oKg: amountKg * (formula.k / 100),
  };
}
