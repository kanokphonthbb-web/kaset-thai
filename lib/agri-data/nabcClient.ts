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
  const apiKey = process.env.NABC_API_KEY || "";
  const style = process.env.NABC_AUTH_STYLE || "bearer";

  // วิธี auth จริงต้องตรวจจาก developer portal เมื่อเข้าถึงได้ — เลือกใช้แบบเดียวหลัง preflight
  // ตอนนี้ default เป็น Bearer token; ตั้ง NABC_AUTH_STYLE=x-api-key เพื่อสลับไปใช้ header x-api-key แทน
  if (style === "x-api-key") {
    return { "x-api-key": apiKey };
  }
  return { Authorization: `Bearer ${apiKey}` };
}

async function nabcFetch(path: string, params?: Record<string, string | undefined>): Promise<unknown> {
  if (!isNabcConfigured()) {
    throw new NabcError("NABC is not configured");
  }

  const url = new URL(path, nabcBaseUrl());
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

export async function fetchDailyPrices(productId?: string): Promise<BatchValidationResult<DailyPriceRaw>> {
  const raw = await nabcFetch("/v1/prices/daily", { product_id: productId });
  if (!Array.isArray(raw)) {
    throw new NabcError("Expected array response from /v1/prices/daily");
  }
  return validateDailyPriceBatch(raw);
}

export async function fetchCropProduction(
  year: number,
  provinceId?: string
): Promise<BatchValidationResult<CropProductionRaw>> {
  const raw = await nabcFetch("/v1/production/crop", { year: String(year), province_id: provinceId });
  if (!Array.isArray(raw)) {
    throw new NabcError("Expected array response from /v1/production/crop");
  }
  return validateCropProductionBatch(raw);
}

export async function fetchLivestockCensus(
  provinceId?: string
): Promise<BatchValidationResult<LivestockCensusRaw>> {
  const raw = await nabcFetch("/v1/livestock/census", { province_id: provinceId });
  if (!Array.isArray(raw)) {
    throw new NabcError("Expected array response from /v1/livestock/census");
  }
  return validateLivestockCensusBatch(raw);
}
