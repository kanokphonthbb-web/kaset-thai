import type { Block } from "./blocks";
import { blocksPlainText } from "./blocks";
import { countWords, findForbidden, type FaqItem } from "./seoAnalysis";
import { getArticleType, HARD_MIN_WORDS } from "./articleTypes";

export type ValidationResult = {
  ok: boolean;
  errors: string[]; // ต้องแก้ก่อน publish (gate)
  warnings: string[]; // ควรแก้แต่ไม่บล็อก
};

export type ValidateInput = {
  title: string;
  slug: string;
  metaDescription: string;
  blocks: Block[];
  faqs: FaqItem[];
  articleType?: string;
};

// Pre-publish gate — บทความต้องผ่านก่อนเผยแพร่ (อิงเกณฑ์ Convert Cake SEO)
export function validateArticle(input: ValidateInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const plain = blocksPlainText(input.blocks);
  const words = countWords(plain);
  const headings = input.blocks.filter((b) => b.type === "heading").length;
  const validFaqs = input.faqs.filter((f) => f.q.trim() && f.a.trim());
  const forbidden = findForbidden(`${plain} ${input.metaDescription} ${input.title}`);

  const type = getArticleType(input.articleType);

  // Gate (errors)
  if (!input.title.trim()) errors.push("ต้องมีหัวข้อบทความ (H1)");
  if (!input.slug.trim()) errors.push("ต้องมี slug");
  if (!input.metaDescription.trim()) errors.push("ต้องมี meta description");
  if (words < HARD_MIN_WORDS)
    errors.push(`เนื้อหาสั้นเกินไป (${words} คำ) ต้องอย่างน้อย ${HARD_MIN_WORDS} คำ`);
  if (headings < 1) errors.push("ต้องมีหัวข้อย่อย (H2) อย่างน้อย 1 จุด");
  if (forbidden.length > 0)
    errors.push(`มีคำการันตีผลลัพธ์ต้องห้าม: ${forbidden.join(", ")}`);

  // Warnings (ไม่บล็อก)
  if (input.title.length > 60)
    warnings.push(`Title ยาว ${input.title.length} ตัวอักษร ควร ≤ 60`);
  if (input.metaDescription.length < 150 || input.metaDescription.length > 160)
    warnings.push(
      `Meta description ${input.metaDescription.length} ตัวอักษร ควรอยู่ที่ 150–160`,
    );
  if (validFaqs.length < 5)
    warnings.push(`FAQ มี ${validFaqs.length} ข้อ แนะนำอย่างน้อย 5 ข้อเพื่อ AI Search`);
  // ความยาวตามประเภทบทความ
  if (words >= HARD_MIN_WORDS && words < type.min)
    warnings.push(
      `เนื้อหา ${words} คำ — บทความ${type.label} แนะนำ ${type.min}–${type.max} คำ`,
    );
  if (words > type.max)
    warnings.push(
      `เนื้อหา ${words} คำ ยาวเกินช่วงแนะนำ (${type.min}–${type.max} คำ) ระวังยืดเยื้อ`,
    );

  return { ok: errors.length === 0, errors, warnings };
}
