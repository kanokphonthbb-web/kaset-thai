// รหัสสภาพอากาศ (cond) ของ TMD nwpapi — ตามเอกสาร API กรมอุตุนิยมวิทยา
// (data.tmd.go.th/nwpapi) ตรวจกับ response จริง 2026-08-18 (docs/api-notes/TMD_API_NOTES.md)

export interface CondInfo {
  code: number;
  labelTh: string;
  /** กลุ่มอย่างหยาบไว้ใช้เลือกไอคอน/สี — ไม่ใช่คำเตือนทางการ */
  group: "clear" | "cloudy" | "rain" | "thunder" | "cold" | "hot" | "unknown";
}

const COND_MAP: Record<number, CondInfo> = {
  1: { code: 1, labelTh: "ท้องฟ้าแจ่มใส", group: "clear" },
  2: { code: 2, labelTh: "มีเมฆบางส่วน", group: "clear" },
  3: { code: 3, labelTh: "เมฆเป็นส่วนมาก", group: "cloudy" },
  4: { code: 4, labelTh: "มีเมฆมาก", group: "cloudy" },
  5: { code: 5, labelTh: "ฝนตกเล็กน้อย", group: "rain" },
  6: { code: 6, labelTh: "ฝนปานกลาง", group: "rain" },
  7: { code: 7, labelTh: "ฝนตกหนัก", group: "rain" },
  8: { code: 8, labelTh: "ฝนฟ้าคะนอง", group: "thunder" },
  9: { code: 9, labelTh: "อากาศหนาวจัด", group: "cold" },
  10: { code: 10, labelTh: "อากาศหนาว", group: "cold" },
  11: { code: 11, labelTh: "อากาศเย็น", group: "cold" },
  12: { code: 12, labelTh: "อากาศร้อนจัด", group: "hot" },
};

/** คืนข้อมูลรหัสสภาพอากาศ — รหัสที่ไม่รู้จักต้องไม่ทำให้หน้าเว็บพัง */
export function condInfo(code: number | null | undefined): CondInfo {
  if (code != null && COND_MAP[code]) return COND_MAP[code];
  return { code: code ?? -1, labelTh: "ไม่ระบุ", group: "unknown" };
}

/** รหัสกลุ่มฝน (ใช้หา rain window) */
export function isRainCond(code: number | null | undefined): boolean {
  const g = condInfo(code).group;
  return g === "rain" || g === "thunder";
}
