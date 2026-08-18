// ─────────────────────────────────────────────────────────────
// Thin re-export ของ nabcClient.ts ที่มี "server-only" guard จริง
// ใช้ import จากไฟล์นี้เฉพาะใน Next.js app code (Server Components / API routes)
// scripts ที่รันผ่าน tsx (node runtime ตรงๆ) ต้อง import จาก "./nabcClient" ตัวดิบแทน
// เพราะแพ็กเกจ "server-only" ไม่ได้ติดตั้งจริงใน node_modules — ใช้ได้เฉพาะผ่าน Next.js webpack alias
// ─────────────────────────────────────────────────────────────
import "server-only";

export * from "./nabcClient";
