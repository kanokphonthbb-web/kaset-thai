// Weather view-model builder — รวม hourly + daily + indicators + rain windows
// สำหรับหน้า /weather และเครื่องมือที่ใช้พยากรณ์ ทุกอย่าง server-side
import "server-only";

import { fetchDailyForecast, fetchHourlyForecast, isTmdConfigured } from "./tmdClient";
import type { DailyPoint, HourlyPoint } from "./tmdClient";
import { findProvinceBySlug, type ProvinceLocation } from "./locations";
import { evaluateIndicators, findLowRainWindows, sumRain, type TriggeredIndicator } from "./rules";

export interface ProvinceWeatherView {
  province: ProvinceLocation;
  now: HourlyPoint | null;
  hourly: HourlyPoint[]; // 24 ชม.
  daily: DailyPoint[]; // ~7 วัน
  rain24hMm: number;
  rain48hMm: number;
  rain72hMm: number;
  indicators: TriggeredIndicator[];
  /** ช่วงฝนน้อยตามข้อมูลพยากรณ์ (ไม่ใช่ "ปลอดฝนแน่นอน") */
  lowRainWindows6h: Array<{ start: string; end: string; hours: number }>;
  fetchedAt: string;
  source: "กรมอุตุนิยมวิทยา";
}

/** เปิดหน้า weather สาธารณะหรือไม่ — ปิดได้ด้วย TMD_PUBLIC_WEATHER_ENABLED=false */
export function isPublicWeatherEnabled(): boolean {
  if (process.env.TMD_PUBLIC_WEATHER_ENABLED === "false") return false;
  return isTmdConfigured();
}

/**
 * ดึงพยากรณ์ครบชุดของจังหวัด — คืน null เมื่อดึงไม่ได้ (API ล่ม/ไม่ได้ตั้งค่า)
 * ผู้เรียกต้อง render สถานะ "แหล่งข้อมูลยังไม่ตอบสนอง" เอง ห้ามปล่อยหน้าพัง
 */
export async function getProvinceWeather(slug: string): Promise<ProvinceWeatherView | null> {
  const province = findProvinceBySlug(slug);
  if (!province || !isPublicWeatherEnabled()) return null;
  try {
    // hourly 48 ชม. (เอา 24 แสดง + 48 ใช้สะสมฝน), daily 7 วัน — ยิงขนาน
    const [hourlyRes, dailyRes] = await Promise.all([
      fetchHourlyForecast(province.lat, province.lon, 48),
      fetchDailyForecast(province.lat, province.lon, 7),
    ]);
    const hours48 = hourlyRes.points;
    const rainSeries = hours48.map((h) => ({ time: h.time, rainMm: h.rainMm ?? 0 }));
    const daily = dailyRes.points;
    const tempMaxNext24 = Math.max(
      ...hours48.slice(0, 24).map((h) => h.tempC ?? Number.NEGATIVE_INFINITY),
    );
    const maxWindNext24 = Math.max(
      ...hours48.slice(0, 24).map((h) => h.windSpeedMs ?? Number.NEGATIVE_INFINITY),
    );
    const rain24 = sumRain(rainSeries, 24);
    return {
      province,
      now: hours48[0] ?? null,
      hourly: hours48.slice(0, 24),
      daily,
      rain24hMm: rain24,
      rain48hMm: sumRain(rainSeries, 48),
      rain72hMm: sumRain(rainSeries, 48) + (daily[2]?.rainMm ?? 0), // hourly มีแค่ 48 ชม. — ชม.ที่ 49-72 ใช้ค่ารายวันของวันที่ 3 เสริม (ระบุใน UI ว่าเป็นค่าประมาณ)
      indicators: evaluateIndicators({
        rain24hMm: rain24,
        tempMaxC: Number.isFinite(tempMaxNext24) ? tempMaxNext24 : null,
        maxWindMs: Number.isFinite(maxWindNext24) ? maxWindNext24 : null,
      }),
      lowRainWindows6h: findLowRainWindows(rainSeries, 6),
      fetchedAt: hourlyRes.fetchedAt,
      source: "กรมอุตุนิยมวิทยา",
    };
  } catch {
    return null;
  }
}

/** ดึงเฉพาะ hourly 48 ชม. สำหรับเครื่องมือ rain window planner */
export async function getProvinceHourly48(slug: string): Promise<{
  province: ProvinceLocation;
  hourly: HourlyPoint[];
  fetchedAt: string;
} | null> {
  const province = findProvinceBySlug(slug);
  if (!province || !isPublicWeatherEnabled()) return null;
  try {
    const res = await fetchHourlyForecast(province.lat, province.lon, 48);
    return { province, hourly: res.points, fetchedAt: res.fetchedAt };
  } catch {
    return null;
  }
}
