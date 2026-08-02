"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { schemaPriceFromLabel } from "@/lib/products";

const CATEGORY_SLUGS = new Set(CATEGORIES.map((category) => category.slug));

function text(formData: FormData, name: string, maxLength: number): string {
  return String(formData.get(name) ?? "")
    .trim()
    .replace(/\r\n/g, "\n")
    .slice(0, maxLength);
}

function lineList(formData: FormData, name: string, maxItems = 8): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const rawLine of text(formData, name, 4_000).split("\n")) {
    const item = rawLine.replace(/^\s*[-•]\s*/u, "").trim().slice(0, 400);
    const normalized = item.toLocaleLowerCase("th-TH");
    if (!item || seen.has(normalized)) continue;
    seen.add(normalized);
    items.push(item);
    if (items.length >= maxItems) break;
  }
  return items;
}

function editUrl(id: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params);
  return `/admin/products/${encodeURIComponent(id)}?${query.toString()}`;
}

export async function saveProductEditorialAction(id: string, formData: FormData) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) redirect("/admin/products?error=not-found");

  const name = text(formData, "name", 180);
  const categoryInput = text(formData, "category", 80);
  const category = CATEGORY_SLUGS.has(categoryInput) ? categoryInput : "";
  const whyNeeded = text(formData, "whyNeeded", 2_000);
  const benefits = lineList(formData, "benefits");
  const usage = text(formData, "usage", 2_000);
  const howToChoose = text(formData, "howToChoose", 2_000);
  const useCases = lineList(formData, "useCases");
  const safetyNote = text(formData, "safetyNote", 2_000);
  const priceLabel = text(formData, "priceLabel", 80);
  const confirmPrice = formData.get("confirmPrice") === "on";
  const clearPrice = formData.get("clearPrice") === "on";

  if (name.length < 4) {
    redirect(editUrl(id, { error: "name" }));
  }
  if (priceLabel && !schemaPriceFromLabel(priceLabel)) {
    redirect(editUrl(id, { error: "price" }));
  }
  if (confirmPrice && !priceLabel) {
    redirect(editUrl(id, { error: "price-required" }));
  }

  const savedPrice = clearPrice ? "" : priceLabel;
  let priceCheckedAt = clearPrice ? null : existing.priceCheckedAt;
  if (!clearPrice && savedPrice !== existing.priceLabel) priceCheckedAt = null;
  if (!clearPrice && confirmPrice) priceCheckedAt = new Date();

  await prisma.product.update({
    where: { id },
    data: {
      name,
      category,
      whyNeeded,
      benefits: JSON.stringify(benefits),
      usage,
      howToChoose,
      useCasesJson: JSON.stringify(useCases),
      safetyNote,
      priceLabel: savedPrice,
      priceCheckedAt,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${existing.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  redirect(editUrl(id, { saved: "1" }));
}
