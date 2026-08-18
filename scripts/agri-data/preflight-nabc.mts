// ─────────────────────────────────────────────────────────────
// preflight-nabc.mts — ทดสอบว่า NABC API เข้าถึงได้จริงหรือยัง (ไม่เขียนอะไรลง DB)
//
// วิธีใช้:
//   npx tsx scripts/agri-data/preflight-nabc.mts
//
// สคริปต์นี้:
//   1. ตรวจ env (NABC_API_KEY, NABC_BASE_URL) — ถ้ายังไม่ครบ จะจบด้วยข้อความภาษาไทยที่ชัดเจน
//      (สถานะปัจจุบัน ณ 2026-08-18 คือยังไม่ครบ — โดเมน default DNS ยัง resolve ไม่ได้)
//   2. ถ้า config ครบ จะยิงคำขอทดสอบ auth + 3 endpoint หลัก (daily prices / crop production /
//      livestock census) แล้วพิมพ์ผลลัพธ์ (status, content-type, ตัวอย่างโครง JSON)
//   3. ไม่เขียนข้อมูลใดๆ ลงฐานข้อมูล — ใช้เพื่อสำรวจ/ยืนยัน schema จริงก่อนรัน sync-nabc-prices.mts
//
// เมื่อ preflight สำเร็จ: ให้ปรับ lib/agri-data/schema.ts ตามโครง JSON จริง แล้วอัปเดต
// docs/api-notes/NABC_API_NOTES.md ตามที่ระบุไว้ในไฟล์นั้น
// ─────────────────────────────────────────────────────────────

import { isNabcConfigured, nabcBaseUrl } from "../../lib/agri-data/config";
import { fetchDailyPrices, fetchCropProduction, fetchLivestockCensus, NabcError } from "../../lib/agri-data/nabcClient";

async function main() {
  console.log("=== NABC preflight ===");
  console.log(`NABC_BASE_URL (effective): ${nabcBaseUrl()}`);
  console.log(`NABC_API_KEY ตั้งค่าแล้ว: ${Boolean(process.env.NABC_API_KEY)}`);

  if (!isNabcConfigured()) {
    console.log("");
    console.log("ยังไม่ได้ตั้งค่า NABC_API_KEY และ/หรือ NABC_BASE_URL — นี่คือสถานะที่คาดไว้ในปัจจุบัน (2026-08-18)");
    console.log("ดู docs/api-notes/NABC_API_NOTES.md หัวข้อ 'To activate later' สำหรับขั้นตอนถัดไป");
    console.log("preflight จบโดยไม่เรียก API (ยังไม่ configure)");
    process.exit(0);
  }

  const checks: Array<{ name: string; run: () => Promise<unknown> }> = [
    { name: "fetchDailyPrices()", run: () => fetchDailyPrices() },
    { name: "fetchCropProduction(new Date().getFullYear())", run: () => fetchCropProduction(new Date().getFullYear()) },
    { name: "fetchLivestockCensus()", run: () => fetchLivestockCensus() },
  ];

  let anyFailed = false;

  for (const check of checks) {
    console.log("");
    console.log(`--- ${check.name} ---`);
    try {
      const result = await check.run();
      console.log("สำเร็จ. ตัวอย่างผลลัพธ์ (ตัดให้สั้น):");
      console.log(JSON.stringify(result, null, 2).slice(0, 2000));
    } catch (err) {
      anyFailed = true;
      if (err instanceof NabcError) {
        console.error(`NabcError: ${err.message}`);
      } else {
        console.error("Unexpected error:", err);
      }
    }
  }

  console.log("");
  if (anyFailed) {
    console.log("preflight พบข้อผิดพลาดอย่างน้อย 1 endpoint — ตรวจ auth style / base URL / response shape ก่อนรัน sync จริง");
    process.exit(1);
  } else {
    console.log("preflight ผ่านทุก endpoint — ตรวจโครง JSON จริงข้างต้นแล้วอัปเดต lib/agri-data/schema.ts + NABC_API_NOTES.md ก่อนรัน sync");
  }
}

main().catch((err) => {
  console.error("preflight ล้มเหลว:", err);
  process.exit(1);
});
