import { test } from "node:test";
import assert from "node:assert/strict";

import { PROVINCES, findProvinceBySlug, provincesByRegion } from "../lib/weather/locations";
import { condInfo, isRainCond } from "../lib/weather/condCodes";
import { AGRI_WEATHER_RULES, evaluateIndicators, findLowRainWindows, sumRain } from "../lib/weather/rules";

// ── locations ──────────────────────────────────────────

test("province table has all 77 provinces with unique slugs", () => {
  assert.equal(PROVINCES.length, 77);
  const slugs = new Set(PROVINCES.map((p) => p.slug));
  assert.equal(slugs.size, 77);
  const names = new Set(PROVINCES.map((p) => p.nameTh));
  assert.equal(names.size, 77);
});

test("all province coordinates are inside the Thailand bounding box", () => {
  for (const p of PROVINCES) {
    assert.ok(p.lat >= 5.5 && p.lat <= 20.6, `${p.nameTh} lat ${p.lat}`);
    assert.ok(p.lon >= 97.3 && p.lon <= 105.7, `${p.nameTh} lon ${p.lon}`);
  }
});

test("findProvinceBySlug resolves and rejects correctly", () => {
  assert.equal(findProvinceBySlug("chanthaburi")?.nameTh, "จันทบุรี");
  assert.equal(findProvinceBySlug("chiang-mai")?.region, "north");
  assert.equal(findProvinceBySlug("nowhere"), null);
});

test("provincesByRegion covers all provinces exactly once", () => {
  const grouped = provincesByRegion();
  const total = grouped.reduce((s, g) => s + g.provinces.length, 0);
  assert.equal(total, 77);
  assert.equal(grouped.length, 6);
});

// ── cond codes ─────────────────────────────────────────

test("condInfo maps known codes and never crashes on unknown", () => {
  assert.equal(condInfo(1).labelTh, "ท้องฟ้าแจ่มใส");
  assert.equal(condInfo(8).group, "thunder");
  assert.equal(condInfo(99).labelTh, "ไม่ระบุ");
  assert.equal(condInfo(null).group, "unknown");
  assert.ok(isRainCond(5));
  assert.ok(isRainCond(8));
  assert.ok(!isRainCond(1));
  assert.ok(!isRainCond(undefined));
});

// ── rule engine ────────────────────────────────────────

test("every rule carries an official source reference", () => {
  for (const r of AGRI_WEATHER_RULES) {
    assert.ok(r.source.includes("กรมอุตุนิยมวิทยา"), `${r.id} must cite TMD`);
    assert.ok(r.sourceVersion.length > 0);
  }
});

test("rain indicators follow TMD 24h accumulation criteria", () => {
  assert.equal(evaluateIndicators({ rain24hMm: 5 }).length, 0); // ฝนเล็กน้อย — ไม่ต้องเตือน
  assert.equal(evaluateIndicators({ rain24hMm: 20 })[0].id, "rain24h-moderate");
  assert.equal(evaluateIndicators({ rain24hMm: 50 })[0].id, "rain24h-heavy");
});

test("temperature indicators follow TMD hot/very-hot criteria", () => {
  assert.equal(evaluateIndicators({ tempMaxC: 34.9 }).length, 0);
  assert.equal(evaluateIndicators({ tempMaxC: 36 })[0].id, "temp-hot");
  assert.equal(evaluateIndicators({ tempMaxC: 40 })[0].id, "temp-very-hot");
});

test("wind indicator uses Beaufort strong-breeze threshold", () => {
  assert.equal(evaluateIndicators({ maxWindMs: 8 }).length, 0);
  assert.equal(evaluateIndicators({ maxWindMs: 12 })[0].id, "wind-strong");
});

test("evaluateIndicators skips null/missing values", () => {
  assert.deepEqual(evaluateIndicators({}), []);
  assert.deepEqual(evaluateIndicators({ rain24hMm: null, tempMaxC: null, maxWindMs: null }), []);
});

// ── rain windows ───────────────────────────────────────

const H = (time: string, rainMm: number) => ({ time, rainMm });

test("findLowRainWindows finds contiguous low-rain stretches", () => {
  const hours = [
    H("01:00", 0),
    H("02:00", 0),
    H("03:00", 0.05),
    H("04:00", 2.5), // ฝน — ตัด window
    H("05:00", 0),
    H("06:00", 0),
  ];
  const w3 = findLowRainWindows(hours, 3);
  assert.equal(w3.length, 1);
  assert.deepEqual(w3[0], { start: "01:00", end: "03:00", hours: 3 });
  const w2 = findLowRainWindows(hours, 2);
  assert.equal(w2.length, 2);
});

test("findLowRainWindows handles all-dry and all-wet inputs", () => {
  const dry = [H("01:00", 0), H("02:00", 0), H("03:00", 0)];
  assert.deepEqual(findLowRainWindows(dry, 3), [{ start: "01:00", end: "03:00", hours: 3 }]);
  const wet = [H("01:00", 5), H("02:00", 3)];
  assert.deepEqual(findLowRainWindows(wet, 1), []);
  assert.deepEqual(findLowRainWindows([], 1), []);
});

test("sumRain accumulates the first n hours only", () => {
  const hours = [H("a", 1), H("b", 2.5), H("c", 3), H("d", 100)];
  assert.equal(sumRain(hours, 3), 6.5);
  assert.equal(sumRain(hours, 0), 0);
  assert.equal(sumRain([], 24), 0);
});
