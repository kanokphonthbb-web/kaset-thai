const bahtFmt = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 2,
});

/** จำนวนเงินบาท (ปัดเป็นจำนวนเต็ม) */
export function baht(n: number): string {
  if (!isFinite(n)) return "0";
  return bahtFmt.format(Math.round(n));
}

/** ตัวเลขทั่วไป (ทศนิยมไม่เกิน 2 ตำแหน่ง) */
export function num(n: number): string {
  if (!isFinite(n)) return "0";
  return numFmt.format(n);
}

/** แปลงค่า input ("" หรือ number) เป็น number ที่ปลอดภัย */
export function val(v: number | ""): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}
