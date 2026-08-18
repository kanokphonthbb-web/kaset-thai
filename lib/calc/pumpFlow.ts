// ─────────────────────────────────────────────────────────────
// Pure calculation logic for irrigation pump required flow rate.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type RequiredFlowInput = {
  totalLitersPerCycle: number;
  operatingHours: number;
};

export type RequiredFlowResult = {
  litersPerHour: number;
  cubicMPerHour: number;
};

/**
 * คำนวณอัตราการไหลที่ปั๊มต้องทำได้ จากปริมาณน้ำทั้งหมดที่ต้องการต่อรอบ
 * และจำนวนชั่วโมงที่เปิดปั๊ม
 *
 * หมายเหตุ: ผลลัพธ์เป็นอัตราการไหลขั้นต่ำที่ต้องการเท่านั้น การเลือกปั๊มจริงต้องคิด
 * Total Dynamic Head (ความสูงยก + friction loss) เพิ่ม — เครื่องมือนี้ไม่ได้คำนวณ head
 */
export function computeRequiredFlow(input: RequiredFlowInput): RequiredFlowResult | null {
  const { totalLitersPerCycle, operatingHours } = input;

  if (operatingHours <= 0) return null;

  const litersPerHour = totalLitersPerCycle / operatingHours;
  const cubicMPerHour = litersPerHour / 1000;

  return { litersPerHour, cubicMPerHour };
}
