import { test } from "node:test";
import assert from "node:assert/strict";

import { recommendFarmingOptions, type FarmPlannerInput } from "../lib/farmPlanner";

const BANNED_PHRASES = ["ปลูกแล้วรวย", "กำไรแน่นอน", "เหมาะ 100%", "คืนทุนแน่นอน"];

function baseInput(overrides: Partial<FarmPlannerInput> = {}): FarmPlannerInput {
  return {
    province: "เชียงใหม่",
    landSizeRai: 2,
    waterSource: "มีน้ำตลอดปี",
    budget: 20000,
    timeAvailable: "ครึ่งวัน",
    experience: "เคยลองทำ",
    interest: "พืชผัก/ไม้ผล",
    incomeSpeed: "ปานกลาง(6-12 เดือน)",
    purpose: "รายได้เสริม",
    ...overrides,
  };
}

function allText(options: ReturnType<typeof recommendFarmingOptions>): string {
  return options
    .map((o) =>
      [
        o.name,
        o.whyItFits,
        o.budgetRange,
        o.timeToFirstYield,
        o.workload,
        o.risk,
        ...o.keyConditions,
        ...o.whatToStudy,
        ...o.equipment,
      ].join(" "),
    )
    .join(" ");
}

test("recommendFarmingOptions returns between 1 and 3 results for a variety of inputs", () => {
  const inputs: FarmPlannerInput[] = [
    baseInput(),
    baseInput({ interest: "ปศุสัตว์", experience: "ไม่มีประสบการณ์", landSizeRai: 0.5, budget: 5000 }),
    baseInput({ interest: "ประมง/สัตว์น้ำ", waterSource: "ต้องซื้อน้ำ", landSizeRai: 10, budget: 80000 }),
    baseInput({ interest: "แบบผสมผสาน", purpose: "เป็นอาชีพหลัก", timeAvailable: "เต็มเวลา" }),
    baseInput({ landSizeRai: 50, budget: 0, waterSource: "ไม่แน่ใจ" }),
  ];

  for (const input of inputs) {
    const result = recommendFarmingOptions(input);
    assert.ok(result.length >= 1 && result.length <= 3, `expected 1-3 results, got ${result.length}`);
  }
});

test("recommendFarmingOptions never returns banned promotional phrases", () => {
  const inputs: FarmPlannerInput[] = [
    baseInput(),
    baseInput({ interest: "ปศุสัตว์" }),
    baseInput({ interest: "ประมง/สัตว์น้ำ" }),
    baseInput({ interest: "แบบผสมผสาน" }),
    baseInput({ budget: 0, landSizeRai: 0 }),
    baseInput({ landSizeRai: 1000, budget: 1000000 }),
  ];

  for (const input of inputs) {
    const text = allText(recommendFarmingOptions(input));
    for (const phrase of BANNED_PHRASES) {
      assert.ok(!text.includes(phrase), `found banned phrase "${phrase}" in results for input ${JSON.stringify(input)}`);
    }
  }
});

test("a clearly-matching plant profile (land+water+experience+interest=พืชผัก) ranks a plant option first", () => {
  const input = baseInput({
    landSizeRai: 5,
    waterSource: "มีน้ำตลอดปี",
    budget: 50000,
    experience: "มีประสบการณ์",
    interest: "พืชผัก/ไม้ผล",
    incomeSpeed: "ระยะยาว(มากกว่า1ปี)",
    purpose: "เป็นอาชีพหลัก",
  });
  const result = recommendFarmingOptions(input);
  assert.ok(result.length > 0);
  assert.equal(result[0].category, "plants");
});

test("a clearly-matching fishery profile ranks a fishery option among the top 3", () => {
  const input = baseInput({
    landSizeRai: 3,
    waterSource: "มีน้ำตลอดปี",
    budget: 40000,
    experience: "มีประสบการณ์",
    interest: "ประมง/สัตว์น้ำ",
    incomeSpeed: "ปานกลาง(6-12 เดือน)",
    purpose: "เป็นอาชีพหลัก",
  });
  const result = recommendFarmingOptions(input);
  assert.ok(result.some((o) => o.category === "fishery"));
});

test("handles sparse/edge-case input (budget=0, tiny land) without crashing and still returns results", () => {
  const input = baseInput({ landSizeRai: 0, budget: 0, waterSource: "ไม่แน่ใจ" });
  assert.doesNotThrow(() => recommendFarmingOptions(input));
  const result = recommendFarmingOptions(input);
  assert.ok(result.length >= 1 && result.length <= 3);
});

test("handles unusually large land/budget input without crashing", () => {
  const input = baseInput({ landSizeRai: 100000, budget: 50_000_000 });
  assert.doesNotThrow(() => recommendFarmingOptions(input));
  const result = recommendFarmingOptions(input);
  assert.ok(result.length >= 1 && result.length <= 3);
});

test("every returned option includes non-empty guidance fields", () => {
  const result = recommendFarmingOptions(baseInput());
  for (const o of result) {
    assert.ok(o.name.length > 0);
    assert.ok(o.whyItFits.length > 0);
    assert.ok(o.budgetRange.length > 0);
    assert.ok(o.timeToFirstYield.length > 0);
    assert.ok(o.workload.length > 0);
    assert.ok(o.risk.length > 0);
    assert.ok(o.whatToStudy.length > 0);
    assert.ok(o.equipment.length > 0);
    assert.ok(o.relatedTools.length > 0);
    assert.ok(o.relatedArticles.length > 0);
  }
});
