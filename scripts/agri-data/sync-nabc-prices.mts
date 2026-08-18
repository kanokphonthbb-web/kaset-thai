// ─────────────────────────────────────────────────────────────
// sync-nabc-prices.mts — ดึงราคาสินค้าเกษตรรายวันจาก NABC (agriapi.nabc.go.th) ลง cache tables
//
// วิธีใช้ (โหลด Turso env ก่อนถ้าจะ sync production):
//   set -a; source .env.vercel; set +a
//   npx tsx scripts/agri-data/sync-nabc-prices.mts
//
// Logic จริงอยู่ที่ lib/agri-data/syncDailyPrices.ts (ใช้ร่วมกับ Vercel Cron
// /api/cron/sync-prices) — append-only + idempotent, บันทึก DataSyncRun ทุกครั้ง
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { syncDailyPrices } from "../../lib/agri-data/syncDailyPrices";

async function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}

async function main() {
  const prisma = await makePrisma();
  try {
    const result = await syncDailyPrices(prisma);
    if (result.skipped) {
      console.log("NABC ถูกปิดด้วย NABC_DISABLED=true — ข้าม sync, ไม่แตะฐานข้อมูล");
      return;
    }
    console.log(`วันที่ล่าสุดของแหล่งข้อมูล: ${result.latestDate ?? "-"}`);
    console.log(
      `sync ${result.status === "success" ? "เสร็จ" : "ล้มเหลว"}: received=${result.rowsReceived}, inserted=${result.rowsInserted}, quarantined=${result.quarantined}${result.error ? `, error=${result.error}` : ""}`,
    );
    if (result.status === "error") process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
