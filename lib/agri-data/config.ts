// ─────────────────────────────────────────────────────────────
// NABC config — API จริงคือ NABC Agricultural Data Service (agriapi.nabc.go.th)
// ตรวจจริง 2026-08-18: เป็น PUBLIC API ไม่ต้องใช้ key (ดู docs/api-notes/NABC_API_NOTES.md)
// จึงเปิดใช้งานโดย default — ปิดได้ด้วย NABC_DISABLED=true (สวิตช์แบบ env ตามสไตล์โปรเจกต์)
//   NABC_BASE_URL = override base URL (ปกติไม่ต้องตั้ง)
// ─────────────────────────────────────────────────────────────

const DEFAULT_NABC_BASE_URL = "https://agriapi.nabc.go.th/api";

export function isNabcConfigured(): boolean {
  return process.env.NABC_DISABLED !== "true";
}

export function nabcBaseUrl(): string {
  return (process.env.NABC_BASE_URL || DEFAULT_NABC_BASE_URL).replace(/\/$/, "");
}
