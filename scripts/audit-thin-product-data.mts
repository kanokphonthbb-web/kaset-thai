import {
  getAllProducts,
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
  productPublicKeywords,
} from "../lib/products";

const products = await getAllProducts();
const thin = products.filter((product) => !isProductIndexable(product));
const indexable = products.filter(isProductIndexable);
const normalizedName = (name: string) =>
  name.toLocaleLowerCase("th-TH").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const nameCounts = new Map<string, number>();
for (const product of products) {
  const name = normalizedName(productDisplayName(product));
  nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
}
const directAgricultureCategories = new Set([
  "plants",
  "animals",
  "fishery",
  "soil-water-fertilizer",
  "agri-tech-tools",
]);
const riskyName = /(ยา|สารกำจัด|ฆ่าเชื้อ|ฮอร์โมน|วัคซีน|ยาปฏิชีวนะ|กำจัดแมลง|กำจัดวัชพืช)/iu;
const unrelatedName = /(เสื้อ|กางเกง|กระเป๋า|รองเท้า|หมวก|ตุ๊กตา|สติกเกอร์|เคสโทรศัพท์|หนังสือ|นิยาย)/iu;
const highConfidence = thin.filter((product) => {
  const name = productDisplayName(product);
  return (
    productEditorialScore(product) === 1 &&
    directAgricultureCategories.has(product.category) &&
    name.length >= 12 &&
    name.length <= 96 &&
    !riskyName.test(name) &&
    (nameCounts.get(normalizedName(name)) ?? 0) === 1 &&
    productPublicKeywords(product, 8).length >= 2 &&
    product.useCases.length === 1
  );
});
const sourceTestCandidates = thin
  .filter((product) => {
    const name = productDisplayName(product);
    return (
      directAgricultureCategories.has(product.category) &&
      name.length >= 12 &&
      name.length <= 96 &&
      !riskyName.test(name) &&
      !unrelatedName.test(name) &&
      (nameCounts.get(normalizedName(name)) ?? 0) === 1
    );
  })
  .sort(
    (left, right) =>
      productEditorialScore(right) - productEditorialScore(left) ||
      productDisplayName(left).localeCompare(productDisplayName(right), "th"),
  );

if (process.argv.includes("--policy-blocked")) {
  console.log(
    JSON.stringify(
      thin
        .filter((product) => productEditorialScore(product) >= 2)
        .map((product) => ({
          slug: product.slug,
          name: productDisplayName(product),
          category: product.category,
          score: productEditorialScore(product),
        }))
        .sort((left, right) => left.name.localeCompare(right.name, "th")),
      null,
      2,
    ),
  );
  process.exit(0);
}
const familyPatterns = [
  ["seed", /เมล็ด|พันธุ์/iu],
  ["fertilizer", /ปุ๋ย|ธาตุอาหาร|ฮอร์โมนพืช/iu],
  ["animal-feed", /อาหาร(?:ไก่|เป็ด|หมู|วัว|ปลา|กุ้ง|สัตว์)|หัวอาหาร|อาหารข้น/iu],
  ["net-cage", /กระชัง|ตาข่าย|สวิง|แห(?:\s|$)/iu],
  ["farm-machine", /เครื่อง(?:ตัด|พ่น|สูบ|บด|สับ|ให้อาหาร|ฟัก|วัด)|ปั๊ม|มอเตอร์/iu],
  ["packaging", /ถุง|กล่อง|แพ็กเกจ|บรรจุภัณฑ์|ซีล/iu],
  ["records", /สมุด|บัญชี|เครื่องคิดเลข|ป้ายราคา/iu],
  ["plant-label", /ป้ายชื่อ(?:พืช|ต้นไม้)|ป้ายต้นไม้|แท็กพืช/iu],
  ["planter", /กระถาง|ถาดเพาะ|แปลงปลูก/iu],
  ["microbe", /จุลินทรีย์|เชื้อรา|บิวเวอเรีย|เมธาไรเซียม/iu],
  ["animal-housing", /กรง|คอก|โรงเรือน/iu],
  ["egg-tray", /ถาดไข่|กล่องเก็บไข่|ตู้ฟักไข่/iu],
  ["soil-medium", /ดินปลูก|วัสดุปลูก|แกลบ|ขุยมะพร้าว|พีทมอส/iu],
  ["water-test", /ทดสอบคุณภาพน้ำ|วัดค่า\s*pH|เครื่องวัด\s*pH|TDS|EC\s*meter/iu],
  ["pest-trap", /กาวดัก|กับดัก|กรงดัก|แผ่นกาว/iu],
] as const;
const counts = <T extends string | number>(values: T[]) =>
  Object.fromEntries(
    [...new Set(values)]
      .map((value) => [value, values.filter((candidate) => candidate === value).length] as const)
      .sort((left, right) => right[1] - left[1]),
  );

