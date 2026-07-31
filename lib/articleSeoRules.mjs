// SEO consolidation rules reviewed against production content and Search Console
// performance on 2026-07-31. Keep this file plain ESM so Next config and app code
// share one source of truth.
export const ARTICLE_REDIRECTS = Object.freeze({
  "soil-water-fertilizer-clay-soil-611": "soil-water-fertilizer-clay-soil-581",
  "soil-water-fertilizer-manure-types-616": "soil-water-fertilizer-manure-types-601",
  "soil-water-fertilizer-compost-614": "soil-water-fertilizer-compost-644",
  "soil-water-fertilizer-npk-fertilizer-647": "soil-water-fertilizer-npk-fertilizer-617",
  "diseases-care-asf-pig-707": "diseases-care-asf-pig-722",
  "agri-tech-tools-farm-google-sheets-944": "agri-tech-tools-farm-google-sheets-964",
  "agri-tech-tools-battery-sprayer-947-guide-9471": "agri-tech-tools-battery-sprayer-947",
  "plants-care-riceberry-decision-119": "plants-how-to-grow-riceberry-decision-89",
});

export const REDIRECTED_ARTICLE_SLUGS = Object.freeze(Object.keys(ARTICLE_REDIRECTS));

// These pairs cover different search intents and should remain separate pages.
// Only their duplicated SERP titles are rewritten; the editorial H1 stays intact.
export const ARTICLE_SEO_TITLES = Object.freeze({
  "diseases-care-weed-control-689": "วิธีควบคุมวัชพืชในแปลงผักและนาข้าว",
  "diseases-care-weed-control-704": "วัชพืชในแปลงผัก: วิธีคุมตามช่วงการเติบโต",
  "agri-news-law-standards-organic-thailand-982": "Organic Thailand คืออะไร และขั้นตอนขอรับรอง",
  "agri-news-law-standards-organic-thailand-992": "ขอ Organic Thailand แบบกลุ่ม: ขั้นตอนและเอกสาร",
  "agri-news-law-standards-processed-food-law-984": "ขอเลข อย. อาหารแปรรูปจากผลผลิตเกษตร",
  "agri-news-law-standards-processed-food-law-994": "ขอ อย. เนื้อสัตว์แปรรูปและทำฉลากอาหาร",
  "fishery-how-to-raise-snakehead-mistakes-4087": "10 ข้อผิดพลาดวิธีเลี้ยงปลาช่อนสำหรับมือใหม่",
  "fishery-cost-snakehead-mistakes-4117": "10 ข้อผิดพลาดด้านต้นทุนเลี้ยงปลาช่อน",
  "animals-cost-raise-broiler-decision-2389": "ต้นทุนเลี้ยงไก่เนื้อ: เช็กก่อนตัดสินใจเริ่ม",
  "animals-disease-broiler-decision-2399": "โรคไก่เนื้อและความพร้อมก่อนเริ่มเลี้ยง",
  "fishery-pond-snakehead-decision-4099": "บ่อเลี้ยงปลาช่อนแบบไหนเหมาะ เช็กก่อนเริ่ม",
  "fishery-feed-snakehead-decision-4109": "อาหารปลาช่อนและต้นทุนก่อนเริ่มเลี้ยง",
});

export function canonicalArticleSlug(slug) {
  return ARTICLE_REDIRECTS[slug] ?? slug;
}

export function articleSeoTitle(slug, fallbackTitle) {
  return ARTICLE_SEO_TITLES[slug] ?? fallbackTitle;
}
