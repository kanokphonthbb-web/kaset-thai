import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProductEditorialContent,
  extractProductSourceFacts,
} from "../lib/productEditorial";

test("extracts only concrete facts visible in the merchant title", () => {
  assert.deepEqual(
    extractProductSourceFacts(
      "100ชิ้น ป้ายชื่อพืชรูปตัวที พลาสติกหนากันน้ำ สำหรับกระถาง",
    ),
    ["100ชิ้น", "พลาสติก", "กันน้ำ"],
  );
});

test("builds complete editorial guidance for an agricultural product family", () => {
  const content = buildProductEditorialContent(
    "100ชิ้น ป้ายชื่อพืชรูปตัวที พลาสติกหนากันน้ำ สำหรับกระถาง",
    "soil-water-fertilizer",
  );
  assert.ok(content);
  assert.equal(content.family, "plant-label");
  assert.ok(content.whyNeeded.length >= 40);
  assert.ok(content.usage.length >= 40);
  assert.ok(content.howToChoose.includes("100ชิ้น"));
  assert.ok(content.benefits.length >= 2);
  assert.ok(content.useCases.length >= 2);
  assert.ok(content.safetyNote.length >= 40);
});

test("does not generate copy for regulated or unrelated products", () => {
  assert.equal(
    buildProductEditorialContent("ปุ๋ยเร่งโต 1 กิโลกรัม", "plants"),
    null,
  );
  assert.equal(
    buildProductEditorialContent("เสื้อยืดลายฟาร์ม S-5XL", "agri-tech-tools"),
    null,
  );
});

test("does not mistake seed trays or soil meters for seeds and water tests", () => {
  assert.equal(
    buildProductEditorialContent(
      "ถาดเพาะเมล็ด 72 หลุม พร้อมฝาครอบ",
      "plants",
    )?.family,
    "planter",
  );
  assert.equal(
    buildProductEditorialContent(
      "เครื่องวัดค่า pH ดินและความชื้นในดิน",
      "agri-tech-tools",
    )?.family,
    "soil-test",
  );
  assert.equal(
    buildProductEditorialContent("หินลับจอบและลับเคียว", "plants")?.family,
    "sharpening-tool",
  );
});

test("keeps high-risk substances blocked while allowing clearly named equipment", () => {
  assert.equal(
    buildProductEditorialContent(
      "ถังให้อาหารไก่ ขนาด 3 ลิตร",
      "animals",
    )?.family,
    "feeder-waterer",
  );
  assert.equal(
    buildProductEditorialContent(
      "ชุดแถบทดสอบค่า pH น้ำจืดและน้ำเค็ม 100 ชิ้น",
      "fishery",
    )?.family,
    "water-test",
  );
  assert.equal(
    buildProductEditorialContent("จุลินทรีย์ปรับสภาพน้ำบ่อปลา", "fishery"),
    null,
  );
});
