// TMD nwpapi server adapter — SERVER-SIDE ONLY (ห้าม import จาก client component)
// สคีมาและพฤติกรรม API ยืนยันจาก preflight จริง: docs/api-notes/TMD_API_NOTES.md
import "server-only";

const TMD_BASE = "https://data.tmd.go.th/nwpapi/v1";

// กรอบพิกัดประเทศไทย — API ตอบ 302 (HTML) เมื่อพิกัดนอกเขต จึงต้องกันก่อนยิง
export const THAILAND_BBOX = { latMin: 5.5, latMax: 20.6, lonMin: 97.3, lonMax: 105.7 };

export function isInThailand(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= THAILAND_BBOX.latMin &&
    lat <= THAILAND_BBOX.latMax &&
    lon >= THAILAND_BBOX.lonMin &&
    lon <= THAILAND_BBOX.lonMax
  );
}

export interface HourlyPoint {
  /** ISO-8601 +07:00 เวลาที่พยากรณ์มีผล */
  time: string;
  tempC: number | null;
  humidityPct: number | null;
  rainMm: number | null;
  windSpeedMs: number | null;
  windDirDeg: number | null;
  cond: number | null;
}

export interface DailyPoint {
  time: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  humidityPct: number | null;
  rainMm: number | null;
  cond: number | null;
}

export interface ForecastResult<T> {
  location: { lat: number; lon: number };
  points: T[];
  /** เวลาที่เราดึงข้อมูล (ไม่ใช่เวลา TMD คำนวณโมเดล) */
  fetchedAt: string;
  source: "กรมอุตุนิยมวิทยา";
}

class TmdError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TmdError";
  }
}

function apiKey(): string {
  const key = process.env.TMD_API_KEY;
  if (!key) throw new TmdError("TMD_API_KEY is not configured");
  return key;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** cache ผ่าน Next Data Cache ราย URL — TTL 60 นาที ตามรอบอัปเดตโมเดล (ดู API notes) */
const REVALIDATE_SECONDS = 3600;

async function tmdFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const url = `${TMD_BASE}${path}?${new URLSearchParams(params)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${apiKey()}` },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(15000),
      redirect: "manual", // พิกัดนอกเขต → 302 ไปหน้า docs ต้องนับเป็น error ไม่ใช่ตามไป
    });
  } catch (e) {
    throw new TmdError(`TMD request failed: ${e instanceof Error ? e.message : "unknown"}`);
  }
  if (res.status !== 200) throw new TmdError(`TMD returned HTTP ${res.status}`, res.status);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new TmdError("TMD returned non-JSON response");
  return res.json();
}

function parseForecasts(
  json: unknown,
): { location: { lat: number; lon: number }; forecasts: Array<{ time: string; data: Record<string, unknown> }> } {
  const root = json as { WeatherForecasts?: Array<{ location?: { lat?: number; lon?: number }; forecasts?: unknown[] }> };
  const first = root?.WeatherForecasts?.[0];
  if (!first || !Array.isArray(first.forecasts)) throw new TmdError("Unexpected TMD response shape");
  return {
    location: { lat: num(first.location?.lat) ?? 0, lon: num(first.location?.lon) ?? 0 },
    forecasts: first.forecasts as Array<{ time: string; data: Record<string, unknown> }>,
  };
}

/** พยากรณ์รายชั่วโมง ณ จุดพิกัด (สูงสุด 48 ชม.) */
export async function fetchHourlyForecast(
  lat: number,
  lon: number,
  durationHours = 24,
): Promise<ForecastResult<HourlyPoint>> {
  if (!isInThailand(lat, lon)) throw new TmdError("Coordinates outside Thailand");
  const duration = Math.min(Math.max(Math.trunc(durationHours), 1), 48);
  const json = await tmdFetch("/forecast/location/hourly/at", {
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    fields: "tc,rh,rain,ws10m,wd10m,cond",
    duration: String(duration),
  });
  const { location, forecasts } = parseForecasts(json);
  return {
    location,
    points: forecasts.map((f) => ({
      time: f.time,
      tempC: num(f.data.tc),
      humidityPct: num(f.data.rh),
      rainMm: num(f.data.rain),
      windSpeedMs: num(f.data.ws10m),
      windDirDeg: num(f.data.wd10m),
      cond: num(f.data.cond),
    })),
    fetchedAt: new Date().toISOString(),
    source: "กรมอุตุนิยมวิทยา",
  };
}

/** พยากรณ์รายวัน ณ จุดพิกัด (horizon จริง ~9-10 วัน — อย่า assume ว่าได้ครบตามขอ) */
export async function fetchDailyForecast(
  lat: number,
  lon: number,
  durationDays = 7,
): Promise<ForecastResult<DailyPoint>> {
  if (!isInThailand(lat, lon)) throw new TmdError("Coordinates outside Thailand");
  const duration = Math.min(Math.max(Math.trunc(durationDays), 1), 10);
  const json = await tmdFetch("/forecast/location/daily/at", {
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    fields: "tc_max,tc_min,rh,rain,cond",
    duration: String(duration),
  });
  const { location, forecasts } = parseForecasts(json);
  return {
    location,
    points: forecasts.map((f) => ({
      time: f.time,
      tempMaxC: num(f.data.tc_max),
      tempMinC: num(f.data.tc_min),
      humidityPct: num(f.data.rh),
      rainMm: num(f.data.rain),
      cond: num(f.data.cond),
    })),
    fetchedAt: new Date().toISOString(),
    source: "กรมอุตุนิยมวิทยา",
  };
}

export function isTmdConfigured(): boolean {
  return Boolean(process.env.TMD_API_KEY);
}
