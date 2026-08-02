// ─────────────────────────────────────────────────────────────
// สินค้าเพื่อการเกษตร (affiliate) — data access + safe in-article keyword linking
// ─────────────────────────────────────────────────────────────
import { parse, HTMLElement } from "node-html-parser";
import { prisma } from "@/lib/prisma";

export type Product = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  keywords: string[];
  whyNeeded: string;
  benefits: string[];
  usage: string;
  shopeeId: string | null;
  status: string;
  howToChoose: string;
  useCases: string[];
  safetyNote: string;
  priceLabel: string;
  priceCheckedAt: Date | null;
  relatedArticles: string[];
  updatedAt?: Date;
};

type ProductEditorialOverride = Partial<
  Pick<
    Product,
    | "name"
    | "whyNeeded"
    | "benefits"
    | "usage"
    | "howToChoose"
    | "useCases"
    | "safetyNote"
  >
>;

// These products already receive impressions in Search Console. Their database
// rows predate the editorial fields, so keep the reviewed copy in source control
// until the product CMS supports equivalent reviewed content. Wording is limited
// to selection/use guidance that is supported by the visible product identity;
// it deliberately makes no performance, efficacy, stock, or price claims.
export const PRODUCT_EDITORIAL_OVERRIDES: Readonly<
  Record<string, ProductEditorialOverride>
