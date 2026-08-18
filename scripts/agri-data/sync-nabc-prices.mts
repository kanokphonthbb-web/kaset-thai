// ─────────────────────────────────────────────────────────────
// sync-nabc-prices.mts — ดึงราคาสินค้าเกษตรจาก NABC API แล้วบันทึกลง cache tables
//
// วิธีใช้:
//   npx tsx scripts/agri-data/sync-nabc-prices.mts
//
// พฤติกรรม:
//   - ถ้ายังไม่ configure (NABC_API_KEY/NABC_BASE_URL) จะจบด้วยข้อความภาษาไทยทันที ไม่แตะ DB
//   - ดึง daily prices → validate/quarantine (ดู lib/agri-data/schema.ts) → upsert AgriProduct/AgriMarket
//     → insert AgriPriceSnapshot (append-only — ไม่เคย overwrite snapshot เก่า, ใช้ @@unique dedup
//     เพื่อข้ามแถวที่เคยบันทึกแล้ว)
//   - บันทึกผลการ sync ลง DataSyncRun เสมอ (ทั้งกรณีสำเร็จและ error) เพื่อ audit trail
//   - Idempotent: รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ (unique constraint บน [productId, marketId, priceType, sourceDate])
//
// import nabcClient.ts (ตัวดิบ ไม่มี "server-only") เพราะสคริปต์นี้รันผ่าน tsx (node runtime ตรงๆ)
// ไม่ผ่าน Next.js webpack — ดูคอมเมนต์ใน lib/agri-data/nabcClient.ts และ nabcClient.server.ts
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { isNabcConfigured } from "../../lib/agri-data/config";
import { fetchDailyPrices, NabcError } from "../../lib/agri-data/nabcClient";
import { normalizeDailyPrice } from "../../lib/agri-data/schema";

// ใช้ Turso ถ้ามี env (สำหรับ sync production) ไม่งั้นใช้ SQLite ไฟล์ (dev) — เหมือน scripts/seed.mjs
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
  if (!isNabcConfigured()) {
    console.log("ยังไม่ได้ตั้งค่า NABC_API_KEY และ/หรือ NABC_BASE_URL — ข้าม sync (สถานะที่คาดไว้ ณ 2026-08-18)");
    console.log("ดู docs/api-notes/NABC_API_NOTES.md — สคริปต์นี้ไม่แตะฐานข้อมูลเมื่อยังไม่ configure");
    return;
  }

  const prisma = await makePrisma();
  const startedAt = new Date();
  let status: "success" | "error" = "success";
  let error: string | null = null;
  let rowsReceived = 0;
  let rowsInserted = 0;
  let rowsUpdated = 0;

  try {
    const { valid, quarantined } = await fetchDailyPrices();
    rowsReceived = valid.length + quarantined.length;

    if (quarantined.length > 0) {
      console.warn(`Quarantined ${quarantined.length} แถว (ดูรายละเอียดด้านล่าง):`);
      for (const q of quarantined.slice(0, 20)) {
        console.warn(`  - ${JSON.stringify(q.errors)}`);
      }
    }

    for (const raw of valid) {
      const { product, market, snapshot } = normalizeDailyPrice(raw);

      const dbProduct = await prisma.agriProduct.upsert({
        where: { sourceProductId: product.sourceProductId },
        update: { nameTh: product.nameTh, category: product.category, unit: product.unit },
        create: { ...product, source: "nabc" },
      });
      rowsUpdated += 1;

      let dbMarket = null;
      if (market) {
        dbMarket = await prisma.agriMarket.upsert({
          where: { sourceMarketId: market.sourceMarketId },
          update: { name: market.name, province: market.province, marketType: market.marketType },
          create: market,
        });
      }

      // dedup: ข้ามถ้ามี snapshot ตรงกันอยู่แล้ว (append-only history, ไม่เคย overwrite)
      const existing = await prisma.agriPriceSnapshot.findUnique({
        where: {
          productId_marketId_priceType_sourceDate: {
            productId: dbProduct.id,
            marketId: dbMarket?.id ?? null,
            priceType: snapshot.priceType,
            sourceDate: snapshot.sourceDate,
          },
        },
      });

      if (existing) continue;

      await prisma.agriPriceSnapshot.create({
        data: {
          ...snapshot,
          productId: dbProduct.id,
          marketId: dbMarket?.id ?? null,
          fetchedAt: new Date(),
          source: "nabc",
        },
      });
      rowsInserted += 1;
    }

    console.log(`sync เสร็จ: received=${rowsReceived}, inserted=${rowsInserted}, quarantined=${quarantined.length}`);
  } catch (err) {
    status = "error";
    error = err instanceof NabcError ? err.message : String(err);
    console.error("sync ล้มเหลว:", error);
  } finally {
    await prisma.dataSyncRun.create({
      data: {
        source: "nabc",
        endpoint: "/v1/prices/daily",
        startedAt,
        completedAt: new Date(),
        status,
        rowsReceived,
        rowsInserted,
        rowsUpdated,
        error,
      },
    });
    await prisma.$disconnect();
  }
}

main();
