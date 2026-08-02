// Reviewed groups of product pages that target the same product intent.
// Keep one canonical landing page per group while retaining the source rows as
// alternate merchant links. Categories describe the product itself, not the
// article/query that originally discovered it.
export const PRODUCT_CANONICAL_GROUPS = Object.freeze([
  { canonical: "product-43011146446", duplicates: ["product-44955912670"], category: "animals" },
  { canonical: "product-4853421616", duplicates: ["product-179", "product-27292711512"], category: "animals" },
  { canonical: "product-25695728385", duplicates: ["product-29438061285"], category: "fishery" },
  { canonical: "product-26666145762", duplicates: ["product-315", "product-29239811963"], category: "fishery" },
  { canonical: "product-48808708651", duplicates: ["product-52708822977"], category: "market" },
  { canonical: "product-24670888147", duplicates: ["product-44864137974", "product-52963649673"], category: "plants" },
  { canonical: "product-20605724917", duplicates: ["product-21002344449"], category: "market" },
  { canonical: "product-24224696439", duplicates: ["product-27459047943"], category: "plants" },
  { canonical: "product-45804038874", duplicates: ["product-56703973013"], category: "market" },
  { canonical: "product-16296156249", duplicates: ["product-26932170393"], category: "market" },
  { canonical: "product-26100082723", duplicates: ["product-26834061439"], category: "market" },
  { canonical: "product-40808156058", duplicates: ["product-47952579351", "product-48303800889"], category: "agri-tech-tools" },
  { canonical: "product-17078149517", duplicates: ["product-17965939156"], category: "agri-tech-tools" },
  { canonical: "product-44466468021", duplicates: ["product-48153837127"], category: "market" },
  { canonical: "product-48455916894", duplicates: ["product-48755916835"], category: "agri-tech-tools" },
  { canonical: "product-18495080275", duplicates: ["product-40872821579"], category: "animals" },
  { canonical: "product-28930161052", duplicates: ["product-314", "product-42915118045"], category: "fishery" },
  { canonical: "product-53664633329", duplicates: ["product-56663240815"], category: "fishery" },
  { canonical: "product-13977120875", duplicates: ["product-456"], category: "fishery" },
  { canonical: "product-39", duplicates: ["product-372"], category: "soil-water-fertilizer" },
  { canonical: "product-41255800450", duplicates: ["product-23913072399"], category: "market" },
  { canonical: "product-50405445420", duplicates: ["product-50555875985"], category: "other" },
  { canonical: "product-18289814550", duplicates: ["product-23574477327"], category: "diseases" },
  { canonical: "product-24693653204", duplicates: ["product-41330332898", "product-48659415923", "product-49559420898"], category: "market" },
  { canonical: "product-51964085866", duplicates: ["product-53414808177"], category: "plants" },
  { canonical: "product-505", duplicates: ["product-507"], category: "diseases" },
  { canonical: "product-24907603112", duplicates: ["product-51951287773"], category: "animals" },
  { canonical: "product-27441138876", duplicates: ["product-40817407851"], category: "animals" },
  { canonical: "product-41567548433", duplicates: ["product-42467579315", "product-43567408434"], category: "animals" },
  { canonical: "product-28089134991", duplicates: ["product-28515848092"], category: "market" },
  { canonical: "product-6340809217", duplicates: ["product-7816659554", "product-22270875721", "product-16336573691"], category: "diseases" },
  { canonical: "product-4479229590", duplicates: ["product-518"], category: "diseases" },
  { canonical: "product-24571312988", duplicates: ["product-25571482724"], category: "market" },
  { canonical: "product-14608762641", duplicates: ["product-13320744029"], category: "cost-profit" },
  { canonical: "product-54802218372", duplicates: ["product-503"], category: "cost-profit" },
  { canonical: "product-53964107262", duplicates: ["product-41163953801"], category: "cost-profit" },
  { canonical: "product-48113812508", duplicates: ["product-57713787951", "product-504"], category: "cost-profit" },
  { canonical: "product-23422709843", duplicates: ["product-40252070095"], category: "market" },
  { canonical: "product-20570666101", duplicates: ["product-22316829013"], category: "plants" },
  { canonical: "product-20756772159", duplicates: ["product-23302090091"], category: "fishery" },
  { canonical: "product-21871157095", duplicates: ["product-22318204855"], category: "diseases" },
  { canonical: "product-45562866028", duplicates: ["product-49362863077", "product-55662838068"], category: "plants" },
  { canonical: "product-14060754833", duplicates: ["product-215"], category: "agri-tech-tools" },
  { canonical: "product-8562328393", duplicates: ["product-11710299161"], category: "fishery" },
  { canonical: "product-41428735818", duplicates: ["product-55006411920", "product-56906933813"], category: "diseases" },
  { canonical: "product-1630814234", duplicates: ["product-482"], category: "cost-profit" },
  { canonical: "product-24608753550", duplicates: ["product-25555148153"], category: "agri-tech-tools" },
  { canonical: "product-18295296308", duplicates: ["product-24906110097"], category: "market" },
]);

export const PRODUCT_REDIRECTS = Object.freeze(
  Object.fromEntries(
    PRODUCT_CANONICAL_GROUPS.flatMap((group) =>
      group.duplicates.map((slug) => [slug, group.canonical]),
    ),
  ),
);

const GROUP_BY_SLUG = new Map(
  PRODUCT_CANONICAL_GROUPS.flatMap((group) =>
    [group.canonical, ...group.duplicates].map((slug) => [slug, group]),
  ),
);

export function canonicalProductSlug(slug) {
  return PRODUCT_REDIRECTS[slug] ?? slug;
}

export function canonicalProductGroup(slug) {
  return GROUP_BY_SLUG.get(slug) ?? null;
}

export function isCanonicalProductSlug(slug) {
  return !Object.hasOwn(PRODUCT_REDIRECTS, slug);
}