> = Object.freeze({
  "product-404": {
    name: "เมล็ดผักสลัด 100–300 เมล็ด พร้อมคู่มือเพาะกล้า",
    whyNeeded:
      "เมล็ดผักสลัดขนาดบรรจุไม่มากเหมาะสำหรับผู้ที่ต้องการเริ่มเพาะกล้า ทดลองปลูกหลายสายพันธุ์ หรือวางแผนแปลงผักขนาดเล็กโดยไม่ต้องซื้อเมล็ดจำนวนมากเกินความจำเป็น",
    benefits: [
      "ใช้ทดลองเปรียบเทียบสายพันธุ์ผักสลัดกับสภาพอากาศและพื้นที่ปลูกของตนเอง",
      "ขนาดบรรจุเหมาะกับการวางแผนเพาะกล้าทีละรอบและบันทึกผลการงอกของแต่ละล็อต",
      "คู่มือจากผู้ขายใช้เป็นข้อมูลตั้งต้นร่วมกับคำแนะนำบนซองเมล็ดพันธุ์ได้",
    ],
    usage:
      "ตรวจชื่อสายพันธุ์และคำแนะนำบนซองก่อนเพาะ ใช้วัสดุเพาะที่สะอาด ควบคุมความชื้นไม่ให้แฉะ และจดวันที่เพาะเพื่อประเมินการงอกของเมล็ดในล็อตนั้นตามสภาพปลูกจริง",
    howToChoose:
      "ตรวจชื่อสายพันธุ์ จำนวนเมล็ด ปีผลิตหรือวันบรรจุ อัตราการงอกที่ผู้ขายระบุ และช่วงอุณหภูมิที่เหมาะกับสายพันธุ์นั้น พร้อมเทียบจำนวนเมล็ดกับพื้นที่และจำนวนรอบที่ตั้งใจปลูก",
    useCases: [
      "เพาะกล้าผักสลัดในถาดเพาะก่อนย้ายลงแปลงหรือภาชนะ",
      "ทดลองปลูกผักสลัดหลายสายพันธุ์ในสวนครัวหรือพื้นที่ขนาดเล็ก",
    ],
    safetyNote:
      "อัตราการงอกขึ้นอยู่กับสายพันธุ์ อายุเมล็ด การเก็บรักษา ความชื้น และอุณหภูมิ ควรยึดข้อมูลบนซองของล็อตที่ได้รับจริง และเก็บเมล็ดที่เหลือให้แห้งพ้นแสงแดด",
  },
  "product-541": {
    name: "เบต้า มีเดียม (เบทาโกร) น้ำยาฆ่าเชื้อโรงเรือน 1 ลิตร",
    whyNeeded:
      "ผลิตภัณฑ์ฆ่าเชื้อสำหรับโรงเรือนอาจใช้เป็นส่วนหนึ่งของแผนสุขาภิบาลหลังเก็บมูล เศษอาหาร และสิ่งสกปรกออกแล้ว แต่ต้องเลือกให้ตรงกับพื้นผิว ชนิดสัตว์ และวิธีใช้ที่ฉลากอนุญาต",
    benefits: [
      "ใช้ประกอบขั้นตอนสุขาภิบาลโรงเรือนตามขอบเขตและอัตราผสมที่ระบุบนฉลาก",
      "ช่วยให้ผู้ดูแลกำหนดขั้นตอนทำความสะอาด อัตราผสม และเวลาสัมผัสได้เป็นระบบเมื่อมีข้อมูลฉลากครบ",
      "บรรจุภัณฑ์ระบุชื่อผลิตภัณฑ์ชัดเจน จึงควรตรวจเลขทะเบียน สารสำคัญ และวันหมดอายุก่อนซื้อทุกครั้ง",
    ],
    usage:
      "นำสัตว์ อาหาร และภาชนะน้ำออกจากพื้นที่ตามคำแนะนำบนฉลาก ทำความสะอาดคราบอินทรีย์ก่อน แล้วผสมและใช้เฉพาะอัตราที่ผู้ผลิตระบุ เว็บไซต์นี้ไม่กำหนดอัตราผสมแทนฉลากผลิตภัณฑ์",
    howToChoose:
      "ตรวจสารสำคัญ เลขทะเบียนหรือข้อมูลกำกับผลิตภัณฑ์ พื้นผิวและเชื้อเป้าหมายที่ฉลากระบุ อัตราเจือจาง เวลาสัมผัส วันหมดอายุ รวมถึงข้อกำหนดก่อนนำสัตว์กลับเข้าโรงเรือน",
    useCases: [
      "ใช้ในแผนทำความสะอาดโรงเรือนว่างตามข้อกำหนดบนฉลาก",
      "ทำความสะอาดอุปกรณ์หรือพื้นผิวที่ฉลากของผลิตภัณฑ์ระบุว่าใช้ได้",
    ],
    safetyNote:
      "เป็นผลิตภัณฑ์ที่ต้องอ่านฉลากและเอกสารกำกับก่อนใช้ สวมอุปกรณ์ป้องกันตามที่กำหนด ห้ามผสมกับสารอื่นโดยไม่มีคำแนะนำ เก็บให้พ้นเด็ก สัตว์ อาหาร และแหล่งน้ำ หากไม่แน่ใจให้ปรึกษาสัตวแพทย์หรือเจ้าหน้าที่ปศุสัตว์",
  },
  "product-575": {
    name: "สวิงช้อนปลา ด้ายขาวขนาดใหญ่ สำหรับตักและย้ายปลา",
    whyNeeded:
      "สวิงช่วยตักหรือย้ายปลาในบ่อและภาชนะโดยลดการใช้มือจับโดยตรง การเลือกขนาดวงสวิง ความลึกตาข่าย และความถี่ของช่องตาข่ายให้เหมาะกับขนาดปลาจะช่วยให้ทำงานได้คล่องขึ้น",
    benefits: [
      "ใช้ตักหรือย้ายปลาในงานดูแลบ่อ คัดขนาด หรือย้ายระหว่างภาชนะ",
      "ด้ามและวงสวิงช่วยให้เข้าถึงปลาได้สะดวกกว่าการใช้มือจับโดยตรง",
      "สามารถเลือกขนาดตาข่ายให้สัมพันธ์กับขนาดปลาและปริมาณที่ย้ายต่อครั้ง",
    ],
    usage:
      "ตรวจรอยขาดและความแน่นของด้ามก่อนใช้ เคลื่อนสวิงช้า ๆ ในน้ำ ตักปลาในปริมาณที่รับน้ำหนักได้ และรองรับสวิงขณะยกเพื่อลดแรงกระชาก จากนั้นล้างและผึ่งให้แห้ง",
    howToChoose:
      "เทียบเส้นผ่านศูนย์กลางวงสวิง ความลึกและขนาดช่องตาข่าย ความยาวด้าม วัสดุขอบ และน้ำหนักที่รับได้กับชนิดปลา ขนาดปลา ความลึกของบ่อ และระยะที่ต้องเอื้อม",
    useCases: [
      "ตักปลาเพื่อคัดขนาด ตรวจสุขภาพ หรือย้ายภายในฟาร์ม",
      "ช้อนปลาออกจากบ่อ ภาชนะพัก หรือถังขนย้ายในปริมาณที่เหมาะกับสวิง",
    ],
    safetyNote:
      "ไม่ควรยกปลาเกินน้ำหนักที่สวิงและด้ามรับได้ หลีกเลี่ยงตาข่ายที่มีรอยขาดหรือขอบคม และทำความสะอาดอุปกรณ์ก่อนย้ายไปใช้ต่างบ่อเพื่อลดการพาสิ่งสกปรกข้ามพื้นที่",
  },
});

