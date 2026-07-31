import { test } from "node:test";
import assert from "node:assert/strict";

import {
  groupKindOf,
  getSafetyContent,
  splitTreatByRisk,
  type GroupKind,
} from "../lib/diseaseSafety";
import { getProductSafetyStatus, filterDiseaseProductRoles } from "../lib/productSafety";
import { DISEASES, type Disease } from "../lib/diseaseData";

const ALLOWED_URLS = new Set([
  "https://www.doa.go.th",
  "https://www.doae.go.th",
  "https://www.moac.go.th",
  "https://www.ricethailand.go.th",
  "https://www.dld.go.th",
  "https://www.fisheries.go.th",
]);

const VALID_KINDS: GroupKind[] = ["plant", "rice", "livestock", "fishery"];

function makeDisease(overrides: Partial<Disease>): Disease {
  return {
    group: "พืชผัก–ไม้ผล",
    name: "โรคทดสอบ",
    signs: "",
    check: [],
    cause: "",
    treat: [],
    prevent: [],
    ...overrides,
  };
}

// ── groupKindOf ─────────────────────────────────────────
test("groupKindOf maps all 8 real group strings to the correct kind", () => {
  assert.equal(groupKindOf("พืชผัก–ไม้ผล"), "plant");
  assert.equal(groupKindOf("ข้าว"), "rice");
  assert.equal(groupKindOf("ปลา (ประมง)"), "fishery");
  assert.equal(groupKindOf("วัว-ควาย"), "livestock");
  assert.equal(groupKindOf("หมู"), "livestock");
  assert.equal(groupKindOf("เป็ด"), "livestock");
  assert.equal(groupKindOf("แพะ-แกะ"), "livestock");
  assert.equal(groupKindOf("ไก่"), "livestock");
});

// ── getSafetyContent ─────────────────────────────────────
test("getSafetyContent returns non-empty arrays for every kind", () => {
  for (const kind of VALID_KINDS) {
    const content = getSafetyContent({ group: kindToGroup(kind) });
    assert.ok(content.stopSignals.length > 0, `${kind} stopSignals`);
    assert.ok(content.consult.length > 0, `${kind} consult`);
    assert.ok(content.ppe.length > 0, `${kind} ppe`);
    assert.ok(content.sources.length > 0, `${kind} sources`);
  }
});

test("every source URL starts with https:// and belongs to the fixed allowed set", () => {
  for (const kind of VALID_KINDS) {
    const content = getSafetyContent({ group: kindToGroup(kind) });
    for (const source of content.sources) {
      assert.ok(source.url.startsWith("https://"), `${source.url} should start with https://`);
      assert.ok(ALLOWED_URLS.has(source.url), `${source.url} should be in the allowed set`);
    }
  }
});

function kindToGroup(kind: GroupKind): string {
  switch (kind) {
    case "plant":
      return "พืชผัก–ไม้ผล";
    case "rice":
      return "ข้าว";
    case "fishery":
      return "ปลา (ประมง)";
    case "livestock":
      return "ไก่";
  }
}

// ── splitTreatByRisk ──────────────────────────────────────
test("splitTreatByRisk fallback heuristic sorts by regulated keyword presence", () => {
  const disease = makeDisease({
    treat: ["พ่นสารกำจัดเชื้อรา", "ตัดใบที่เป็นโรคทิ้ง"],
  });
  const { lowRisk, needsConsult } = splitTreatByRisk(disease);
  assert.deepEqual(needsConsult, ["พ่นสารกำจัดเชื้อรา"]);
  assert.deepEqual(lowRisk, ["ตัดใบที่เป็นโรคทิ้ง"]);
});

test("splitTreatByRisk respects lowRiskTreatIdx when present, overriding the heuristic", () => {
  const disease = makeDisease({
    treat: ["พ่นสารกำจัดเชื้อรา", "ตัดใบที่เป็นโรคทิ้ง", "ลดความชื้น"],
    lowRiskTreatIdx: [0, 2], // force index 0 (has keyword) into lowRisk
  });
  const { lowRisk, needsConsult } = splitTreatByRisk(disease);
  assert.deepEqual(lowRisk, ["พ่นสารกำจัดเชื้อรา", "ลดความชื้น"]);
  assert.deepEqual(needsConsult, ["ตัดใบที่เป็นโรคทิ้ง"]);
});

// ── getProductSafetyStatus ────────────────────────────────
test("getProductSafetyStatus: null slug returns do-not-show", () => {
  assert.equal(getProductSafetyStatus({ slug: null, name: "อะไรก็ได้" }), "do-not-show");
});

test("getProductSafetyStatus: unlisted + name matching regulated regex returns needs-registration-check", () => {
  assert.equal(
    getProductSafetyStatus({ slug: "some-unlisted-slug", name: "สารกำจัดเชื้อรา" }),
    "needs-registration-check",
  );
});

test("getProductSafetyStatus: unlisted + non-regulated name returns verified", () => {
  assert.equal(
    getProductSafetyStatus({ slug: "some-unlisted-slug", name: "ถุงมือยาง" }),
    "verified",
  );
});

// ── filterDiseaseProductRoles ─────────────────────────────
test("filterDiseaseProductRoles drops non-verified entries and keeps verified ones across all 4 role arrays", () => {
  const roles = {
    diagnose: [
      { name: "ถุงมือยาง", imageUrl: "", slug: "gloves" },
      { name: "สารกำจัดเชื้อรา", imageUrl: "", slug: "fungicide" },
      { name: "อุปกรณ์ไร้ slug", imageUrl: "", slug: null },
    ],
    manage: [{ name: "วัคซีน", imageUrl: "", slug: "vaccine" }],
    prevent: [{ name: "รองเท้าบูท", imageUrl: "", slug: "boots" }],
    ppe: [{ name: "แว่นตานิรภัย", imageUrl: "", slug: "goggles" }],
  };
  const filtered = filterDiseaseProductRoles(roles);
  assert.deepEqual(
    filtered.diagnose.map((e) => e.slug),
    ["gloves"],
  );
  assert.deepEqual(filtered.manage, []);
  assert.deepEqual(
    filtered.prevent.map((e) => e.slug),
    ["boots"],
  );
  assert.deepEqual(
    filtered.ppe.map((e) => e.slug),
    ["goggles"],
  );
});

// ── sanity sweep over real DISEASES data ──────────────────
test("getSafetyContent never throws and returns a valid kind for every real disease group in DISEASES", () => {
  for (const d of DISEASES) {
    assert.doesNotThrow(() => getSafetyContent({ group: d.group }));
    const kind = groupKindOf(d.group);
    assert.ok(VALID_KINDS.includes(kind), `unexpected kind "${kind}" for group "${d.group}"`);
  }
});
