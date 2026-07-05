import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Block } from "@/lib/blocks";
import type { FaqItem } from "@/lib/seoAnalysis";
import ArticleEditor from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const [post, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id: params.id } }),
    prisma.articleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  let blocks: Block[] = [];
  let faqs: FaqItem[] = [];
  try {
    blocks = JSON.parse(post.blocksJson) as Block[];
  } catch {
    blocks = [];
  }
  try {
    faqs = JSON.parse(post.faqJson) as FaqItem[];
  } catch {
    faqs = [];
  }

  return (
    <ArticleEditor
      id={post.id}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        format: (post.format === "html" ? "html" : "blocks") as "blocks" | "html",
        blocks,
        rawHtml: post.rawHtml,
        faqs,
        coverImage: post.coverImage,
        seoTitle: post.seoTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        articleType: post.articleType ?? "howto",
        categoryId: post.categoryId ?? "",
        status: post.status,
      }}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