function toProduct(row: {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  keywords: string;
  whyNeeded: string;
  benefits: string;
  usage: string;
  shopeeId: string | null;
  status: string;
  howToChoose: string;
  useCasesJson: string;
  safetyNote: string;
  priceLabel: string;
  priceCheckedAt: Date | null;
  relatedArticlesJson: string;
  updatedAt: Date;
}): Product {
  let keywords: string[] = [];
  try {
    keywords = JSON.parse(row.keywords);
  } catch {
    keywords = [];
  }
  let benefits: string[] = [];
  try {
    benefits = JSON.parse(row.benefits);
  } catch {
    benefits = [];
  }
  let useCases: string[] = [];
  try {
    useCases = JSON.parse(row.useCasesJson);
  } catch {
    useCases = [];
  }
  let relatedArticles: string[] = [];
  try {
    relatedArticles = JSON.parse(row.relatedArticlesJson);
  } catch {
    relatedArticles = [];
  }
  const product: Product = {
    id: row.id,
    slug: row.slug,
    name: compactText(row.name) || keywords.find((keyword) => keyword.trim()) || "สินค้าเพื่อการเกษตร",
    imageUrl: row.imageUrl,
    affiliateLink: row.affiliateLink,
    category: row.category,
    keywords,
    whyNeeded: row.whyNeeded,
    benefits,
    usage: row.usage,
    shopeeId: row.shopeeId,
    status: row.status,
    howToChoose: row.howToChoose,
    useCases,
    safetyNote: row.safetyNote,
    priceLabel: row.priceLabel,
    priceCheckedAt: row.priceCheckedAt,
    relatedArticles,
    updatedAt: row.updatedAt,
  };
  return { ...product, ...PRODUCT_EDITORIAL_OVERRIDES[row.slug] };
}

function hasSubstantiveText(value: string): boolean {
  return value.trim().length >= 40;
}

export function productEditorialScore(product: Product): number {
  return (
    [product.whyNeeded, product.usage, product.howToChoose, product.safetyNote].filter(
      hasSubstantiveText,
    ).length +
    (product.benefits.filter((item) => item.trim()).length >= 2 ? 1 : 0) +
    (product.useCases.filter((item) => item.trim()).length >= 2 ? 1 : 0) +
    (product.relatedArticles.filter((item) => item.trim()).length >= 1 ? 1 : 0)
  );
}

export function isProductIndexable(product: Product): boolean {
  return productEditorialScore(product) >= 2;
}

function compactText(value: string): string {
  return value
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ")
    .replace(/^[♛❀☽☾☆★♚♔♕♣♦♥♡◆◇※•·\-\s]+/gu, "")
    .replace(/[#*_]+/g, " ")
    .replace(/^\s*[\[(][^\])]*(?:ซื้อ|แถม|เเถม|ลด|ส่ง|โปรโมชั่น)[^\])]*[\])]\s*/iu, "")
    .replace(
      /(?:(?:ปลอดภัย|(?:ของ)?แท้)\s*100\s*%|รับประกัน(?:ผล)?|ดีที่สุด|ของแท้|พร้อมส่ง|ส่งฟรี|\d+\s*ครั้ง\s*เห็นผล|เห็นผล(?:ไว|ทันที)|งอกดี|โตไว|อ[ัต]?ตราการงอกสูง|เน้นไข่ดก(?:\s*ไข่ใบใหญ่)?|เพิ่มผลผลิต)/giu,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace >= Math.floor(maxLength * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function productDisplayName(product: Product): string {
  const cleanedName = compactText(product.name);
  const fallback = product.keywords.find((keyword) => keyword.trim()) ?? "สินค้าเพื่อการเกษตร";
  return truncateAtWord(cleanedName || fallback, 96);
}

export function productPublicKeywords(product: Product, max = 5): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const rawKeyword of product.keywords) {
    const keyword = compactText(rawKeyword);
    const normalized = keyword.toLocaleLowerCase("th-TH");
    if (
      keyword.length < 2 ||
      keyword.length > 50 ||
      /[_]|(?:^|\s)(?:page|component)(?:\s|$)/iu.test(keyword) ||
      /^\d+(?:\.\d+)?$/u.test(keyword) ||
      seen.has(normalized)
    ) {
      continue;
    }
    seen.add(normalized);
    result.push(keyword);
    if (result.length >= Math.max(1, max)) break;
  }
  return result;
}

