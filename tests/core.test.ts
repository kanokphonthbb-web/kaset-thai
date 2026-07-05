import { test } from "node:test";
import assert from "node:assert/strict";

import { searchContent } from "../lib/data";
import { countWords, findForbidden, analyzeSeo } from "../lib/seoAnalysis";
import { validateArticle } from "../lib/articleValidator";
import {
  compileBlocks,
  htmlToAnalysisBlocks,
  tocFromHtml,
  ensureHeadingIds,
  type Block,
} from "../lib/blocks";
import { DISEASES, DISEASE_GROUPS } from "../lib/diseaseData";
import { CROPS } from "../lib/cropCalendar";

// ── Search ─────────────────────────────────────────────
test("search finds article for 'ไก่'", () => {
  const r = searchContent("ไก่");
  assert.ok(r.length > 0);
  assert.ok(r.some((x) => x.title.includes("ไก่")));
});

test("search resolves 'ปลูกทุเรียน' -> crop ทุเรียน (bidirectional match)", () => {
  const r = searchContent("ปลูกทุเรียน");
  assert.ok(r.some((x) => x.type === "พืช" && x.title === "ทุเรียน"));
});

test("search finds disease for 'โรคใบไหม้'", () => {
  const r = searchContent("โรคใบไหม้");
  assert.ok(r.some((x) => x.type === "โรค"));
});

test("search returns nothing for gibberish", () => {
  assert.equal(searchContent("zzqqxx123").length, 0);
});

// ── SEO helpers ────────────────────────────────────────
test("findForbidden catches guarantee words", () => {
  assert.deepEqual(findForbidden("ปลูกแล้วรวยแน่นอน 100%").sort(), ["100%", "รวยแน่นอน"].sort());
  assert.equal(findForbidden("ปลูกผักได้ผลดีตามการดูแล").length, 0);
});

test("countWords estimates Thai text", () => {
  assert.ok(countWords("การเลี้ยงไก่ไข่สำหรับมือใหม่เริ่มต้นได้ง่าย") > 3);
});

// ── Validator ──────────────────────────────────────────
const goodBlocks: Block[] = [
  { id: "1", type: "heading", level: 2, text: "หัวข้อหลัก" },
  { id: "2", type: "paragraph", text: "เนื้อหา ".repeat(400) },
  { id: "3", type: "list", ordered: false, items: ["a", "b"] },
];
const goodFaqs = Array.from({ length: 5 }, (_, i) => ({ q: `ถาม ${i}`, a: `ตอบ ${i}` }));

test("validateArticle passes a complete article", () => {
  const v = validateArticle({
    title: "หัวข้อทดสอบ",
    slug: "test",
    metaDescription: "x".repeat(155),
    blocks: goodBlocks,
    faqs: goodFaqs,
  });
  assert.equal(v.ok, true, v.errors.join(","));
});

test("validateArticle blocks short content", () => {
  const v = validateArticle({
    title: "สั้น",
    slug: "s",
    metaDescription: "desc",
    blocks: [{ id: "1", type: "paragraph", text: "นิดเดียว" }],
    faqs: [],
  });
  assert.equal(v.ok, false);
});

test("validateArticle blocks forbidden guarantee words", () => {
  const v = validateArticle({
    title: "รวยแน่นอน",
    slug: "g",
    metaDescription: "m".repeat(155),
    blocks: goodBlocks,
    faqs: goodFaqs,
  });
  assert.equal(v.ok, false);
});

test("analyzeSeo returns a score 0-100", () => {
  const { score } = analyzeSeo({
    title: "หัวข้อ",
    seoTitle: "",
    metaDescription: "d".repeat(155),
    focusKeyword: "หัวข้อ",
    blocks: goodBlocks,
    faqs: goodFaqs,
  });
  assert.ok(score >= 0 && score <= 100);
});

// ── Blocks / HTML ──────────────────────────────────────
test("compileBlocks outputs HTML with heading id + table wrap", () => {
  const html = compileBlocks([
    { id: "1", type: "heading", level: 2, text: "สวัสดี" },
    { id: "2", type: "table", headers: ["a"], rows: [["1"]] },
  ]);
  assert.match(html, /<h2 id="[^"]+">สวัสดี<\/h2>/);
  assert.match(html, /cc-table-wrap/);
});

test("ensureHeadingIds + tocFromHtml build a TOC", () => {
  const html = ensureHeadingIds("<h2>บทนำ</h2><p>x</p><h2>สรุป</h2>");
  const toc = tocFromHtml(html);
  assert.equal(toc.length, 2);
  assert.equal(toc[0].text, "บทนำ");
});

test("htmlToAnalysisBlocks detects headings + list", () => {
  const b = htmlToAnalysisBlocks("<h2>ก</h2><p>ยาว ".repeat(1) + "</p><ul><li>1</li></ul>");
  assert.ok(b.some((x) => x.type === "heading"));
  assert.ok(b.some((x) => x.type === "list"));
});

// ── Data integrity ─────────────────────────────────────
test("disease data: 8 groups, all fields present", () => {
  assert.equal(DISEASE_GROUPS.length, 8);
  assert.ok(DISEASES.length >= 30);
  for (const d of DISEASES) {
    assert.ok(d.name && d.signs && d.cause);
    assert.ok(d.check.length > 0 && d.treat.length > 0 && d.prevent.length > 0);
  }
});

test("crop data: valid months 1-12 and harvest text", () => {
  assert.ok(CROPS.length >= 30);
  for (const c of CROPS) {
    assert.ok(c.months.length > 0);
    assert.ok(c.months.every((m) => m >= 1 && m <= 12));
    assert.ok(c.harvest.length > 0);
  }
});
