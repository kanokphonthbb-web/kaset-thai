// ─────────────────────────────────────────────────────────────
// Pure calculation logic for plant spacing / plant count estimation.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

import { SQM_PER_RAI } from "../landArea";

export type PlantSpacingInput = {
  areaSqm: number;
  rowSpacingM: number;
  plantSpacingM: number;
  /** % ของพื้นที่ที่ใช้ปลูกได้จริง (หักทางเดิน/คันดินฯลฯ) ค่าเริ่มต้น 100, ถูก clamp 0-100 */
  usablePct?: number;
};

export type PlantSpacingResult = {
  usableAreaSqm: number;
  areaPerPlantSqm: number;
  /** จำนวนต้นที่ปลูกได้ (ปัดลง) — null ถ้าระยะปลูกเป็น 0 หรือติดลบ */
  plantCount: number | null;
  /** จำนวนต้นต่อไร่ (ปัดลง) — null ถ้าระยะปลูกเป็น 0 หรือติดลบ */
  plantsPerRai: number | null;
};

/**
 * คำนวณจำนวนต้นที่ปลูกได้จากระยะปลูก
 * พื้นที่ใช้ปลูกได้ = พื้นที่ทั้งหมด × % ใช้ได้
 * พื้นที่ต่อต้น = ระยะระหว่างแถว × ระยะระหว่างต้น
 * จำนวนต้น = พื้นที่ใช้ปลูกได้ / พื้นที่ต่อต้น (ปัดลง)
 */
export function computePlantCount(input: PlantSpacingInput): PlantSpacingResult {
  const { areaSqm, rowSpacingM, plantSpacingM } = input;
  const usablePct = Math.min(100, Math.max(0, input.usablePct ?? 100));

  const usableAreaSqm = areaSqm * (usablePct / 100);
  const areaPerPlantSqm = rowSpacingM * plantSpacingM;

  const plantCount = areaPerPlantSqm > 0 ? Math.floor(usableAreaSqm / areaPerPlantSqm) : null;
  const plantsPerRai = areaPerPlantSqm > 0 ? Math.floor(SQM_PER_RAI / areaPerPlantSqm) : null;

  return { usableAreaSqm, areaPerPlantSqm, plantCount, plantsPerRai };
}