export function productRelevanceScore(source: Product, candidate: Product): number {
  const sourceTerms = productPublicKeywords(source, 10)
    .map((term) => term.toLocaleLowerCase("th-TH"))
    .filter((term) => term.length >= 4);
  const candidateTerms = [
    ...productPublicKeywords(candidate, 10),
    productDisplayName(candidate),
  ]
    .map((term) => term.toLocaleLowerCase("th-TH"))
    .filter((term) => term.length >= 4);

  let score = 0;
  for (const sourceTerm of sourceTerms) {
    for (const candidateTerm of candidateTerms) {
      if (sourceTerm === candidateTerm) score += 3;
      else if (sourceTerm.includes(candidateTerm) || candidateTerm.includes(sourceTerm)) score += 1;
    }
  }
  return score;
}

const CATEGORY_LABELS: Record<string, string> = {
  plants: "งานปลูกพืช",
  animals: "งานเลี้ยงสัตว์",
  fishery: "งานประมงและดูแลสัตว์น้ำ",
  "mixed-farming": "งานจัดการฟาร์มผสมผสาน",
  diseases: "งานป้องกันโรคและดูแลสุขอนามัย",
  "cost-profit": "งานบันทึกต้นทุนและวางแผนฟาร์ม",
  market: "งานแปรรูป บรรจุ และจำหน่ายผลผลิต",
  "soil-water-fertilizer": "งานจัดการดิน น้ำ และปุ๋ย",
  "agri-tech-tools": "งานใช้เครื่องมือและเทคโนโลยีเกษตร",
  "agri-news-law-standards": "งานด้านมาตรฐานและเอกสารเกษตร",
};

export function productBuyerChecklist(product: Product): string[] {
  const topic = productPublicKeywords(product, 1)[0] || CATEGORY_LABELS[product.category] || "งานที่ต้องการ";
  const common = [
    `ตรวจชื่อ รุ่น ขนาด และจำนวนของสินค้าให้ตรงกับ ${topic} ก่อนชำระเงิน`,
    "เปรียบเทียบราคาต่อหน่วย ค่าจัดส่ง ระยะเวลาจัดส่ง และเงื่อนไขคืนสินค้าจากหน้าร้านล่าสุด",
    "อ่านรายละเอียด วิธีใช้ ข้อจำกัด และคำเตือนจากฉลากหรือคู่มือของสินค้าที่ได้รับจริง",
    "ตรวจคะแนนร้านค้า รีวิวที่มีรูปจริง การรับประกัน และช่องทางติดต่อเมื่อสินค้าไม่ตรงรายละเอียด",
  ];

  if (product.category === "plants") {
    return [
      `ตรวจชนิดและสายพันธุ์ให้ตรงกับ ${topic} รวมถึงฤดูและสภาพพื้นที่ที่จะปลูก`,
      "ตรวจล็อต วันบรรจุหรือวันหมดอายุ ปริมาณ และคำแนะนำการเก็บรักษาบนฉลาก",
      "คำนวณจำนวนที่ต้องใช้ตามพื้นที่หรือจำนวนรอบปลูกก่อนเปรียบเทียบราคาต่อหน่วย",
      common[3],
    ];
  }
  if (product.category === "animals" || product.category === "fishery") {
    return [
      `ตรวจว่าสินค้าเหมาะกับชนิด ขนาด หรือช่วงวัยของสัตว์ในงาน ${topic}`,
      "ตรวจสูตร ขนาดบรรจุ ล็อต วันผลิต วันหมดอายุ และวิธีเก็บรักษาจากฉลาก",
      "อ่านอัตราใช้และข้อจำกัดจากผู้ผลิต ไม่เปลี่ยนสูตรอาหารหรือการดูแลอย่างฉับพลันโดยไม่มีข้อมูลรองรับ",
      common[3],
    ];
  }
  if (product.category === "diseases") {
    return [
      `ตรวจว่าสินค้าใช้กับ ${topic} ได้ตามฉลาก และตรงกับชนิดพืช สัตว์ หรือพื้นที่เป้าหมาย`,
      "ตรวจสารสำคัญ เลขทะเบียน อัตราใช้ อุปกรณ์ป้องกัน ระยะปลอดภัย และวันหมดอายุ",
      "หลีกเลี่ยงการวินิจฉัยโรคหรือผสมสารจากชื่อสินค้าเพียงอย่างเดียว หากไม่แน่ใจให้ปรึกษาผู้เชี่ยวชาญ",
      common[3],
    ];
  }
  if (product.category === "soil-water-fertilizer") {
    return [
      `ตรวจสูตรหรือคุณสมบัติให้ตรงกับ ${topic} ผลตรวจดิน ชนิดพืช และระบบน้ำที่ใช้อยู่`,
      "อ่านอัตราใช้ วิธีผสม ข้อจำกัด เลขทะเบียน และคำเตือนจากฉลากก่อนใช้งาน",
      "คำนวณปริมาณตามพื้นที่จริงและเปรียบเทียบราคาต่อหน่วย ไม่ตัดสินใจจากขนาดบรรจุเพียงอย่างเดียว",
      common[3],
    ];
  }
  if (product.category === "agri-tech-tools") {
    return [
      `ตรวจขนาด กำลัง วัสดุ และรูปแบบการเชื่อมต่อให้ตรงกับ ${topic} และอุปกรณ์เดิมในฟาร์ม`,
      "ตรวจแหล่งพลังงาน อะไหล่ อุปกรณ์ที่ให้มา คู่มือภาษาไทย และวิธีบำรุงรักษา",
      "เปรียบเทียบการรับประกัน ศูนย์บริการ และค่าอะไหล่สิ้นเปลืองตลอดอายุการใช้งาน",
      common[3],
    ];
  }
  return common;
}

