// ─────────────────────────────────────────────────────────────
// Pure calculation logic for price change (absolute / percent) between two points.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type PriceChangeResult = {
  absolute: number | null;
  percent: number | null;
};

/**
 * คำนวณการเปลี่ยนแปลงราคาเทียบกับราคาก่อนหน้า
 * ผลต่าง = ราคาปัจจุบัน - ราคาก่อนหน้า
 * % เปลี่ยนแปลง = ผลต่าง / ราคาก่อนหน้า × 100
 * ถ้าไม่มีราคาก่อนหน้า (null/undefined) หรือราคาก่อนหน้าเป็น 0 จะคืนค่า null ทั้งคู่
 * (ไม่หารด้วยศูนย์ และไม่สร้างแนวโน้มปลอม)
 */
export function computePriceChange(
  current: number,
  previous: number | null | undefined
): PriceChangeResult {
  if (previous === null || previous === undefined || previous === 0) {
    return { absolute: null, percent: null };
  }

  const absolute = current - previous;
  const percent = (absolute / previous) * 100;

  return { absolute, percent };
}
