import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildProductEditorialContent,
  type ProductEditorialContent,
} from "../lib/productEditorial";
import {
  getAllProducts,
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
} from "../lib/products";
import { prisma } from "../lib/prisma";

const APPLY = process.argv.includes("--apply");
const REFRESH_FAMILIES = new Set(
  process.argv
    .filter((argument) => argument.startsWith("--refresh-family="))
    .map((argument) => argument.slice("--refresh-family=".length))
    .filter(Boolean),
);
const ONLY_SLUGS = new Set(
  process.argv
    .filter((argument) => argument.startsWith("--only-slug="))
    .map((argument) => argument.slice("--only-slug=".length))
    .filter(Boolean),
);
const BACKUP_PATH =
  process.argv.find((argument) => argument.startsWith("--backup="))?.slice(9) ||
  path.join(
    process.cwd(),
    ".backups",
    `products-editorial-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );

const normalizedName = (name: string) =>
  name.toLocaleLowerCase("th-TH").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const allProducts = await getAllProducts();
const nameCounts = new Map<string, number>();
for (const product of allProducts) {
  const key = normalizedName(productDisplayName(product));
  nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
}
const products = allProducts.filter(
  (product) => ONLY_SLUGS.size === 0 || ONLY_SLUGS.has(product.slug),
);

type PreparedUpdate = {
  id: string;
  slug: string;
  name: string;
  family: string;
  scoreBefore: number;
  indexableBefore: boolean;
  data: {
    whyNeeded?: string;
    benefits?: string;
    usage?: string;
    howToChoose?: string;
    useCasesJson?: string;
    safetyNote?: string;
  };
  preview: ProductEditorialContent;
};

const updates: PreparedUpdate[] = [];
const skipped = {
  inactive: 0,
  duplicateName: 0,
  noSafeTemplate: 0,
  alreadyComplete: 0,
};

for (const product of products) {
  if (product.status !== "active") {
    skipped.inactive++;
    continue;
  }
  const displayName = productDisplayName(product);
  if ((nameCounts.get(normalizedName(displayName)) ?? 0) > 1) {
    skipped.duplicateName++;
    continue;
  }
  const editorial = buildProductEditorialContent(product.name, product.category);
  if (!editorial) {
    skipped.noSafeTemplate++;
    continue;
  }

  const data: PreparedUpdate["data"] = {};
  const refreshFamily = REFRESH_FAMILIES.has(editorial.family);
  if (refreshFamily || !product.whyNeeded.trim() || product.whyNeeded.startsWith("สินค้าเกษตรที่เกี่ยวข้องกับ")) {
    data.whyNeeded = editorial.whyNeeded;
  }
  if (refreshFamily || product.benefits.filter(Boolean).length < 2) {
    data.benefits = JSON.stringify(editorial.benefits);
  }
  if (refreshFamily || product.usage.trim().length < 40) data.usage = editorial.usage;
  if (refreshFamily || product.howToChoose.trim().length < 40) data.howToChoose = editorial.howToChoose;
  if (refreshFamily || product.useCases.filter(Boolean).length < 2) {
    data.useCasesJson = JSON.stringify(editorial.useCases);
  }
  if (refreshFamily || product.safetyNote.trim().length < 40) data.safetyNote = editorial.safetyNote;

  if (Object.keys(data).length === 0) {
    skipped.alreadyComplete++;
    continue;
  }
  updates.push({
    id: product.id,
    slug: product.slug,
    name: displayName,
    family: editorial.family,
    scoreBefore: productEditorialScore(product),
    indexableBefore: isProductIndexable(product),
    data,
    preview: editorial,
  });
}

const familyCounts = Object.fromEntries(
  [...new Set(updates.map((update) => update.family))]
    .map((family) => [family, updates.filter((update) => update.family === family).length] as const)
    .sort((left, right) => right[1] - left[1]),
);
const newlyIndexable = updates.filter((update) => !update.indexableBefore).length;
const summary = {
  mode: APPLY ? "apply" : "dry-run",
  products: products.length,
  updates: updates.length,
  newlyIndexable,
  familyCounts,
  refreshFamilies: [...REFRESH_FAMILIES],
  targetSlugs: [...ONLY_SLUGS],
  skipped,
  samples: [...updates]
    .sort((left, right) => Number(left.indexableBefore) - Number(right.indexableBefore))
    .slice(0, 30)
    .map(({ id: _id, data: _data, preview: _preview, ...update }) => update),
};

console.log(JSON.stringify(summary, null, 2));

if (APPLY) {
  mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
  const backup = await prisma.product.findMany({
    where: { id: { in: updates.map((update) => update.id) } },
    select: {
      id: true,
      slug: true,
      name: true,
      whyNeeded: true,
      benefits: true,
      usage: true,
      howToChoose: true,
      useCasesJson: true,
      safetyNote: true,
      updatedAt: true,
    },
  });
  writeFileSync(
    BACKUP_PATH,
    `${JSON.stringify({ createdAt: new Date().toISOString(), rows: backup }, null, 2)}\n`,
    { flag: "wx" },
  );

  for (let index = 0; index < updates.length; index += 50) {
    const batch = updates.slice(index, index + 50);
    await prisma.$transaction(
      batch.map((update) =>
        prisma.product.update({ where: { id: update.id }, data: update.data }),
      ),
    );
  }
  console.log(`Backup: ${BACKUP_PATH}`);
  console.log(`Updated: ${updates.length}`);
}

await prisma.$disconnect();
