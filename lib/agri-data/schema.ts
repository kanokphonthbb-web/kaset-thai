// ─────────────────────────────────────────────────────────────
// โครงจาก spec — ต้องปรับตาม response จริงเมื่อ API เข้าถึงได้
// Zod ยังไม่ได้ติดตั้งในโปรเจกต์นี้ จึงเขียน validator มือ (typeof checks) ตามสไตล์เดิมของโปรเจกต์
// เมื่อ NABC API เข้าถึงได้จริง: ต้องตรวจ response จริงแล้วปรับ type/validator เหล่านี้ทั้งหมด
// ห้าม fabricate ข้อมูล — validator เหล่านี้กัน (quarantine) แถวที่ผิดปกติ ไม่ throw ทิ้งทั้ง batch
// ─────────────────────────────────────────────────────────────

export type DailyPriceRaw = {
  product_id: string;
  product_name: string;
  category?: string;
  market_id?: string;
  market_name?: string;
  province?: string;
  market_type?: string;
  price_type: string; // "farm-gate" | "wholesale" | "retail"
  price_min?: number | null;
  price_max?: number | null;
  price_avg?: number | null;
  unit?: string;
  source_date: string; // ISO date string
};

export type CropProductionRaw = {
  crop_id: string;
  crop_name: string;
  year: number;
  province_id: string;
  province_name: string;
  planted_area_rai?: number | null;
  harvested_area_rai?: number | null;
  production_ton?: number | null;
  yield_per_rai_kg?: number | null;
  source_date?: string | null;
};

