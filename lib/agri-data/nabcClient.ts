// ─────────────────────────────────────────────────────────────
// NABC API client (raw, ไม่มี "server-only" guard)
// ไฟล์นี้ไม่ import "server-only" โดยตั้งใจ เพื่อให้ scripts ที่รันผ่าน tsx (node runtime ตรงๆ
// ไม่ผ่าน Next.js webpack) เช่น scripts/agri-data/*.mts import ได้โดยไม่พัง
// (แพ็กเกจ "server-only" จริงๆ ไม่ได้ติดตั้งใน node_modules — Next.js alias มันภายใน webpack เท่านั้น
// การ import "server-only" ตรงๆ นอก Next.js runtime จะ throw "Cannot find module")
// โค้ดฝั่ง Next.js (app/ , API routes) ต้อง import จาก nabcClient.server.ts แทน เพื่อได้ guard จริง
//
// ปัจจุบัน NABC API (https://api.nabc.oae.go.th) ยัง DNS ไม่ resolve และไม่มี NABC_API_KEY
// ดู docs/api-notes/NABC_API_NOTES.md — ทุกฟังก์ชันด้านล่างจะ throw NabcError ทันทีถ้ายังไม่ configure
// ─────────────────────────────────────────────────────────────

import { isNabcConfigured, nabcBaseUrl } from "./config";
import {
  validateDailyPriceBatch,
  validateCropProductionBatch,
  validateLivestockCensusBatch,
  type DailyPriceRaw,
  type CropProductionRaw,
  type LivestockCensusRaw,
  type BatchValidationResult,
} from "./schema";

export class NabcError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "NabcError";
  }
}

const TIMEOUT_MS = 15_000;
const RETRY_BACKOFF_MS = 2_000;

function authHeaders(): Record<string, string> {
  // ตรวจจริง 2026-08-18: agriapi.nabc.go.th เป็น public API ไม่ต้องใช้ key
  // เผื่ออนาคตมีการเพิ่ม auth: ตั้ง NABC_API_KEY แล้ว client จะแนบ Bearer ให้อัตโนมัติ
  const apiKey = process.env.NABC_API_KEY;
  if (!apiKey) return {};
  if (process.env.NABC_AUTH_STYLE === "x-api-key") return { "x-api-key": apiKey };
  return { Authorization: `Bearer ${apiKey}` };
}

async function nabcFetch(path: string, params?: Record<string, string | undefined>): Promise<unknown> {
  if (!isNabcConfigured()) {
    throw new NabcError("NABC is not configured");
  }

  // join ด้วยมือ — new URL(relative, base) จะกลืน path segment สุดท้ายของ base ("/api") ทิ้ง
  const url = new URL(`${nabcBaseUrl()}/${path.replace(/^\//, "")}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const attempt = async (): Promise<unknown> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        headers: authHeaders(),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new NabcError(`NABC request failed: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new NabcError(`NABC response is not JSON (content-type: ${contentType})`);
      }

      try {
        return await res.json();
      } catch (err) {
        throw new NabcError("NABC response body is not valid JSON", err);
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    return await attempt();
  } catch (err) {
    // จำกัด retry แค่ 1 ครั้ง และเฉพาะ network-level error เท่านั้น (ไม่ retry บน 4xx/5xx หรือ JSON ผิดรูป)
    const isNetworkError =
      err instanceof TypeError || (err instanceof Error && err.name === "AbortError");
    if (!isNetworkError) throw err;

    await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
    return attempt();
  }
}

// รูปซองมาตรฐานของ agriapi: { success: boolean, data: ..., pagination?: {...} }
function unwrapEnvelope(raw: unknown, endpoint: string): unknown {
  const env = raw as { success?: boolean; data?: unknown; message?: string };
  if (!env || env.success !== true) {
    throw new NabcError(`NABC ${endpoint} returned success=false: ${env?.message ?? "unknown"}`);
  }
  return env.data;
}

/** วันที่ล่าสุดที่มีข้อมูลราคา (YYYY-MM-DD) */
export async function fetchLatestPriceDate(): Promise<string> {
  const data = unwrapEnvelope(await nabcFetch("daily-prices/latest-date"), "daily-prices/latest-date");
  const date = (data as { latest_date?: string })?.latest_date;
  if (typeof date !== "string" || !date) {
    throw new NabcError("NABC latest-date response missing latest_date");
  }
  return date;
}

/** ดึงราคารายวันทั้งหมดของวันที่กำหนด (ไล่ทุกหน้า) แล้ว validate/quarantine */
export async function fetchDailyPricesForDate(date: string): Promise<BatchValidationResult<DailyPriceRaw>> {
  const LIMIT = 100;
  const MAX_PAGES = 50; // กัน loop หลุด — ข้อมูลจริง ~50 แถว/วัน
  const rows: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const raw = (await nabcFetch("daily-prices/date", {
      date,
      limit: String(LIMIT),
      page: String(page),
    })) as { success?: boolean; data?: unknown[]; pagination?: { total?: number; count?: number } };
    const data = unwrapEnvelope(raw, "daily-prices/date");
    if (!Array.isArray(data)) throw new NabcError("Expected array data from daily-prices/date");
    rows.push(...data);
    const total = raw.pagination?.total ?? rows.length;
    if (rows.length >= total || data.length === 0) break;
  }
  return validateDailyPriceBatch(rows);
}

/** รายชื่อหมวดสินค้าที่มีข้อมูล (ใช้ตรวจสุขภาพ/preflight) */
export async function fetchPriceCategories(): Promise<string[]> {
  const data = unwrapEnvelope(await nabcFetch("daily-prices/categories"), "daily-prices/categories");
  if (!Array.isArray(data)) throw new NabcError("Expected array from daily-prices/categories");
  return data.filter((c): c is string => typeof c === "string");
}

// หมายเหตุ: agriapi มี endpoint /api/production และ /api/farmer-family ด้วย
// แต่ schema จริงยังไม่ได้ preflight — สองฟังก์ชันนี้จะใช้งานได้หลังตรวจ response จริง
// แล้วปรับ CropProductionRaw/LivestockCensusRaw ให้ตรง (ดู docs/api-notes/NABC_API_NOTES.md)
export async function fetchCropProduction(
  year: number,
  provinceId?: string
): Promise<BatchValidationResult<CropProductionRaw>> {
  const raw = await nabcFetch("production", { year: String(year), province_id: provinceId });
  const env = raw as { success?: boolean; data?: unknown };
  const data = env?.success === true ? env.data : raw;
  if (!Array.isArray(data)) {
    throw new NabcError("Expected array response from production");
  }
  return validateCropProductionBatch(data);
}

export async function fetchLivestockCensus(
  provinceId?: string
): Promise<BatchValidationResult<LivestockCensusRaw>> {
  const raw = await nabcFetch("farmer-family", { province_id: provinceId });
  const env = raw as { success?: boolean; data?: unknown };
  const data = env?.success === true ? env.data : raw;
  if (!Array.isArray(data)) {
    throw new NabcError("Expected array response from farmer-family");
  }
  return validateLivestockCensusBatch(data);
}
