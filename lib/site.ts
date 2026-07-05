// ตั้งค่า NEXT_PUBLIC_SITE_URL ตอน deploy (เช่น https://kaset-thai.com)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaset-thai.example.com"
).replace(/\/$/, "");
