// หน่วยพื้นที่ไทยกลางของทั้งระบบ — ทุก tool/บทความต้องอ้างจากไฟล์นี้ ห้าม hardcode ซ้ำ
// นิยามตามมาตรามาตรฐานไทย: 1 ไร่ = 1,600 ตร.ม. = 4 งาน, 1 งาน = 400 ตร.ม. = 100 ตารางวา,
// 1 ตารางวา = 4 ตร.ม.

export const SQM_PER_RAI = 1600;
export const NGAN_PER_RAI = 4;
export const SQM_PER_NGAN = 400;
export const SQWAH_PER_NGAN = 100;
export const SQM_PER_SQWAH = 4;
export const SQWAH_PER_RAI = NGAN_PER_RAI * SQWAH_PER_NGAN; // 400

// หน่วยสากล (นิยามแน่นอน ไม่ใช่ค่าประมาณ)
export const SQM_PER_HECTARE = 10000;
export const SQM_PER_ACRE = 4046.8564224;

export type AreaUnit = "rai" | "ngan" | "sqwah" | "sqm" | "hectare" | "acre";

export const AREA_UNIT_LABEL_TH: Record<AreaUnit, string> = {
  rai: "ไร่",
  ngan: "งาน",
  sqwah: "ตารางวา",
  sqm: "ตารางเมตร",
  hectare: "เฮกตาร์",
  acre: "เอเคอร์",
};

const SQM_PER_UNIT: Record<AreaUnit, number> = {
  rai: SQM_PER_RAI,
  ngan: SQM_PER_NGAN,
  sqwah: SQM_PER_SQWAH,
  sqm: 1,
  hectare: SQM_PER_HECTARE,
  acre: SQM_PER_ACRE,
};

export function toSquareMeters(value: number, unit: AreaUnit): number {
  return value * SQM_PER_UNIT[unit];
}

export function fromSquareMeters(sqm: number, unit: AreaUnit): number {
  return sqm / SQM_PER_UNIT[unit];
}

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  return fromSquareMeters(toSquareMeters(value, from), to);
}

/** พื้นที่แบบไทยผสม (ไร่-งาน-ตารางวา) → ตารางเมตร */
export function thaiCompositeToSqm(rai: number, ngan: number, sqwah: number): number {
  return rai * SQM_PER_RAI + ngan * SQM_PER_NGAN + sqwah * SQM_PER_SQWAH;
}

/**
 * ตารางเมตร → ไร่-งาน-ตารางวา แบบหน่วยเต็ม (ตารางวาปัดเป็นทศนิยม 2 ตำแหน่ง)
 * ใช้ epsilon กัน floating-point เพี้ยน เช่น 1600.0000000002 ต้องได้ 1 ไร่ 0 งาน 0 วา
 */
export function sqmToThaiComposite(sqm: number): { rai: number; ngan: number; sqwah: number } {
  const EPS = 1e-7;
  const totalSqwah = sqm / SQM_PER_SQWAH + EPS;
  const rai = Math.floor(totalSqwah / SQWAH_PER_RAI);
  const afterRai = totalSqwah - rai * SQWAH_PER_RAI;
  const ngan = Math.floor(afterRai / SQWAH_PER_NGAN);
  const sqwah = Math.round((afterRai - ngan * SQWAH_PER_NGAN - EPS) * 100) / 100;
  return { rai, ngan, sqwah };
}

/** แสดงผลพื้นที่แบบไทยอ่านง่าย เช่น "2 ไร่ 1 งาน 50 ตารางวา" (ข้ามหน่วยที่เป็นศูนย์ ยกเว้นทุกหน่วยเป็นศูนย์) */
export function formatThaiArea(sqm: number): string {
  const { rai, ngan, sqwah } = sqmToThaiComposite(sqm);
  const parts: string[] = [];
  if (rai > 0) parts.push(`${rai} ไร่`);
  if (ngan > 0) parts.push(`${ngan} งาน`);
  if (sqwah > 0) parts.push(`${sqwah} ตารางวา`);
  return parts.length ? parts.join(" ") : "0 ตารางวา";
}
