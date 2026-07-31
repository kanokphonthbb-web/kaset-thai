import { test } from "node:test";
import assert from "node:assert/strict";

import {
  addEntry,
  deleteEntry,
  filterEntries,
  fromCsv,
  parseEntries,
  summarize,
  toCsv,
  updateEntry,
  type FarmRecordEntry,
} from "../lib/farmRecord";

function makeEntry(overrides: Partial<FarmRecordEntry> = {}): FarmRecordEntry {
  return {
    id: overrides.id ?? "e1",
    date: overrides.date ?? "2026-07-01",
    activity: overrides.activity ?? "ให้ปุ๋ย",
    plot: overrides.plot ?? "แปลง 1",
    subject: overrides.subject ?? "ข้าวโพด",
    ...overrides,
  };
}

// ── CRUD ────────────────────────────────────────────────
test("addEntry appends a new entry with a generated id", () => {
  const result = addEntry([], { date: "2026-07-01", activity: "ปลูก", plot: "A", subject: "ข้าว" });
  assert.equal(result.length, 1);
  assert.ok(result[0].id);
  assert.equal(result[0].activity, "ปลูก");
});

test("updateEntry patches only the matching entry, keeps id stable", () => {
  const entries = [makeEntry({ id: "1" }), makeEntry({ id: "2", activity: "รดน้ำ" })];
  const result = updateEntry(entries, "1", { activity: "เก็บเกี่ยว" });
  assert.equal(result.find((e) => e.id === "1")?.activity, "เก็บเกี่ยว");
  assert.equal(result.find((e) => e.id === "2")?.activity, "รดน้ำ");
  assert.equal(result.length, 2);
});

test("deleteEntry removes only the matching entry", () => {
  const entries = [makeEntry({ id: "1" }), makeEntry({ id: "2" })];
  const result = deleteEntry(entries, "1");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "2");
});

// ── filterEntries ───────────────────────────────────────
test("filterEntries filters by date range", () => {
  const entries = [
    makeEntry({ id: "1", date: "2026-06-01" }),
    makeEntry({ id: "2", date: "2026-07-01" }),
    makeEntry({ id: "3", date: "2026-08-01" }),
  ];
  const result = filterEntries(entries, { from: "2026-06-15", to: "2026-07-15" });
  assert.deepEqual(result.map((e) => e.id), ["2"]);
});

test("filterEntries filters by type (income/expense/general)", () => {
  const entries = [
    makeEntry({ id: "1", income: 500 }),
    makeEntry({ id: "2", expense: 200 }),
    makeEntry({ id: "3" }),
  ];
  assert.deepEqual(filterEntries(entries, { type: "income" }).map((e) => e.id), ["1"]);
  assert.deepEqual(filterEntries(entries, { type: "expense" }).map((e) => e.id), ["2"]);
  assert.deepEqual(filterEntries(entries, { type: "general" }).map((e) => e.id), ["3"]);
});

// ── summarize ───────────────────────────────────────────
test("summarize computes correct totals for a mixed income/expense set", () => {
  const entries = [
    makeEntry({ id: "1", income: 1000 }),
    makeEntry({ id: "2", expense: 300 }),
    makeEntry({ id: "3", income: 500, expense: 100 }),
    makeEntry({ id: "4" }),
  ];
  const s = summarize(entries);
  assert.equal(s.totalIncome, 1500);
  assert.equal(s.totalExpense, 400);
  assert.equal(s.profit, 1100);
});

// ── CSV round-trip ──────────────────────────────────────
test("toCsv -> fromCsv round-trips a plain entry", () => {
  const entries = [makeEntry({ id: "1", income: 500, expense: 100 })];
  const csv = toCsv(entries);
  const parsed = fromCsv(csv);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, "1");
  assert.equal(parsed[0].activity, "ให้ปุ๋ย");
  assert.equal(parsed[0].income, 500);
  assert.equal(parsed[0].expense, 100);
});

test("toCsv -> fromCsv round-trips a value containing a comma", () => {
  const entries = [makeEntry({ id: "1", notes: "ซื้อปุ๋ย, ยาฆ่าแมลง, เมล็ดพันธุ์" })];
  const csv = toCsv(entries);
  const parsed = fromCsv(csv);
  assert.equal(parsed[0].notes, "ซื้อปุ๋ย, ยาฆ่าแมลง, เมล็ดพันธุ์");
});

test("toCsv -> fromCsv round-trips a value containing a newline and quotes", () => {
  const entries = [
    makeEntry({ id: "1", notes: 'บรรทัดแรก\nบรรทัดสอง มี "คำพูด" ด้วย' }),
  ];
  const csv = toCsv(entries);
  const parsed = fromCsv(csv);
  assert.equal(parsed[0].notes, 'บรรทัดแรก\nบรรทัดสอง มี "คำพูด" ด้วย');
});

test("toCsv -> fromCsv round-trips multiple entries in order", () => {
  const entries = [
    makeEntry({ id: "1", activity: "ปลูก" }),
    makeEntry({ id: "2", activity: "เก็บเกี่ยว, ขาย" }),
    makeEntry({ id: "3", activity: "รดน้ำ\nใส่ปุ๋ย" }),
  ];
  const parsed = fromCsv(toCsv(entries));
  assert.equal(parsed.length, 3);
  assert.deepEqual(
    parsed.map((e) => e.activity),
    ["ปลูก", "เก็บเกี่ยว, ขาย", "รดน้ำ\nใส่ปุ๋ย"],
  );
});

// ── parseEntries defensive parsing ──────────────────────
test("parseEntries returns [] for null input", () => {
  assert.deepEqual(parseEntries(null), []);
});

test("parseEntries returns [] for malformed JSON without throwing", () => {
  assert.doesNotThrow(() => parseEntries("{not valid json"));
  assert.deepEqual(parseEntries("{not valid json"), []);
});

test("parseEntries returns [] for valid JSON that isn't an array", () => {
  assert.deepEqual(parseEntries('{"foo":"bar"}'), []);
});

test("parseEntries filters out malformed entries missing required fields", () => {
  const raw = JSON.stringify([{ id: "1", date: "2026-07-01" }, { foo: "bar" }, null]);
  const result = parseEntries(raw);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});
