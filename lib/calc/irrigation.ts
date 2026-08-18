// ─────────────────────────────────────────────────────────────
// Pure calculation logic for irrigation water usage / cost estimation.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

const LITERS_PER_CUBIC_M = 1000;

export type IrrigationInput = {
  plants: number;
  emittersPerPlant: number;
  litersPerHourPerEmitter: number;
  hoursPerCycle: number;
  cyclesPerDay: number;
  /** จำนวนวันต่อเดือนที่รดน้ำ ค่าเริ่มต้น 30 */
  daysPerMonth?: number;
  /** ราคาน้ำต่อ ลบ.ม. — ถ้าไม่ระบุจะไม่คำนวณค่าน้ำ */
  waterCostPerCubicM?: number;
};

export type IrrigationResult = {
  litersPerCycle: number;
  litersPerDay: number;
  cubicMPerDay: number;
  litersPerMonth: number;
  cubicMPerMonth: number;
  /** ค่าน้ำต่อเดือน — null ถ้าไม่ได้ระบุ waterCostPerCubicM (หรือติดลบ) */
  monthlyWaterCost: number | null;
};

/**
 * คำนวณปริมาณและค่าใช้จ่ายน้ำจากระบบน้ำหยด/สปริงเกลอร์
 * น้ำต่อรอบ = จำนวนต้น × หัวจ่ายต่อต้น × อัตราไหล (ลิตร/ชม.) × ชั่วโมงต่อรอบ
 * น้ำต่อวัน = น้ำต่อรอบ × จำนวนรอบต่อวัน
 * 1 ลบ.ม. = 1,000 ลิตร
 */
export function computeIrrigation(input: IrrigationInput): IrrigationResult {
  const {
    plants,
    emittersPerPlant,
    litersPerHourPerEmitter,
    hoursPerCycle,
    cyclesPerDay,
    waterCostPerCubicM,
  } = input;
  const daysPerMonth = input.daysPerMonth ?? 30;

  const litersPerCycle = plants * emittersPerPlant * litersPerHourPerEmitter * hoursPerCycle;
  const litersPerDay = litersPerCycle * cyclesPerDay;
  const cubicMPerDay = litersPerDay / LITERS_PER_CUBIC_M;
  const litersPerMonth = litersPerDay * daysPerMonth;
  const cubicMPerMonth = litersPerMonth / LITERS_PER_CUBIC_M;

  const monthlyWaterCost =
    waterCostPerCubicM !== undefined && waterCostPerCubicM !== null && waterCostPerCubicM >= 0
      ? cubicMPerMonth * waterCostPerCubicM
      : null;

  return {
    litersPerCycle,
    litersPerDay,
    cubicMPerDay,
    litersPerMonth,
    cubicMPerMonth,
    monthlyWaterCost,
  };
}
