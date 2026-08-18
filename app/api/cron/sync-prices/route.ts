import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncDailyPrices } from "@/lib/agri-data/syncDailyPrices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron → GET /api/cron/sync-prices (ตาราง cron ใน vercel.json)
// ป้องกันการเรียกจากภายนอก: ถ้าตั้ง CRON_SECRET ไว้ ต้องส่ง Authorization: Bearer <secret>
// (Vercel ใส่ header นี้ให้อัตโนมัติเมื่อโปรเจกต์มี env CRON_SECRET)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await syncDailyPrices(prisma);
  return NextResponse.json(result, { status: result.status === "error" ? 500 : 200 });
}
