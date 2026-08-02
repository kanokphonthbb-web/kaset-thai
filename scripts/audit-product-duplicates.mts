import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import {
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
} from "../lib/products";

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("th-TH")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const imageHash = (imageUrl: string): string | null => {
  if (!imageUrl.startsWith("/")) return null;
  const imagePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  if (!existsSync(imagePath)) return null;
  return createHash("sha256").update(readFileSync(imagePath)).digest("hex");
};

const rows = await prisma.product.findMany({
  where: { status: "active" },
  orderBy: [{ createdAt: "asc" }, { slug: "asc" }],
});

const products = rows.map((row) => {
  const parseList = (value: string): string[] => {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    affiliateLink: row.affiliateLink,
    category: row.category,
    keywords: parseList(row.keywords),
    whyNeeded: row.whyNeeded,
    benefits: parseList(row.benefits),
    usage: row.usage,
    shopeeId: row.shopeeId,
    status: row.status,
    howToChoose: row.howToChoose,
    useCases: parseList(row.useCasesJson),
    safetyNote: row.safetyNote,
    priceLabel: row.priceLabel,
    priceCheckedAt: row.priceCheckedAt,
    relatedArticles: parseList(row.relatedArticlesJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
});

const byName = new Map<string, typeof products>();
for (const product of products) {
  const key = normalize(productDisplayName(product));
  const group = byName.get(key) ?? [];
  group.push(product);
  byName.set(key, group);
}

const duplicateGroups = [...byName.entries()]
  .filter(([, group]) => group.length > 1)
  .map(([normalizedName, group]) => ({
    normalizedName,
    exactSameAffiliateLink: new Set(group.map((product) => product.affiliateLink)).size === 1,
    exactSameImage: new Set(group.map((product) => product.imageUrl)).size === 1,
    exactSameImageContent:
      new Set(group.map((product) => imageHash(product.imageUrl)).filter(Boolean)).size === 1 &&
      group.every((product) => Boolean(imageHash(product.imageUrl))),
    exactSameCategory: new Set(group.map((product) => product.category)).size === 1,
    products: group.map((product) => ({
      slug: product.slug,
      shopeeId: product.shopeeId,
      name: productDisplayName(product),
      category: product.category,
      affiliateLink: product.affiliateLink,
      imageUrl: product.imageUrl,
      editorialScore: productEditorialScore(product),
      indexable: isProductIndexable(product),
      keywordCount: product.keywords.length,
      relatedArticleCount: product.relatedArticles.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })),
  }))
  .sort((left, right) =>
    left.normalizedName.localeCompare(right.normalizedName, "th"),
  );

const canonicalRank = (product: (typeof duplicateGroups)[number]["products"][number]) =>
  Number(Boolean(product.shopeeId)) * 10_000_000 +
  Number(product.indexable) * 1_000_000 +
  product.relatedArticleCount * 10_000 +
  product.editorialScore * 1_000 +
  product.keywordCount;

if (process.argv.includes("--compact")) {
  console.log(
    JSON.stringify(
      duplicateGroups.map((group) => {
        const ranked = [...group.products].sort(
          (left, right) =>
            canonicalRank(right) - canonicalRank(left) ||
            left.createdAt.getTime() - right.createdAt.getTime(),
        );
        return {
          name: ranked[0].name,
          canonical: ranked[0].slug,
          canonicalCategory: ranked[0].category,
          sources: ranked.slice(1).map((product) => product.slug),
          categories: [...new Set(group.products.map((product) => product.category))],
          indexablePages: group.products.filter((product) => product.indexable).length,
        };
      }),
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

if (process.argv.includes("--summary")) {
  console.log(
    JSON.stringify(
      {
        totalProducts: products.length,
        duplicateGroups: duplicateGroups.length,
        duplicatePages: duplicateGroups.reduce(
          (sum, group) => sum + group.products.length,
          0,
        ),
        sameAffiliateLinkGroups: duplicateGroups.filter(
          (group) => group.exactSameAffiliateLink,
        ).length,
        sameImageUrlGroups: duplicateGroups.filter(
          (group) => group.exactSameImage,
        ).length,
        sameImageContentGroups: duplicateGroups.filter(
          (group) => group.exactSameImageContent,
        ).length,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      totalProducts: products.length,
      duplicateGroups: duplicateGroups.length,
      duplicatePages: duplicateGroups.reduce(
        (sum, group) => sum + group.products.length,
        0,
      ),
      sameAffiliateLinkGroups: duplicateGroups.filter(
        (group) => group.exactSameAffiliateLink,
      ).length,
      sameImageGroups: duplicateGroups.filter((group) => group.exactSameImage).length,
      sameImageContentGroups: duplicateGroups.filter(
        (group) => group.exactSameImageContent,
      ).length,
      groups: duplicateGroups,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
