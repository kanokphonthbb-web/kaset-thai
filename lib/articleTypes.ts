// ─────────────────────────────────────────────────────────────
// ประเภทบทความ + ช่วงความยาวที่เหมาะสม (อิงสเปก SEO ของโปรเจกต์)
// ความยาวที่ดีต่างกันตามจุดประสงค์การค้นหา — ไม่ควรต่ำกว่า 300 คำเสมอ
// ─────────────────────────────────────────────────────────────

export type ArticleTypeKey = "qa" | "general" | "howto" | "deep";

export type ArticleTypeDef = {
  key: ArticleTypeKey;
  label: string;
  min: number; // แนะนำอย่างน้อย
  max: number; // แนะนำไม่เกิน (กันยืดเยื้อ)
  hint: string;
};

export const HARD_MIN_WORDS = 300; // ต่ำกว่านี้เผยแพร่ไม่ได้ (ทุกประเภท)

export const ARTICLE_TYPES: ArticleTypeDef[] = [
  { key: "qa", label: "ตอบคำถาม / ข่าวสาร", min: 300, max: 700, hint: "ตรงประเด็น เข้าใจง่าย" },
  { key: "general", label: "ความรู้ทั่วไป", min: 600, max: 1000, hint: "อธิบายละเอียดแต่ไม่ออกนอกเรื่อง" },
  { key: "howto", label: "รีวิว / ขั้นตอน (How-to)", min: 1000, max: 1500, hint: "ให้ข้อมูลครบเพื่อการตัดสินใจ" },
  { key: "deep", label: "เชิงลึก / เปรียบเทียบ", min: 1500, max: 2500, hint: "ครอบคลุมและมีการวิเคราะห์" },
];

export function getArticleType(key: string | undefined): ArticleTypeDef {
  return ARTICLE_TYPES.find((t) => t.key === key) ?? ARTICLE_TYPES[2]; // default = howto
}
