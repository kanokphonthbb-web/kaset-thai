import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ARTICLE_REDIRECTS,
  ARTICLE_SEO_TITLES,
  REDIRECTED_ARTICLE_SLUGS,
  articleSeoTitle,
  canonicalArticleSlug,
} from "../lib/articleSeoRules.mjs";
import {
  freshSchemaPrice,
  isProductIndexable,
  PRODUCT_EDITORIAL_OVERRIDES,
  productBuyerChecklist,
  productDisplayName,
  productEditorialScore,
  productPublicKeywords,
  productPriceDisplay,
  productRelevanceScore,
  productSeoDescription,
  productSeoTitle,
  productStructuredData,
  schemaPriceFromLabel,
  type Product,
} from "../lib/products";
import {
  normalizeCatalogQuery,
  productCatalogCategory,
  productCatalogPage,
  productMatchesCatalogQuery,
} from "../lib/productCatalog";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-id",
    slug: "product-test",
    name: "#เครื่องวัดค่าดิน รุ่นทดสอบ พร้อมส่ง โปรโมชั่นพิเศษสำหรับเกษตรกร",
    imageUrl: "/test.webp",
    affiliateLink: "https://example.com/product",
    category: "plants",
    keywords: ["เครื่องวัดค่าดิน"],
    whyNeeded: "",
    benefits: [],
    usage: "",
    shopeeId: null,
    status: "active",
    howToChoose: "",
    useCases: [],
    safetyNote: "",
    priceLabel: "",
    priceCheckedAt: null,
    relatedArticles: [],
    updatedAt: new Date("2026-07-31T00:00:00Z"),
    ...overrides,
  };
}

test("article consolidation rules are canonical and cycle-free", () => {
  assert.deepEqual(REDIRECTED_ARTICLE_SLUGS, Object.keys(ARTICLE_REDIRECTS));
  for (const [source, target] of Object.entries(ARTICLE_REDIRECTS)) {
    assert.notEqual(source, target);
    assert.equal(canonicalArticleSlug(source), target);
    assert.equal(ARTICLE_REDIRECTS[target], undefined, `redirect chain at ${target}`);
  }
});

test("article SEO overrides are unique and within a useful title length", () => {
  const titles = Object.values(ARTICLE_SEO_TITLES);
  assert.equal(new Set(titles).size, titles.length);
  assert.ok(titles.every((title) => title.length <= 46));
  assert.equal(articleSeoTitle("unlisted", "ชื่อเดิม"), "ชื่อเดิม");
});

test("thin products need two editorial signals before indexation", () => {
  const thin = product();
  assert.equal(productEditorialScore(thin), 0);
  assert.equal(isProductIndexable(thin), false);

  const useful = product({
    whyNeeded: "เหตุผลประกอบที่อธิบายประโยชน์และบริบทการใช้งานจริงให้ผู้อ่านเข้าใจได้ชัดเจน",
    benefits: ["ช่วยตรวจข้อมูล", "ช่วยเปรียบเทียบก่อนเลือก"],
  });
  assert.equal(productEditorialScore(useful), 2);
  assert.equal(isProductIndexable(useful), true);
});

test("regulated and unrelated products stay noindex until reviewed", () => {
  const editorialSignals = {
    whyNeeded: "รายละเอียดประกอบที่อธิบายบริบทและสิ่งที่ผู้ซื้อจำเป็นต้องตรวจสอบก่อนใช้งานจริง",
    benefits: ["ข้อมูลประกอบข้อแรก", "ข้อมูลประกอบข้อที่สอง"],
  };
  assert.equal(
    isProductIndexable(product({
      ...editorialSignals,
      name: "สารคุมหญ้าสำหรับแปลงเกษตร",
    })),
    false,
  );
  assert.equal(
    isProductIndexable(product({
      ...editorialSignals,
      name: "เสื้อยืดลายฟาร์ม",
    })),
    false,
  );
});

test("Search Console priority products now have substantive reviewed editorial copy", () => {
  assert.deepEqual(Object.keys(PRODUCT_EDITORIAL_OVERRIDES).sort(), [
    "product-404",
    "product-541",
    "product-575",
  ]);
  for (const [slug, override] of Object.entries(PRODUCT_EDITORIAL_OVERRIDES)) {
    const enriched = product({ slug, ...override });
    assert.ok(productEditorialScore(enriched) >= 5, slug);
    assert.equal(isProductIndexable(enriched), true, slug);
  }
});

test("public product keywords hide internal workflow labels", () => {
  const sample = product({
    keywords: [
      "starter_kit_component",
      "disease_check_page",
      "น้ำยาฆ่าเชื้อโรงเรือน / ตาข่ายกันแมลง / ถาดเลี้ยงยาวเกินกว่าที่ควรแสดงบนหน้าเว็บสาธารณะ",
      "สวิงจับปลา",
      "สวิงจับปลา",
      "123",
    ],
  });
  assert.deepEqual(productPublicKeywords(sample), ["สวิงจับปลา"]);
});

test("public product names remove promotional claims but retain product identity", () => {
  const sample = product({
    name: "[10 เเถม 2] เมล็ดพันธุ์ข้าวแท้ 100% งอกดี โตไว พร้อมส่ง",
  });
  const name = productDisplayName(sample);
  assert.match(name, /เมล็ดพันธุ์ข้าว/u);
  assert.doesNotMatch(name, /เเถม|100\s*%|งอกดี|โตไว/u);
});

