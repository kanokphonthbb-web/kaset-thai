import { NextResponse } from "next/server";
import { getProvinceWeather } from "@/lib/weather/weatherService";
import { findProvinceBySlug } from "@/lib/weather/locations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/weather/[province] — ใช้โดย Farm Dashboard (client) เท่านั้น
// ข้อมูลจริงถูกแคชที่ชั้น TMD fetch (~1 ชม.) แล้ว route นี้จึงไม่เพิ่มภาระ API ต้นทาง
// จำกัด param ให้เป็น slug จังหวัดที่รู้จักเท่านั้น — ไม่มีทางยิง upstream URL อื่นได้
export async function GET(_req: Request, { params }: { params: { province: string } }) {
  const slug = params.province;
  if (!findProvinceBySlug(slug)) {
    return NextResponse.json({ error: "ไม่รู้จักจังหวัดนี้" }, { status: 404 });
  }
  const view = await getProvinceWeather(slug);
  if (!view) {
    return NextResponse.json(
      { error: "แหล่งข้อมูลพยากรณ์ยังไม่ตอบสนองในขณะนี้" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      province: view.province,
      now: view.now,
      rain24hMm: view.rain24hMm,
      rain48hMm: view.rain48hMm,
      indicators: view.indicators,
      lowRainWindows6h: view.lowRainWindows6h.slice(0, 3),
      daily: view.daily.slice(0, 3),
      fetchedAt: view.fetchedAt,
      source: view.source,
    },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800" } },
  );
}