const summary = {
  total: products.length,
  indexable: indexable.length,
  thin: thin.length,
  editoriallyThin: thin.filter((product) => productEditorialScore(product) < 2).length,
  policyBlocked: thin.filter((product) => productEditorialScore(product) >= 2).length,
  indexableWithCatalogBoilerplate: indexable.filter((product) =>
    product.whyNeeded.startsWith("สินค้าเกษตรที่เกี่ยวข้องกับ"),
  ).length,
  indexableScoreCounts: counts(indexable.map(productEditorialScore)),
  indexableFieldCounts: {
    whyNeeded: indexable.filter((product) => product.whyNeeded.trim().length >= 40).length,
    benefits2: indexable.filter((product) => product.benefits.filter(Boolean).length >= 2).length,
    usage: indexable.filter((product) => product.usage.trim().length >= 40).length,
    howToChoose: indexable.filter((product) => product.howToChoose.trim().length >= 40).length,
    useCases2: indexable.filter((product) => product.useCases.filter(Boolean).length >= 2).length,
    safetyNote: indexable.filter((product) => product.safetyNote.trim().length >= 40).length,
    relatedArticle: indexable.filter((product) => product.relatedArticles.length > 0).length,
  },
  duplicateNamePages: products.filter(
    (product) => (nameCounts.get(normalizedName(productDisplayName(product))) ?? 0) > 1,
  ).length,
  duplicateNameGroups: [...nameCounts.values()].filter((count) => count > 1).length,
  highConfidence: highConfidence.length,
  highConfidenceByCategory: counts(highConfidence.map((product) => product.category)),
  scoreCounts: counts(thin.map(productEditorialScore)),
  categoryCounts: counts(thin.map((product) => product.category || "other")),
  indexableCategoryCounts: counts(
    indexable.map((product) => product.category || "other"),
  ),
  fieldCounts: {
    whyNeeded: thin.filter((product) => product.whyNeeded.trim().length >= 40).length,
    benefits2: thin.filter((product) => product.benefits.filter(Boolean).length >= 2).length,
    usage: thin.filter((product) => product.usage.trim().length >= 40).length,
    howToChoose: thin.filter((product) => product.howToChoose.trim().length >= 40).length,
    useCases2: thin.filter((product) => product.useCases.filter(Boolean).length >= 2).length,
    safetyNote: thin.filter((product) => product.safetyNote.trim().length >= 40).length,
    relatedArticle: thin.filter((product) => product.relatedArticles.length > 0).length,
    publicKeywords2: thin.filter((product) => productPublicKeywords(product, 8).length >= 2).length,
    exactPrice: thin.filter((product) => /^\d+(?:\.\d{1,2})?$/.test(product.priceLabel)).length,
  },
  candidateSamples: highConfidence
    .sort(
      (left, right) =>
        productEditorialScore(right) - productEditorialScore(left) ||
        productDisplayName(left).localeCompare(productDisplayName(right), "th"),
    )
    .slice(0, 20)
    .map((product) => ({
      slug: product.slug,
      name: productDisplayName(product),
      category: product.category,
      score: productEditorialScore(product),
      keywords: productPublicKeywords(product, 5),
      whyNeeded: product.whyNeeded,
      useCases: product.useCases,
      price: product.priceLabel,
      affiliateLink: product.affiliateLink,
    })),
  sourceTestCandidates: sourceTestCandidates.slice(0, 20).map((product) => ({
    slug: product.slug,
    name: productDisplayName(product),
    category: product.category,
    score: productEditorialScore(product),
    affiliateLink: product.affiliateLink,
  })),
  familyCounts: Object.fromEntries(
    familyPatterns.map(([family, pattern]) => [
      family,
      thin.filter((product) => pattern.test(productDisplayName(product))).length,
    ]),
  ),
};

console.log(JSON.stringify(summary, null, 2));
