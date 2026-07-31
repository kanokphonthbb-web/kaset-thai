import { test } from "node:test";
import assert from "node:assert/strict";

import {
  scoreGapReadiness,
  CHECKLIST,
  ALL_ITEMS,
  type AnswerValue,
} from "../lib/gapReadiness";

// ── All "yes" → top bucket ───────────────────────────────────────
test("all-yes answers produce the top bucket 'พร้อมเบื้องต้น'", () => {
  const answers: Record<string, AnswerValue> = {};
  for (const item of ALL_ITEMS) answers[item.id] = true;

  const result = scoreGapReadiness(answers);
  assert.equal(result.bucket, "พร้อมเบื้องต้น");
  assert.equal(result.overallPercent, 100);
  assert.equal(result.totalPassed, ALL_ITEMS.length);
  assert.equal(result.itemsToFix.length, 0);
});

// ── All "no"/"unsure" → bottom bucket ────────────────────────────
test("all-no/unsure answers produce the bottom bucket 'ยังขาดข้อมูลสำคัญ'", () => {
  const answers: Record<string, AnswerValue> = {};
  ALL_ITEMS.forEach((item, i) => {
    answers[item.id] = i % 2 === 0 ? false : "unsure";
  });

  const result = scoreGapReadiness(answers);
  assert.equal(result.bucket, "ยังขาดข้อมูลสำคัญ");
  assert.equal(result.totalPassed, 0);
  assert.equal(result.overallPercent, 0);
  assert.equal(result.itemsToFix.length, ALL_ITEMS.length);
});

// ── Mixed realistic answers → middle bucket + correct items-to-fix ──
test("mixed realistic answers produce 'ต้องปรับปรุงบางส่วน' with a matching items-to-fix list", () => {
  const answers: Record<string, AnswerValue> = {};
  const expectedFixIds: string[] = [];

  for (const category of CHECKLIST) {
    category.items.forEach((item, idx) => {
      if (idx === 0) {
        answers[item.id] = false; // first item of every category fails
        expectedFixIds.push(item.id);
      } else {
        answers[item.id] = true;
      }
    });
  }

  const result = scoreGapReadiness(answers);

  const totalItems = ALL_ITEMS.length;
  const expectedPassed = totalItems - expectedFixIds.length;
  const expectedRatio = expectedPassed / totalItems;
  assert.ok(expectedRatio >= 0.5 && expectedRatio < 0.9, "test setup should land in the middle bucket range");

  assert.equal(result.bucket, "ต้องปรับปรุงบางส่วน");
  assert.equal(result.totalPassed, expectedPassed);

  const actualFixIds = result.itemsToFix.map((it) => it.id).sort();
  assert.deepEqual(actualFixIds, expectedFixIds.sort());
  assert.ok(result.itemsToFix.every((it) => it.status === "no"));
});

// ── Empty/missing answers doesn't crash ──────────────────────────
test("empty/missing answers doesn't crash and treats every item as unanswered = worst case", () => {
  const result = scoreGapReadiness({});
  assert.equal(result.bucket, "ยังขาดข้อมูลสำคัญ");
  assert.equal(result.totalPassed, 0);
  assert.equal(result.itemsToFix.length, ALL_ITEMS.length);
  assert.ok(result.itemsToFix.every((it) => it.status === "unanswered"));
});

test("partially missing answers treats absent items as unanswered (worst case) without crashing", () => {
  const firstItem = ALL_ITEMS[0];
  const result = scoreGapReadiness({ [firstItem.id]: true });
  assert.equal(result.totalPassed, 1);
  assert.equal(result.itemsToFix.length, ALL_ITEMS.length - 1);
  const missingEntry = result.itemsToFix.find((it) => it.id !== firstItem.id);
  assert.ok(missingEntry);
  assert.equal(missingEntry!.status, "unanswered");
});

// ── Per-category scoring math is internally consistent ───────────
test("per-category scores are internally consistent (passed <= total, matches yes-count)", () => {
  const answers: Record<string, AnswerValue> = {};
  ALL_ITEMS.forEach((item, i) => {
    // deterministic pseudo-random mix of yes/no/unsure
    const mod = i % 3;
    answers[item.id] = mod === 0 ? true : mod === 1 ? false : "unsure";
  });

  const result = scoreGapReadiness(answers);

  for (const categoryScore of result.categoryScores) {
    assert.ok(categoryScore.passed <= categoryScore.total);
    const category = CHECKLIST.find((c) => c.id === categoryScore.category)!;
    const yesCount = category.items.filter((item) => answers[item.id] === true).length;
    assert.equal(categoryScore.passed, yesCount);
    assert.equal(categoryScore.total, category.items.length);
    assert.equal(categoryScore.itemsNeedingFix.length, categoryScore.total - categoryScore.passed);
  }

  const sumPassed = result.categoryScores.reduce((sum, c) => sum + c.passed, 0);
  assert.equal(sumPassed, result.totalPassed);
});