export type LivestockCensusRaw = {
  year: number;
  province_id: string;
  province_name: string;
  district_name?: string | null;
  livestock_type: string;
  farmer_count?: number | null;
  animal_count?: number | null;
  source_date?: string | null;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export type BatchValidationResult<T> = {
  valid: T[];
  quarantined: { row: unknown; errors: string[] }[];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumberOrNil(v: unknown): v is number | null | undefined {
  return v === null || v === undefined || (typeof v === "number" && Number.isFinite(v));
}

function isValidIsoDateString(v: unknown): v is string {
  if (typeof v !== "string" || v.trim().length === 0) return false;
  const t = Date.parse(v);
  return !Number.isNaN(t);
}

// ─────────────────────────────────────────────────────────────
// DailyPriceRaw
// ─────────────────────────────────────────────────────────────

export function validateDailyPrice(row: unknown): ValidationResult<DailyPriceRaw> {
  const errors: string[] = [];

  if (typeof row !== "object" || row === null) {
    return { ok: false, errors: ["row is not an object"] };
  }
  const r = row as Record<string, unknown>;

  if (!isNonEmptyString(r.product_id)) errors.push("missing/empty product_id");
  if (!isNonEmptyString(r.product_name)) errors.push("missing/empty product_name");
  if (!isNonEmptyString(r.price_type)) errors.push("missing/empty price_type");
  if (!isValidIsoDateString(r.source_date)) errors.push("missing/invalid source_date");
  if (!isFiniteNumberOrNil(r.price_min)) errors.push("price_min is not a valid number");
  if (!isFiniteNumberOrNil(r.price_max)) errors.push("price_max is not a valid number");
  if (!isFiniteNumberOrNil(r.price_avg)) errors.push("price_avg is not a valid number");

  // Data-QA: reject negative prices
  for (const key of ["price_min", "price_max", "price_avg"] as const) {
    const v = r[key];
    if (typeof v === "number" && v < 0) errors.push(`${key} is negative`);
  }

  // Data-QA: priceMin > priceMax
  if (typeof r.price_min === "number" && typeof r.price_max === "number" && r.price_min > r.price_max) {
    errors.push("price_min is greater than price_max");
  }

  // Data-QA: future sourceDate (> now + 1 day)
  if (isValidIsoDateString(r.source_date)) {
    const t = Date.parse(r.source_date as string);
    if (t > Date.now() + ONE_DAY_MS) errors.push("source_date is in the future");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: r as DailyPriceRaw };
}

export function validateDailyPriceBatch(rows: unknown[]): BatchValidationResult<DailyPriceRaw> {
  const valid: DailyPriceRaw[] = [];
  const quarantined: { row: unknown; errors: string[] }[] = [];
  for (const row of rows) {
    const result = validateDailyPrice(row);
    if (result.ok) valid.push(result.value);
    else quarantined.push({ row, errors: result.errors });
  }
  return { valid, quarantined };
}

// normalize: DailyPriceRaw -> DB model shapes (AgriProduct / AgriMarket / AgriPriceSnapshot)
export function normalizeDailyPrice(raw: DailyPriceRaw) {
  return {
    product: {
      sourceProductId: raw.product_id,
      nameTh: raw.product_name,
      category: raw.category || "อื่นๆ",
      unit: raw.unit ?? null,
    },
    market: raw.market_id
      ? {
          sourceMarketId: raw.market_id,
          name: raw.market_name || raw.market_id,
          province: raw.province ?? null,
          marketType: raw.market_type ?? null,
        }
      : null,
    snapshot: {
      priceType: raw.price_type,
      priceMin: raw.price_min ?? null,
      priceMax: raw.price_max ?? null,
      priceAvg: raw.price_avg ?? null,
      unit: raw.unit ?? null,
      sourceDate: new Date(raw.source_date),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// CropProductionRaw
// ─────────────────────────────────────────────────────────────

export function validateCropProduction(row: unknown): ValidationResult<CropProductionRaw> {
  const errors: string[] = [];

  if (typeof row !== "object" || row === null) {
    return { ok: false, errors: ["row is not an object"] };
  }
  const r = row as Record<string, unknown>;

  if (!isNonEmptyString(r.crop_id)) errors.push("missing/empty crop_id");
  if (!isNonEmptyString(r.crop_name)) errors.push("missing/empty crop_name");
  if (!isNonEmptyString(r.province_id)) errors.push("missing/empty province_id");
  if (!isNonEmptyString(r.province_name)) errors.push("missing/empty province_name");
  if (typeof r.year !== "number" || !Number.isFinite(r.year)) errors.push("missing/invalid year");
  if (!isFiniteNumberOrNil(r.planted_area_rai)) errors.push("planted_area_rai is not a valid number");
  if (!isFiniteNumberOrNil(r.harvested_area_rai)) errors.push("harvested_area_rai is not a valid number");
  if (!isFiniteNumberOrNil(r.production_ton)) errors.push("production_ton is not a valid number");
  if (!isFiniteNumberOrNil(r.yield_per_rai_kg)) errors.push("yield_per_rai_kg is not a valid number");

  if (r.source_date !== undefined && r.source_date !== null && !isValidIsoDateString(r.source_date)) {
    errors.push("invalid source_date");
  }
  if (r.source_date && isValidIsoDateString(r.source_date)) {
    const t = Date.parse(r.source_date as string);
    if (t > Date.now() + ONE_DAY_MS) errors.push("source_date is in the future");
  }

  for (const key of ["planted_area_rai", "harvested_area_rai", "production_ton", "yield_per_rai_kg"] as const) {
    const v = r[key];
    if (typeof v === "number" && v < 0) errors.push(`${key} is negative`);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: r as CropProductionRaw };
}

export function validateCropProductionBatch(rows: unknown[]): BatchValidationResult<CropProductionRaw> {
  const valid: CropProductionRaw[] = [];
  const quarantined: { row: unknown; errors: string[] }[] = [];
  for (const row of rows) {
    const result = validateCropProduction(row);
    if (result.ok) valid.push(result.value);
    else quarantined.push({ row, errors: result.errors });
  }
  return { valid, quarantined };
}

export function normalizeCropProduction(raw: CropProductionRaw) {
  return {
    cropSourceId: raw.crop_id,
    cropName: raw.crop_name,
    year: raw.year,
    provinceId: raw.province_id,
    provinceName: raw.province_name,
    plantedAreaRai: raw.planted_area_rai ?? null,
    harvestedAreaRai: raw.harvested_area_rai ?? null,
    productionTon: raw.production_ton ?? null,
    yieldPerRaiKg: raw.yield_per_rai_kg ?? null,
    sourceDate: raw.source_date ? new Date(raw.source_date) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// LivestockCensusRaw
// ─────────────────────────────────────────────────────────────

export function validateLivestockCensus(row: unknown): ValidationResult<LivestockCensusRaw> {
  const errors: string[] = [];

  if (typeof row !== "object" || row === null) {
    return { ok: false, errors: ["row is not an object"] };
  }
  const r = row as Record<string, unknown>;

  if (typeof r.year !== "number" || !Number.isFinite(r.year)) errors.push("missing/invalid year");
  if (!isNonEmptyString(r.province_id)) errors.push("missing/empty province_id");
  if (!isNonEmptyString(r.province_name)) errors.push("missing/empty province_name");
  if (!isNonEmptyString(r.livestock_type)) errors.push("missing/empty livestock_type");
  if (r.district_name !== undefined && r.district_name !== null && typeof r.district_name !== "string") {
    errors.push("district_name is not a string");
  }

  if (r.farmer_count !== undefined && r.farmer_count !== null) {
    if (typeof r.farmer_count !== "number" || !Number.isFinite(r.farmer_count)) errors.push("farmer_count is not a valid number");
    else if (r.farmer_count < 0) errors.push("farmer_count is negative");
  }
  if (r.animal_count !== undefined && r.animal_count !== null) {
    if (typeof r.animal_count !== "number" || !Number.isFinite(r.animal_count)) errors.push("animal_count is not a valid number");
    else if (r.animal_count < 0) errors.push("animal_count is negative");
  }

  if (r.source_date !== undefined && r.source_date !== null && !isValidIsoDateString(r.source_date)) {
    errors.push("invalid source_date");
  }
  if (r.source_date && isValidIsoDateString(r.source_date)) {
    const t = Date.parse(r.source_date as string);
    if (t > Date.now() + ONE_DAY_MS) errors.push("source_date is in the future");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: r as LivestockCensusRaw };
}

export function validateLivestockCensusBatch(rows: unknown[]): BatchValidationResult<LivestockCensusRaw> {
  const valid: LivestockCensusRaw[] = [];
  const quarantined: { row: unknown; errors: string[] }[] = [];
  for (const row of rows) {
    const result = validateLivestockCensus(row);
    if (result.ok) valid.push(result.value);
    else quarantined.push({ row, errors: result.errors });
  }
  return { valid, quarantined };
}

export function normalizeLivestockCensus(raw: LivestockCensusRaw) {
  return {
    year: raw.year,
    provinceId: raw.province_id,
    provinceName: raw.province_name,
    districtName: raw.district_name ?? null,
    livestockType: raw.livestock_type,
    farmerCount: raw.farmer_count ?? null,
    animalCount: raw.animal_count ?? null,
    sourceDate: raw.source_date ? new Date(raw.source_date) : null,
  };
}