export function productSeoTitle(product: Product): string {
  // Root metadata adds " | เกษตรกรไทย"; 44 keeps the rendered title near 60 chars.
  return truncateAtWord(productDisplayName(product), 44);
}

export function productSeoDescription(product: Product): string {
  const sections = [
    product.whyNeeded && "เหตุผลที่ควรใช้",
    product.benefits.length > 0 && "ประโยชน์",
    product.usage && "วิธีใช้",
    product.howToChoose && "วิธีเลือกซื้อ",
    product.safetyNote && "ข้อควรระวัง",
    product.relatedArticles.length > 0 && "บทความที่เกี่ยวข้อง",
  ].filter((section): section is string => Boolean(section));
  const details = sections.length > 0 ? sections.join(", ") : "รายละเอียดสินค้าเกษตร";
  return truncateAtWord(
    `ข้อมูล${productSeoTitle(product)}: ${details} พร้อมลิงก์ตรวจสอบรายละเอียดและราคาจากร้านค้า ราคาจริงอาจเปลี่ยนแปลงได้`,
    158,
  );
}

export function schemaPriceFromLabel(label: string): string | null {
  const normalized = label.replace(/,/g, "").replace(/^\s*฿/, "").replace(/บาท\s*$/u, "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? normalized : null;
}

export function freshSchemaPrice(
  product: Product,
  now = new Date(),
  maxAgeDays = 30,
): string | null {
  const price = schemaPriceFromLabel(product.priceLabel);
  if (!price || !product.priceCheckedAt) return null;
  const ageMs = now.getTime() - product.priceCheckedAt.getTime();
  const maxAgeMs = maxAgeDays * 86_400_000;
  return ageMs >= 0 && ageMs <= maxAgeMs ? price : null;
}

export function productPriceDisplay(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";
  return /(?:฿|บาท)/u.test(trimmed) ? trimmed : `${trimmed} บาท`;
}

export function productStructuredData(
  product: Product,
  siteUrl: string,
  now = new Date(),
): { "@context": "https://schema.org"; "@graph": Record<string, unknown>[] } {
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const displayName = productDisplayName(product);
  const schemaPrice = freshSchemaPrice(product, now);
  const graph: Record<string, unknown>[] = [];

  // Google product snippets require an Offer, review, or aggregate rating. This
  // affiliate catalog owns no ratings, so emit Product only with a recently
  // checked exact price. Availability is intentionally omitted because stock is
  // controlled by the external shop and is not verified by this site.
  if (isProductIndexable(product) && schemaPrice) {
    graph.push({
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: displayName,
      description: product.whyNeeded || productSeoDescription(product),
      image: product.imageUrl.startsWith("http")
        ? product.imageUrl
        : `${siteUrl}${product.imageUrl.startsWith("/") ? "" : "/"}${product.imageUrl}`,
      url: productUrl,
      offers: {
        "@type": "Offer",
        price: schemaPrice,
        priceCurrency: "THB",
        url: product.affiliateLink,
      },
    });
  }

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "สินค้าเพื่อการเกษตร", item: `${siteUrl}/products` },
      { "@type": "ListItem", position: 3, name: displayName, item: productUrl },
    ],
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { status: "active" }, orderBy: { createdAt: "asc" } });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row || row.status !== "active") return null;
  return toProduct(row);
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) return null;
  return toProduct(row);
}

