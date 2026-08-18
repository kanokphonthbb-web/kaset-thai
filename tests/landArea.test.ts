import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SQM_PER_RAI,
  SQM_PER_NGAN,
  SQM_PER_SQWAH,
  SQWAH_PER_RAI,
  convertArea,
  toSquareMeters,
  fromSquareMeters,
  thaiCompositeToSqm,
  sqmToThaiComposite,
  formatThaiArea,
} from "../lib/landArea";

test("Thai land constants match the standard definitions", () => {
  assert.equal(SQM_PER_RAI, 1600);
  assert.equal(SQM_PER_NGAN, 400);
  assert.equal(SQM_PER_SQWAH, 4);
  assert.equal(SQWAH_PER_RAI, 400);
});

test("convertArea round-trips between all Thai units", () => {
  assert.equal(convertArea(1, "rai", "ngan"), 4);
  assert.equal(convertArea(1, "rai", "sqwah"), 400);
  assert.equal(convertArea(1, "rai", "sqm"), 1600);
  assert.equal(convertArea(1, "ngan", "sqwah"), 100);
  assert.equal(convertArea(1, "ngan", "sqm"), 400);
  assert.equal(convertArea(1, "sqwah", "sqm"), 4);
  assert.equal(convertArea(2.5, "rai", "sqm"), 4000);
  assert.equal(convertArea(4000, "sqm", "rai"), 2.5);
});

test("international unit conversions use exact definitions", () => {
  assert.equal(convertArea(1, "hectare", "sqm"), 10000);
  assert.equal(convertArea(1, "hectare", "rai"), 6.25);
  assert.ok(Math.abs(convertArea(1, "acre", "sqm") - 4046.8564224) < 1e-9);
  assert.ok(Math.abs(convertArea(1, "acre", "rai") - 2.529285264) < 1e-6);
});

test("toSquareMeters / fromSquareMeters are inverses", () => {
  for (const unit of ["rai", "ngan", "sqwah", "sqm", "hectare", "acre"] as const) {
    const v = fromSquareMeters(toSquareMeters(123.45, unit), unit);
    assert.ok(Math.abs(v - 123.45) < 1e-9, `${unit} round trip`);
  }
});

test("thaiCompositeToSqm handles mixed rai-ngan-sqwah input", () => {
  assert.equal(thaiCompositeToSqm(1, 0, 0), 1600);
  assert.equal(thaiCompositeToSqm(0, 1, 0), 400);
  assert.equal(thaiCompositeToSqm(0, 0, 1), 4);
  assert.equal(thaiCompositeToSqm(2, 1, 50), 2 * 1600 + 400 + 200);
});

test("sqmToThaiComposite decomposes back to whole Thai units", () => {
  assert.deepEqual(sqmToThaiComposite(1600), { rai: 1, ngan: 0, sqwah: 0 });
  assert.deepEqual(sqmToThaiComposite(2000), { rai: 1, ngan: 1, sqwah: 0 });
  assert.deepEqual(sqmToThaiComposite(3800), { rai: 2, ngan: 1, sqwah: 50 });
  assert.deepEqual(sqmToThaiComposite(0), { rai: 0, ngan: 0, sqwah: 0 });
});

test("sqmToThaiComposite is robust to floating-point noise", () => {
  assert.deepEqual(sqmToThaiComposite(1600.0000000002), { rai: 1, ngan: 0, sqwah: 0 });
  assert.deepEqual(sqmToThaiComposite(0.4 * 4000), { rai: 1, ngan: 0, sqwah: 0 });
});

test("formatThaiArea skips zero units and handles the all-zero case", () => {
  assert.equal(formatThaiArea(3800), "2 ไร่ 1 งาน 50 ตารางวา");
  assert.equal(formatThaiArea(1600), "1 ไร่");
  assert.equal(formatThaiArea(404), "1 งาน 1 ตารางวา");
  assert.equal(formatThaiArea(0), "0 ตารางวา");
});
