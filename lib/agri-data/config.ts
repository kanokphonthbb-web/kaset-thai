// ─────────────────────────────────────────────────────────────
// NABC config gate — เปิดใช้งานจริงเมื่อมี env ครบเท่านั้น (ตามสไตล์ components/Analytics.tsx:8-12
// ที่ใช้การมี/ไม่มี env var เป็นสวิตช์เปิด-ปิดฟีเจอร์ ไม่ hardcode ค่าใดๆ)
//   NABC_API_KEY   = API key จาก NABC/OAE developer portal
//   NABC_BASE_URL  = base URL ของ NABC API (ถ้าไม่ตั้ง จะใช้ค่า default ด้านล่าง)
//   NABC_AUTH_STYLE = "x-api-key" | "bearer" (default: bearer) — ดู nabcClient.ts
// ปัจจุบัน (2026-08-18) ยังไม่มี NABC_API_KEY และโดเมน default ยัง DNS ไม่ resolve
// ดู docs/api-notes/NABC_API_NOTES.md
// ─────────────────────────────────────────────────────────────

const DEFAULT_NABC_BASE_URL = "https://api.nabc.oae.go.th";

export function isNabcConfigured(): boolean {
  return Boolean(process.env.NABC_API_KEY && process.env.NABC_BASE_URL);
}

export function nabcBaseUrl(): string {
  return process.env.NABC_BASE_URL || DEFAULT_NABC_BASE_URL;
}