export async function getProductsByShopeeIds(shopeeIds: string[]): Promise<Product[]> {
  if (shopeeIds.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { shopeeId: { in: shopeeIds }, status: "active" },
  });
  const bySlug = new Map(rows.map((r) => [r.shopeeId, toProduct(r)]));
  return shopeeIds.map((id) => bySlug.get(id)).filter((p): p is Product => !!p);
}

export async function getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category, status: "active" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows.map(toProduct);
}

/**
 * Find products whose keyword(s) appear in `text`, longest-keyword-match first
 * so a specific match ("ปุ๋ยข้าวหอมมะลิ") outranks a generic one ("ปุ๋ย").
 * One entry per product (never returns the same product twice).
 */
export function findMatchingProducts(text: string, products: Product[], max = 3): Product[] {
  type Hit = { product: Product; keyword: string };
  const hits: Hit[] = [];
  for (const product of products) {
    for (const keyword of product.keywords) {
      if (keyword && text.includes(keyword)) {
        hits.push({ product, keyword });
        break; // one hit per product is enough to qualify it
      }
    }
  }
  hits.sort((a, b) => b.keyword.length - a.keyword.length);
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const hit of hits) {
    if (seen.has(hit.product.id)) continue;
    seen.add(hit.product.id);
    result.push(hit.product);
    if (result.length >= max) break;
  }
  return result;
}

const SKIP_TAGS = new Set(["a", "script", "style", "h1", "h2", "h3", "h4", "h5", "h6"]);

/**
 * Wraps the first occurrence of each matched product keyword in article HTML
 * with a link to /products/[slug] — an internal link, not the raw affiliate URL.
 * Walks text nodes only via node-html-parser (never touches tag markup/attributes),
 * so it can safely run on stored HTML at render time without risk of corrupting it.
 * Capped at `max` inserted links total to keep the tone editorial, not sales-heavy.
 */
export function injectProductLinks(html: string, products: Product[], max = 3): string {
  if (!html || products.length === 0) return html;

  // Sort candidate keywords longest-first across all products for specific-match priority.
  const candidates = products
    .flatMap((p) => p.keywords.map((k) => ({ keyword: k, product: p })))
    .filter((c) => c.keyword && c.keyword.length >= 2)
    .sort((a, b) => b.keyword.length - a.keyword.length);

  const root = parse(html);
  const usedProductIds = new Set<string>();
  let inserted = 0;

  function walk(node: HTMLElement) {
    if (inserted >= max) return;
    for (const child of [...node.childNodes]) {
      if (inserted >= max) return;
      if (child.nodeType === 1) {
        // element node
        const el = child as HTMLElement;
        const tagName = el.tagName?.toLowerCase();
        if (tagName && SKIP_TAGS.has(tagName)) continue;
        walk(el);
      } else if (child.nodeType === 3) {
        // text node — no replaceWith on TextNode, so swap it for a <span> wrapper
        // via the parent's exchangeChild (parent is always an HTMLElement here).
        const text = child.rawText;
        if (!text || !text.trim()) continue;
        for (const { keyword, product } of candidates) {
          if (usedProductIds.has(product.id)) continue;
          const idx = text.indexOf(keyword);
          if (idx === -1) continue;
          const before = text.slice(0, idx);
          const after = text.slice(idx + keyword.length);
          const link = `<a href="/products/${product.slug}" class="cc-product-link">${keyword}</a>`;
          const wrapperRoot = parse(`<span>${before}${link}${after}</span>`);
          const wrapperSpan = wrapperRoot.childNodes[0] as HTMLElement;
          node.exchangeChild(child, wrapperSpan);
          usedProductIds.add(product.id);
          inserted++;
          break;
        }
        if (inserted >= max) return;
      }
    }
  }

  walk(root);
  return inserted > 0 ? root.toString() : html;
}