test("buyer checklist stays useful and category-aware without changing indexability", () => {
  const thin = product({ category: "agri-tech-tools", keywords: ["เครื่องวัดดิน"] });
  const checklist = productBuyerChecklist(thin);
  assert.equal(checklist.length, 4);
  assert.ok(checklist.every((item) => item.length >= 40));
  assert.match(checklist.join(" "), /กำลัง|วัสดุ|อะไหล่|รับประกัน/u);
  assert.equal(isProductIndexable(thin), false);
});

test("related product scoring rejects same-category products with a different intent", () => {
  const disinfectant = product({
    slug: "disinfectant",
    name: "น้ำยาฆ่าเชื้อโรงเรือน",
    category: "diseases",
    keywords: ["น้ำยาฆ่าเชื้อโรงเรือน"],
  });
  const related = product({
    slug: "related",
    name: "น้ำยาฆ่าเชื้อสำหรับอุปกรณ์ในโรงเรือน",
    category: "diseases",
    keywords: ["น้ำยาฆ่าเชื้อ"],
  });
  const unrelated = product({
    slug: "unrelated",
    name: "ปุ๋ยน้ำสำหรับผักกาดขาว",
    category: "diseases",
    keywords: ["ปุ๋ยน้ำผักกาดขาว"],
  });
  assert.ok(productRelevanceScore(disinfectant, related) > 0);
  assert.equal(productRelevanceScore(disinfectant, unrelated), 0);
});

test("product catalog search and pagination keep the full catalog off the client", () => {
  const sample = product({
    name: "เครื่องวัดค่าดินแบบพกพา",
    keywords: ["เครื่องวัดดิน", "ตรวจค่า pH"],
    category: "agri-tech-tools",
  });
  assert.equal(productMatchesCatalogQuery(sample, "วัดดิน"), true);
  assert.equal(productMatchesCatalogQuery(sample, "กรงไก่"), false);
  assert.equal(normalizeCatalogQuery("  วัด   ดิน  "), "วัด ดิน");
  assert.equal(productCatalogCategory(sample), "agri-tech-tools");
  assert.equal(productCatalogCategory({ ...sample, category: "" }), "other");
  assert.deepEqual(productCatalogPage("99", 49, 24), {
    page: 3,
    totalPages: 3,
    start: 48,
    end: 49,
  });
});

test("product metadata is compact and schema price accepts only one exact amount", () => {
  const sample = product({
    whyNeeded: "เหตุผลประกอบที่อธิบายประโยชน์และบริบทการใช้งานจริงให้ผู้อ่านเข้าใจได้ชัดเจน",
    benefits: ["ช่วยตรวจข้อมูล", "ช่วยเปรียบเทียบก่อนเลือก"],
  });
  assert.ok(productDisplayName(sample).length <= 96);
  assert.doesNotMatch(productDisplayName(sample), /[#*]/);
  assert.ok(productSeoTitle(sample).length <= 44);
  assert.ok(productSeoDescription(sample).length <= 158);
  assert.equal(schemaPriceFromLabel("฿1,250.50 บาท"), "1250.50");
  assert.equal(schemaPriceFromLabel("100-200"), null);
  assert.equal(schemaPriceFromLabel("1.8พัน"), null);
  assert.equal(schemaPriceFromLabel("สอบถามราคา"), null);
  assert.equal(productPriceDisplay("1,250"), "1,250 บาท");
  assert.equal(productPriceDisplay("฿1,250"), "฿1,250");
});

test("Product schema is emitted only for an indexable product with a fresh exact price", () => {
  const useful = product({
    whyNeeded: "เหตุผลประกอบที่อธิบายประโยชน์และบริบทการใช้งานจริงให้ผู้อ่านเข้าใจได้ชัดเจน",
    benefits: ["ช่วยตรวจข้อมูล", "ช่วยเปรียบเทียบก่อนเลือก"],
    priceLabel: "1,250",
    priceCheckedAt: new Date("2026-07-20T00:00:00Z"),
  });
  const now = new Date("2026-07-31T00:00:00Z");
  assert.equal(freshSchemaPrice(useful, now), "1250");
  const fresh = productStructuredData(useful, "https://kasettakonthai.com", now);
  assert.deepEqual(fresh["@graph"].map((node) => node["@type"]), ["Product", "BreadcrumbList"]);
  const offer = fresh["@graph"][0].offers as Record<string, unknown>;
  assert.equal(offer.price, "1250");
  assert.equal(offer.availability, undefined);
  const breadcrumbs = fresh["@graph"][1].itemListElement as Record<string, unknown>[];
  assert.equal(breadcrumbs.length, 4);
  assert.equal(
    breadcrumbs[2].item,
    "https://kasettakonthai.com/products/category/plants",
  );

  const abbreviated = productStructuredData(
    {
      ...useful,
      shopeeId: "6709159815",
      priceLabel: "1.8",
    },
    "https://kasettakonthai.com",
    now,
  );
  assert.deepEqual(abbreviated["@graph"].map((node) => node["@type"]), ["BreadcrumbList"]);

  const stale = productStructuredData(
    { ...useful, priceCheckedAt: new Date("2026-05-01T00:00:00Z") },
    "https://kasettakonthai.com",
    now,
  );
  assert.deepEqual(stale["@graph"].map((node) => node["@type"]), ["BreadcrumbList"]);
});
