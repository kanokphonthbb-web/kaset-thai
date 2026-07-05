import type { Block } from "./blocks";
import { blocksPlainText } from "./blocks";
import { getArticleType, HARD_MIN_WORDS } from "./articleTypes";

export type SeoCheck = {
  label: string;
  ok: boolean;
  level: "pass" | "warn" | "fail";
  hint?: string;
};

export type FaqItem = { q: string; a: string };

export type SeoInput = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  blocks: Block[];
  faqs: FaqItem[];
  articleType?: string;
};

// คำการันตีผลลัพธ์ที่ห้ามใช้ (E-E-A-T)
export const FORBIDDEN_WORDS = [
  "การันตีผล",
  "การันตีผลลัพธ์",
  "รับประกันผล",
  "ได้แน่นอน",
  "ได้ชัวร์",
  "รวยแน่นอน",
  "เห็นผลแน่นอน",
  "ไม่มีพลาด",
  "100%",
];

export function countWords(text: string): number {
  // ภาษาไทยไม่เว้นวรรคเป็นคำ — ประเมินคร่าว ๆ จากจำนวนตัวอักษร/6 + คำอังกฤษ
  const thai = (text.match(/[฀-๿]/g) || []).length;
  const other = (text.trim().match(/[A-Za-z0-9]+/g) || []).length;
  return Math.round(thai / 6) + other;
}

export function findForbidden(text: string): string[] {
  return FORBIDDEN_WORDS.filter((w) => text.includes(w));
}

export function analyzeSeo(input: SeoInput): { checks: SeoCheck[]; score: number } {
  const articleType = getArticleType(input.articleType);
  const plain = blocksPlainText(input.blocks);
  const words = countWords(plain);
  const effectiveTitle = input.seoTitle || input.title;
  const headings = input.blocks.filter((b) => b.type === "heading").length;
  const firstPara =
    input.blocks.find((b) => b.type === "paragraph") ??
    (undefined as Block | undefined);
  const firstParaText =
    firstPara && firstPara.type === "paragraph" ? firstPara.text : "";
  const kw = input.focusKeyword.trim();
  const forbidden = findForbidden(`${plain} ${input.metaDescription} ${effectiveTitle}`);

  const checks: SeoCheck[] = [
    {
      label: "Title ยาวไม่เกิน 60 ตัวอักษร",
      ok: effectiveTitle.length > 0 && effectiveTitle.length <= 60,
      level: effectiveTitle.length === 0 ? "fail" : effectiveTitle.length <= 60 ? "pass" : "warn",
      hint: `ตอนนี้ ${effectiveTitle.length} ตัวอักษร`,
    },
    {
      label: "Meta description 150–160 ตัวอักษร",
      ok: input.metaDescription.length >= 150 && input.metaDescription.length <= 160,
      level:
        input.metaDescription.length === 0
          ? "fail"
          : input.metaDescription.length >= 120 && input.metaDescription.length <= 170
            ? "pass"
            : "warn",
      hint: `ตอนนี้ ${input.metaDescription.length} ตัวอักษร`,
    },
    {
      label: "มีคีย์เวิร์ดหลัก",
      ok: kw.length > 0,
      level: kw.length > 0 ? "pass" : "warn",
    },
    {
      label: "คีย์เวิร์ดอยู่ใน Title",
      ok: kw.length > 0 && effectiveTitle.includes(kw),
      level: kw.length === 0 ? "warn" : effectiveTitle.includes(kw) ? "pass" : "warn",
    },
    {
      label: "คีย์เวิร์ดอยู่ในย่อหน้าแรก",
      ok: kw.length > 0 && firstParaText.includes(kw),
      level: kw.length === 0 ? "warn" : firstParaText.includes(kw) ? "pass" : "warn",
    },
    {
      label: `ความยาว ${articleType.min}–${articleType.max} คำ (${articleType.label})`,
      ok: words >= articleType.min && words <= articleType.max,
      level:
        words < HARD_MIN_WORDS
          ? "fail"
          : words >= articleType.min && words <= articleType.max
            ? "pass"
            : "warn",
      hint: `ประมาณ ${words} คำ`,
    },
    {
      label: "มีหัวข้อย่อย (H2/H3) อย่างน้อย 2 จุด",
      ok: headings >= 2,
      level: headings >= 2 ? "pass" : "warn",
      hint: `${headings} หัวข้อ`,
    },
    {
      label: "มี FAQ อย่างน้อย 5 ข้อ",
      ok: input.faqs.filter((f) => f.q.trim() && f.a.trim()).length >= 5,
      level:
        input.faqs.filter((f) => f.q.trim() && f.a.trim()).length >= 5 ? "pass" : "warn",
      hint: `${input.faqs.filter((f) => f.q.trim() && f.a.trim()).length} ข้อ`,
    },
    {
      label: "ไม่มีคำการันตีผลลัพธ์เกินจริง",
      ok: forbidden.length === 0,
      level: forbidden.length === 0 ? "pass" : "fail",
      hint: forbidden.length ? `พบ: ${forbidden.join(", ")}` : undefined,
    },
  ];

  const score = Math.round(
    (checks.filter((c) => c.level === "pass").length / checks.length) * 100,
  );
  return { checks, score };
}
