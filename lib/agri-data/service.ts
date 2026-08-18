// ─────────────────────────────────────────────────────────────
// AgriculturalDataService — read-side helpers ที่ UI (สร้างแยกภายหลัง) จะเรียกใช้
// ทุกฟังก์ชัน Prisma-backed และ degrade เป็นค่าว่างเมื่อ error (ตามสไตล์ app/page.tsx:18-45)
// ห้ามสร้างข้อมูลราคาปลอม — ถ้าไม่มีข้อมูลในฐานข้อมูล ฟังก์ชันจะคืนค่าว่าง/null ไม่ใช่ตัวเลขสมมติ
// ─────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { computePriceChange, type PriceChangeResult } from "@/lib/calc/priceChange";

export type LatestPriceRow = {
  productId: string;
  productSlug: string | null;
  productName: string;
  category: string;
  unit: string | null;
  priceType: string;
  priceMin: number | null;
  priceMax: number | null;
  priceAvg: number | null;
  sourceDate: Date;
};

export type PriceDataStatus = {
  hasData: boolean;
  latestSourceDate: Date | null;
  productCount: number;
};

/**
 * ดึงราคาล่าสุด (snapshot ล่าสุดตาม sourceDate) ของแต่ละสินค้า พร้อมข้อมูลสินค้า
 */
export async function getLatestPrices(limit = 20): Promise<LatestPriceRow[]> {
  try {
    const products = await prisma.agriProduct.findMany({
      where: { active: true },
      include: {
        // ดึงหลาย snapshot ล่าสุดมา แล้วรวมเฉพาะของวันล่าสุด (สินค้าเดียวมีหลายตลาด/วัน)
        priceSnapshots: {
          orderBy: { sourceDate: "desc" },
          take: 30,
        },
      },
      take: limit,
    });

    return products
      .filter((p) => p.priceSnapshots.length > 0)
      .map((p) => {
        const latestDate = p.priceSnapshots[0].sourceDate;
        const latest = p.priceSnapshots.filter(
          (s) => s.sourceDate.getTime() === latestDate.getTime(),
        );
        // รวมราคาข้ามตลาดของวันล่าสุด: min/max = ช่วงราคาระหว่างตลาด, avg = ค่าเฉลี่ย
        const prices = latest
          .map((s) => s.priceAvg)
          .filter((v): v is number => v != null && Number.isFinite(v));
        const min = prices.length ? Math.min(...prices) : null;
        const max = prices.length ? Math.max(...prices) : null;
        const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
        return {
          productId: p.id,
          productSlug: p.slug,
          productName: p.nameTh,
          category: p.category,
          unit: p.unit ?? latest[0].unit,
          priceType: latest[0].priceType,
          priceMin: prices.length > 1 ? min : null,
          priceMax: prices.length > 1 ? max : null,
          priceAvg: avg,
          sourceDate: latestDate,
        };
      })
      .sort((a, b) => b.sourceDate.getTime() - a.sourceDate.getTime());
  } catch {
    return [];
  }
}

/**
 * ดึงประวัติราคาของสินค้าหนึ่งรายการ (สำหรับกราฟ) ย้อนหลัง N วัน
 */
export async function getPriceHistory(productSlugOrId: string, days = 30) {
  try {
    const product = await prisma.agriProduct.findFirst({
      where: { OR: [{ slug: productSlugOrId }, { id: productSlugOrId }] },
    });
    if (!product) return [];

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.agriPriceSnapshot.findMany({
      where: { productId: product.id, sourceDate: { gte: since } },
      orderBy: { sourceDate: "asc" },
    });
  } catch {
    return [];
  }
}

/**
 * สถานะข้อมูลราคาโดยรวม — UI ใช้ตัดสินใจว่าจะแสดง "ยังไม่ได้เชื่อมต่อแหล่งข้อมูลราคา" หรือไม่
 */
export async function getPriceDataStatus(): Promise<PriceDataStatus> {
  try {
    const [productCount, latest] = await Promise.all([
      prisma.agriProduct.count(),
      prisma.agriPriceSnapshot.findFirst({ orderBy: { sourceDate: "desc" } }),
    ]);

    return {
      hasData: productCount > 0 && Boolean(latest),
      latestSourceDate: latest?.sourceDate ?? null,
      productCount,
    };
  } catch {
    return { hasData: false, latestSourceDate: null, productCount: 0 };
  }
}

/**
 * เปรียบเทียบราคาล่าสุดกับราคาก่อนหน้าของสินค้า (สำหรับ trend/แนวโน้ม)
 * ไม่มีราคาก่อนหน้า -> คืนค่า null ทั้งคู่ (ไม่สร้างแนวโน้มปลอม)
 */
export async function computeChange(productId: string): Promise<PriceChangeResult> {
  try {
    const snapshots = await prisma.agriPriceSnapshot.findMany({
      where: { productId },
      orderBy: { sourceDate: "desc" },
      take: 2,
    });

    if (snapshots.length === 0 || snapshots[0].priceAvg === null) {
      return { absolute: null, percent: null };
    }
    if (snapshots.length < 2 || snapshots[1].priceAvg === null) {
      return { absolute: null, percent: null };
    }

    return computePriceChange(snapshots[0].priceAvg, snapshots[1].priceAvg);
  } catch {
    return { absolute: null, percent: null };
  }
}
