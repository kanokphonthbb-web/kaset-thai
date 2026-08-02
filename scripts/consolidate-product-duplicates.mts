import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import {
  PRODUCT_CANONICAL_GROUPS,
  canonicalProductSlug,
} from "../lib/productCanonical.mjs";

const APPLY = process.argv.includes("--apply");

const parseList = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return [];
  }
};

const unique = (values: string[], limit?: number) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLocaleLowerCase("th-TH");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (limit && result.length >= limit) break;
  }
  return result;
};

const bestText = (values: string[], fallback: string) =>
  [...values]
    .filter((value) => value.trim().length >= 40)
    .sort((left, right) => right.trim().length - left.trim().length)[0] ?? fallback;

const bestList = (values: string[][], fallback: string[]) =>
  [...values]
    .filter((items) => items.filter(Boolean).length >= 2)
    .sort(
      (left, right) =>
        right.length - left.length ||
        right.join(" ").length - left.join(" ").length,
    )[0] ?? fallback;

const allSlugs = PRODUCT_CANONICAL_GROUPS.flatMap((group) => [
  group.canonical,
  ...group.duplicates,
]);
const uniqueSlugs = new Set(allSlugs);
if (uniqueSlugs.size !== allSlugs.length) {
  throw new Error("Canonical product groups contain a slug more than once");
}

const rows = await prisma.product.findMany({
  where: { slug: { in: allSlugs } },
  orderBy: { createdAt: "asc" },
});
const rowBySlug = new Map(rows.map((row) => [row.slug, row]));
const missing = allSlugs.filter((slug) => !rowBySlug.has(slug));
if (missing.length > 0) {
  throw new Error(`Missing product rows: ${missing.join(", ")}`);
}

const preparedGroups = PRODUCT_CANONICAL_GROUPS.map((group) => {
  const canonical = rowBySlug.get(group.canonical)!;
  const groupRows = [group.canonical, ...group.duplicates].map((slug) => rowBySlug.get(slug)!);
  const canonicalBenefits = parseList(canonical.benefits);
  const canonicalUseCases = parseList(canonical.useCasesJson);
  return {
    ...group,
    rows: groupRows,
    canonicalRow: canonical,
    canonicalShopeeId: canonical.shopeeId,
    data: {
      category: group.category,
      keywords: JSON.stringify(
        unique(groupRows.flatMap((row) => parseList(row.keywords))),
      ),
      whyNeeded: bestText(groupRows.map((row) => row.whyNeeded), canonical.whyNeeded),
      benefits: JSON.stringify(
        bestList(groupRows.map((row) => parseList(row.benefits)), canonicalBenefits),
      ),
      usage: bestText(groupRows.map((row) => row.usage), canonical.usage),
      howToChoose: bestText(
        groupRows.map((row) => row.howToChoose),
        canonical.howToChoose,
      ),
      useCasesJson: JSON.stringify(
        unique(groupRows.flatMap((row) => parseList(row.useCasesJson)), 8).length >= 2
          ? unique(groupRows.flatMap((row) => parseList(row.useCasesJson)), 8)
          : canonicalUseCases,
      ),
      safetyNote: bestText(
        groupRows.map((row) => row.safetyNote),
        canonical.safetyNote,
      ),
      relatedArticlesJson: JSON.stringify(
        unique(groupRows.flatMap((row) => parseList(row.relatedArticlesJson)), 6),
      ),
      status: "active",
    },
  };
});

const shopeeIdRedirects = new Map<string, string>();
for (const group of preparedGroups) {
  if (!group.canonicalShopeeId) continue;
  for (const row of group.rows) {
    if (row.shopeeId && row.shopeeId !== group.canonicalShopeeId) {
      shopeeIdRedirects.set(row.shopeeId, group.canonicalShopeeId);
    }
  }
}

const articles = await prisma.article.findMany({
  where: { productsJson: { not: "[]" } },
  select: { id: true, slug: true, productsJson: true, updatedAt: true },
});
const articleUpdates = articles.flatMap((article) => {
  const before = parseList(article.productsJson);
  const after = unique(
    before.map((shopeeId) => shopeeIdRedirects.get(shopeeId) ?? shopeeId),
    4,
  );
  return JSON.stringify(before) === JSON.stringify(after)
    ? []
    : [{ ...article, productsJsonAfter: JSON.stringify(after) }];
});

const summary = {
  mode: APPLY ? "apply" : "dry-run",
  groups: preparedGroups.length,
  canonicalPages: preparedGroups.length,
  mergedPages: preparedGroups.reduce((sum, group) => sum + group.duplicates.length, 0),
  categoryCorrections: preparedGroups.filter((group) =>
    group.rows.some((row) => row.category !== group.category),
  ).length,
  articleAssignmentsRewritten: articleUpdates.length,
  shopeeIdRedirects: shopeeIdRedirects.size,
  samples: preparedGroups.slice(0, 12).map((group) => ({
    canonical: group.canonical,
    merged: group.duplicates,
    category: group.category,
    canonicalShopeeId: group.canonicalShopeeId,
  })),
};

console.log(JSON.stringify(summary, null, 2));

if (APPLY) {
  const backupDirectory = path.join(process.cwd(), ".backups");
  mkdirSync(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDirectory,
    `product-dedup-before-${timestamp}.json`,
  );
  writeFileSync(
    backupPath,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        products: rows,
        articles: articleUpdates.map(({ productsJsonAfter: _after, ...article }) => article),
      },
      null,
      2,
    )}\n`,
    { flag: "wx" },
  );

  for (const group of preparedGroups) {
    await prisma.$transaction([
      prisma.product.update({
        where: { slug: group.canonical },
        data: group.data,
      }),
      ...group.duplicates.map((slug) =>
        prisma.product.update({
          where: { slug },
          data: { status: "merged", category: group.category },
        }),
      ),
    ]);
  }

  for (let index = 0; index < articleUpdates.length; index += 50) {
    const batch = articleUpdates.slice(index, index + 50);
    await prisma.$transaction(
      batch.map((article) =>
        prisma.article.update({
          where: { id: article.id },
          data: { productsJson: article.productsJsonAfter },
        }),
      ),
    );
  }

  console.log(`Backup: ${backupPath}`);
  console.log(`Canonical check: ${allSlugs.every((slug) => Boolean(canonicalProductSlug(slug)))}`);
}

await prisma.$disconnect();
