"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  compileBlocks,
  blocksPlainText,
  ensureHeadingIds,
  htmlToAnalysisBlocks,
  type Block,
} from "./blocks";
import { validateArticle } from "./articleValidator";
import type { FaqItem } from "./seoAnalysis";

function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return s || `article-${Date.now()}`;
}

export async function createDraftAction() {
  const post = await prisma.article.create({
    data: { title: "บทความใหม่", slug: `draft-${Date.now()}` },
  });
  redirect(`/admin/articles/${post.id}`);
}

export type SavePayload = {
  title: string;
  slug: string;
  excerpt: string;
  format: "blocks" | "html";
  blocks: Block[];
  rawHtml: string;
  coverImage: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  articleType: string;
  faqs: FaqItem[];
  categoryId: string;
  publish: boolean;
};

export async function savePostAction(
  id: string,
  payload: SavePayload,
): Promise<{ ok: boolean; errors: string[]; slug?: string }> {
  const slug = slugify(payload.slug || payload.title);
  const faqs = payload.faqs.filter((f) => f.q.trim() && f.a.trim());
  const isHtml = payload.format === "html";

  // บล็อกสำหรับ validate/นับคำ (จาก HTML หรือจาก blocks)
  const analysisBlocks = isHtml
    ? htmlToAnalysisBlocks(payload.rawHtml)
    : payload.blocks;

  if (payload.publish) {
    const v = validateArticle({
      title: payload.title,
      slug,
      metaDescription: payload.metaDescription,
      blocks: analysisBlocks,
      faqs,
      articleType: payload.articleType,
    });
    if (!v.ok) return { ok: false, errors: v.errors };
  }

  // slug ต้องไม่ชนกับบทความอื่น
  const clash = await prisma.article.findFirst({
    where: { slug, NOT: { id } },
    select: { id: true },
  });
  if (clash) return { ok: false, errors: [`slug "${slug}" ถูกใช้แล้ว เปลี่ยนใหม่`] };

  const content = isHtml
    ? ensureHeadingIds(payload.rawHtml)
    : compileBlocks(payload.blocks);
  const excerpt =
    payload.excerpt.trim() || blocksPlainText(analysisBlocks).slice(0, 150);

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { publishedAt: true, status: true },
  });

  await prisma.article.update({
    where: { id },
    data: {
      title: payload.title,
      slug,
      excerpt,
      content,
      format: payload.format,
      rawHtml: payload.rawHtml,
      articleType: payload.articleType,
      blocksJson: JSON.stringify(payload.blocks),
      coverImage: payload.coverImage,
      seoTitle: payload.seoTitle,
      metaDescription: payload.metaDescription,
      focusKeyword: payload.focusKeyword,
      faqJson: JSON.stringify(faqs),
      categoryId: payload.categoryId || null,
      status: payload.publish ? "published" : "draft",
      publishedAt: payload.publish
        ? (existing?.publishedAt ?? new Date())
        : existing?.publishedAt ?? null,
    },
  });

  revalidatePath("/blog");
  revalidatePath(`/articles/${slug}`);
  revalidatePath("/admin/articles");
  return { ok: true, errors: [], slug };
}

export async function deletePostAction(id: string) {
  await prisma.article.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function createCategoryAction(name: string) {
  const slug = slugify(name);
  const exists = await prisma.articleCategory.findUnique({ where: { slug } });
  if (exists) return exists;
  return prisma.articleCategory.create({ data: { name, slug } });
}
