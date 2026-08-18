// ─────────────────────────────────────────────────────────────
// Pure calculation logic for FCR (Feed Conversion Ratio) in livestock/aquaculture.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type FcrInput = {
  feedConsumedKg: number;
  startWeightKg: number;
  endWeightKg: number;
  feedCostTotal?: number;
};

export type FcrResult = {
  weightGainKg: number;
  /** อัตราแลกเนื้อ (FCR) = อาหารที่กิน / น้ำหนักที่เพิ่ม — null ถ้าน้ำหนักไม่เพิ่ม (หารด้วยศูนย์/ติดลบไม่ได้) */
  fcr: number | null;
  /** ต้นทุนอาหารต่อน้ำหนักที่เพิ่ม 1 กก. — null ถ้าน้ำหนักไม่เพิ่มหรือไม่ระบุต้นทุนอาหาร */
  feedCostPerKgGain: number | null;
};

/**
 * คำนวณ FCR (Feed Conversion Ratio) — ยิ่งค่าน้อยยิ่งประหยัดอาหาร
 * น้ำหนักที่เพิ่ม = น้ำหนักสุดท้าย - น้ำหนักเริ่มต้น
 * FCR = อาหารที่กินทั้งหมด (กก.) / น้ำหนักที่เพิ่ม (กก.)
 */
export function computeFcr(input: FcrInput): FcrResult {
  const { feedConsumedKg, startWeightKg, endWeightKg, feedCostTotal } = input;

  const weightGainKg = endWeightKg - startWeightKg;
  const fcr = weightGainKg > 0 ? feedConsumedKg / weightGainKg : null;
  const feedCostPerKgGain =
    weightGainKg > 0 && feedCostTotal !== undefined && feedCostTotal !== null
      ? feedCostTotal / weightGainKg
      : null;

  return { weightGainKg, fcr, feedCostPerKgGain };
}
