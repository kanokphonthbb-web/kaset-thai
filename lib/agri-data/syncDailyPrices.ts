// Core ของการ sync ราคารายวันจาก NABC — ใช้ร่วมกันระหว่าง
// scripts/agri-data/sync-nabc-prices.mts (รันมือ/CI) และ app/api/cron/sync-prices (Vercel Cron)
// append-only: ไม่เคย overwrite snapshot เก่า, idempotent ด้วยการเช็คแถวซ้ำก่อน insert
import type { PrismaClient } from "@prisma/client";
import { isNabcConfigured } from "./config";
import { fetchDailyPricesForDate, fetchLatestPriceDate, NabcError } from "./nabcClient";
import { normalizeDailyPrice } from "./schema";

export interface SyncResult {
  skipped: boolean;
  status: "success" | "error";
  latestDate?: string;
  rowsReceived: number;
  rowsInserted: number;
  quarantined: number;
  error?: string;
}

export async function syncDailyPrices(prisma: PrismaClient): Promise<SyncResult> {
  if (!isNabcConfigured()) {
    return { skipped: true, status: "success", rowsReceived: 0, rowsInserted: 0, quarantined: 0 };
  }

  const startedAt = new Date();
  let status: "success" | "error" = "success";
  let error: string | undefined;
  let rowsReceived = 0;
  let rowsInserted = 0;
  let quarantinedCount = 0;
  let latestDate: string | undefined;

  try {
    latestDate = await fetchLatestPriceDate();
    const { valid, quarantined } = await fetchDailyPricesForDate(latestDate);
    rowsReceived = valid.length + quarantined.length;
    quarantinedCount = quarantined.length;

    for (const raw of valid) {
      const { product, market, snapshot } = normalizeDailyPrice(raw);

      const dbProduct = await prisma.agriProduct.upsert({
        where: { sourceProductId: product.sourceProductId },
        update: { nameTh: product.nameTh, category: product.category, unit: product.unit },
        create: { ...product, source: "nabc" },
      });

      let dbMarket = null;
      if (market) {
        dbMarket = await prisma.agriMarket.upsert({
          where: { sourceMarketId: market.sourceMarketId },
          update: { name: market.name, province: market.province, marketType: market.marketType },
          create: market,
        });
      }

      // findFirst (ไม่ใช่ findUnique) เพราะ marketId nullable — ดูคอมเมนต์ใน sync script
      const existing = await prisma.agriPriceSnapshot.findFirst({
        where: {
          productId: dbProduct.id,
          marketId: dbMarket?.id ?? null,
          priceType: snapshot.priceType,
          sourceDate: snapshot.sourceDate,
        },
        select: { id: true },
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
  } catch (err) {
    status = "error";
    error = err instanceof NabcError ? err.message : String(err);
  } finally {
    try {
      await prisma.dataSyncRun.create({
        data: {
          source: "nabc",
          endpoint: "daily-prices/date",
          startedAt,
          completedAt: new Date(),
          status,
          rowsReceived,
          rowsInserted,
          rowsUpdated: 0,
          error: error ?? null,
        },
      });
    } catch {
      // ถ้าเขียน audit row ไม่ได้ อย่าให้ sync ล้มไปด้วย
    }
  }

  return {
    skipped: false,
    status,
    latestDate,
    rowsReceived,
    rowsInserted,
    quarantined: quarantinedCount,
    error,
  };
}
