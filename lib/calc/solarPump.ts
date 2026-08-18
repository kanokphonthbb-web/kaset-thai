// ─────────────────────────────────────────────────────────────
// Pure calculation logic for solar water pump sizing estimate.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type SolarPumpEstimateInput = {
  pumpWatts: number;
  hoursPerDay: number;
  sunHoursPerDay: number;
  systemLossPct?: number;
};

export type SolarPumpEstimateResult = {
  energyWhPerDay: number;
  /** กำลังแผงโซลาร์ที่ต้องการ (วัตต์) — null ถ้าชั่วโมงแดด <= 0 */
  requiredPanelWatts: number | null;
};

/**
 * ประมาณขนาดแผงโซลาร์เซลล์ที่ต้องใช้เพื่อขับปั๊มน้ำ จากกำลังปั๊ม ชั่วโมงใช้งาน
 * ชั่วโมงแดดต่อวัน และ % การสูญเสียของระบบ (สายไฟ, อินเวอร์เตอร์, แบตเตอรี่ ฯลฯ)
 *
 * หมายเหตุ: เป็นการประมาณขนาดแผงเบื้องต้นเท่านั้น การออกแบบระบบจริง (สายไฟ
 * คอนโทรลเลอร์ เบรกเกอร์ แรงดัน) ต้องให้ช่าง/วิศวกรตรวจ
 */
export function computeSolarPumpEstimate(
  input: SolarPumpEstimateInput
): SolarPumpEstimateResult {
  const { pumpWatts, hoursPerDay, sunHoursPerDay } = input;
  const systemLossPct = Math.min(90, Math.max(0, input.systemLossPct ?? 30));

  const energyWhPerDay = pumpWatts * hoursPerDay;
  const requiredPanelWatts =
    sunHoursPerDay > 0
      ? energyWhPerDay / (sunHoursPerDay * (1 - systemLossPct / 100))
      : null;

  return { energyWhPerDay, requiredPanelWatts };
}
