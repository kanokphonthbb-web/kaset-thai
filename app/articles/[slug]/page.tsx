import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ARTICLES, getArticle, imageFor } from "@/lib/data";
import { getArticleContent } from "@/lib/articleContent";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import DbArticleView from "@/components/DbArticleView";

type Params = { params: { slug: string } };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function getDbPost(slug: string) {
  try {
    return await prisma.article.findFirst({
      where: { slug, status: "published" },
      include: { category: { select: { name: true } } },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = safeDecode(params.slug);
  const dbPost = await getDbPost(slug);
  if (dbPost) {
    const cover = dbPost.coverImage
      ? dbPost.coverImage.startsWith("http")
        ? dbPost.coverImage
        : `${SITE_URL}${dbPost.coverImage}`
      : undefined;
    return {
      title: dbPost.seoTitle || dbPost.title,
      description: dbPost.metaDescription || dbPost.excerpt,
      openGraph: {
        title: dbPost.title,
        description: dbPost.metaDescription,
        type: "article",
        images: cover ? [cover] : undefined,
      },
    };
  }
  const article = getArticle(slug);
  if (!article) return { title: "ไม่พบบทความ" };
  const cover = imageFor(slug, 1200) ?? undefined;
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const slug = safeDecode(params.slug);

  // 1) บทความจาก CMS (เผยแพร่แล้ว) มาก่อน
  const dbPost = await getDbPost(slug);
  if (dbPost) return <DbArticleView post={dbPost} />;

  // 2) บทความ seed แบบ static
  const article = getArticle(slug);
  const content = getArticleContent(slug);
  if (!article || !content) notFound();

  const related = ARTICLES.filter(
    (a) => a.categoryHref === article.categoryHref && a.slug !== article.slug,
  ).slice(0, 3);

  const articleUrl = `${SITE_URL}/articles/${article.slug}`;
  const faqs = content.faqs ?? [];

  // @graph: Article + BreadcrumbList (+ FAQPage — built from the SAME faqs array
  // that renders the visible FAQ, so schema always matches HTML 100%)
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: article.title,
      description: article.description,
      articleSection: article.category,
      inLanguage: "th-TH",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Organization", name: "เกษตรกรไทย" },
      publisher: { "@type": "Organization", name: "เกษตรกรไทย" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: article.category,
          item: `${SITE_URL}${article.categoryHref}`,
        },
        { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
      ],
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* Hero band */}
        <section className="bg-mist">
          <div className="container-x py-14">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href={article.categoryHref} className="hover:text-ink">
                {article.category}
              </Link>
            </nav>

            <div className="mt-4 flex items-center gap-3">
              <span className="tag-chip text-xs">{article.category}</span>
              <span className="text-sm text-stone">
                อ่าน {article.readMinutes} นาที
              </span>
            </div>

            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone">{content.lead}</p>

            {imageFor(article.slug, 1400) && (
              <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-linen sm:aspect-[21/9]">
                <Image
                  src={imageFor(article.slug, 1400)!}
                  alt={article.title}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1160px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </section>

        {/* Body */}
        <div className="bg-paper py-16">
          <div className="container-x">
            <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
              {/* Sidebar TOC */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl bg-mist p-5">
                  <p className="eyebrow">สารบัญบทความ</p>
                  <nav className="mt-3 space-y-1" aria-label="สารบัญ">
                    {content.sections.map((s, i) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-stone hover:bg-linen hover:text-ink"
                      >
                        <span className="font-semibold text-ink">{i + 1}.</span>
                        {s.heading}
                      </a>
                    ))}
                    {faqs.length > 0 && (
                      <a
                        href="#faq"
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-stone hover:bg-linen hover:text-ink"
                      >
                        <span className="font-semibold text-ink">
                          {content.sections.length + 1}.
                        </span>
                        คำถามที่พบบ่อย
                      </a>
                    )}
                    {content.summary && (
                      <a
                        href="#summary"
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-stone hover:bg-linen hover:text-ink"
                      >
                        <span className="font-semibold text-ink">
                          {content.sections.length + (faqs.length > 0 ? 2 : 1)}.
                        </span>
                        สรุป
                      </a>
                    )}
                    {content.references && content.references.length > 0 && (
                      <a
                        href="#references"
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-stone hover:bg-linen hover:text-ink"
                      >
                        <span aria-hidden>📚</span>
                        แหล่งข้อมูลอ้างอิง
                      </a>
                    )}
                  </nav>
                </div>
              </aside>

              {/* Content */}
              <article className="min-w-0 max-w-3xl">
                {/* Short Answer — Direct answer for readers & AI search (AEO) */}
                {content.shortAnswer && (
                  <section
                    id="short-answer"
                    className="mb-10 scroll-mt-24 rounded-2xl bg-lime-canopy p-6"
                  >
                    <p className="eyebrow">คำตอบสั้น ๆ</p>
                    <p className="mt-2 text-[17px] font-medium text-ink">
                      {content.shortAnswer}
                    </p>
                  </section>
                )}

                {content.sections.map((s, i) => (
                  <section
                    key={s.id}
                    id={s.id}
                    className={`scroll-mt-24 ${i > 0 ? "mt-12" : ""}`}
                  >
                    <h2 className="font-display text-2xl font-bold text-ink">
                      {s.heading}
                    </h2>

                    {s.body.map((p, j) => (
                      <p key={j} className="mt-3 text-[17px] text-ink/90">
                        {p}
                      </p>
                    ))}

                    {s.list && (
                      <ul className="mt-4 space-y-2">
                        {s.list.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span
                              aria-hidden
                              className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime-canopy text-xs text-ink"
                            >
                              ✓
                            </span>
                            <span className="text-[17px] text-ink/90">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {s.table && (
                      <div className="mt-5 -mx-1 overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-linen text-ink">
                              {s.table.headers.map((h, k) => (
                                <th
                                  key={h}
                                  className={`px-4 py-3 font-semibold ${
                                    k === 0 ? "rounded-l-lg" : ""
                                  } ${k === s.table!.headers.length - 1 ? "rounded-r-lg" : ""}`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.table.rows.map((row, ri) => (
                              <tr key={ri} className="border-b border-linen">
                                {row.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className={`px-4 py-3 ${
                                      ci === 0
                                        ? "font-medium text-ink"
                                        : ci === row.length - 1
                                          ? "text-stone"
                                          : "text-ink/90"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {s.tip && (
                      <div className="mt-5 rounded-2xl border-l-4 border-lime-canopy bg-mist p-5">
                        <p className="font-display font-bold text-ink">
                          💡 {s.tip.title}
                        </p>
                        <p className="mt-2 text-[15px] text-ink/90">
                          {s.tip.text}
                        </p>
                      </div>
                    )}
                  </section>
                ))}

                {/* FAQ — visible <details> built from the same faqs used for schema */}
                {faqs.length > 0 && (
                  <section id="faq" className="mt-12 scroll-mt-24">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      คำถามที่พบบ่อย
                    </h2>
                    <div className="mt-5 space-y-3">
                      {faqs.map((f) => (
                        <details
                          key={f.q}
                          className="group rounded-2xl bg-mist p-5 [&_summary::-webkit-details-marker]:hidden"
                        >
                          <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                            {f.q}
                            <span
                              className="shrink-0 text-lg text-stone transition-transform group-open:rotate-45"
                              aria-hidden
                            >
                              +
                            </span>
                          </summary>
                          <p className="mt-3 text-[15px] text-ink/90">{f.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                {/* Summary — สรุปท้ายบทความ */}
                {content.summary && (
                  <section id="summary" className="mt-12 scroll-mt-24">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      สรุป
                    </h2>
                    <p className="mt-3 text-[17px] text-ink/90">
                      {content.summary}
                    </p>
                  </section>
                )}

                {/* References — แหล่งข้อมูลอ้างอิง (E-E-A-T) */}
                {content.references && content.references.length > 0 && (
                  <section id="references" className="mt-12 scroll-mt-24">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      แหล่งข้อมูลอ้างอิง
                    </h2>
                    <ul className="mt-4 space-y-2">
                      {content.references.map((r) => (
                        <li key={r.label} className="flex items-start gap-2.5">
                          <span aria-hidden className="mt-1 text-stone">
                            📚
                          </span>
                          <span className="text-[15px] text-ink/90">
                            <span className="font-semibold">{r.label}</span>
                            {r.note && (
                              <span className="text-stone"> — {r.note}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-stone">
                      * ข้อมูลบางอย่าง เช่น ราคาและคำแนะนำการใช้สาร
                      อาจเปลี่ยนแปลงได้ ควรตรวจสอบล่าสุดจากหน่วยงานทางการก่อนตัดสินใจ
                    </p>
                  </section>
                )}

                {/* Tools nudge */}
                <div className="mt-12 rounded-2xl bg-lime-canopy p-6">
                  <p className="font-display text-lg font-bold text-ink">
                    ลองคำนวณต้นทุนก่อนลงมือ
                  </p>
                  <p className="mt-1 text-sm text-ink/80">
                    ใช้เครื่องมือของเราประเมินต้นทุนและกำไรได้ฟรี
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/tools/plant-cost"
                      className="btn bg-paper text-ink hover:bg-mist"
                    >
                      📊 ต้นทุนปลูกพืช
                    </Link>
                    <Link
                      href="/tools/animal-cost"
                      className="btn bg-paper text-ink hover:bg-mist"
                    >
                      🐖 ต้นทุนเลี้ยงสัตว์
                    </Link>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href={article.categoryHref} className="btn-secondary">
                    ← ดูบทความอื่นในหมวด {article.category}
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="bg-linen py-16">
            <div className="container-x">
              <h2 className="font-display text-2xl font-bold text-ink">
                บทความที่เกี่ยวข้อง
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/articles/${a.slug}`}
                      className="group flex h-full items-start gap-3 rounded-2xl bg-paper p-5 transition-colors hover:bg-mist"
                    >
                      <span className="text-2xl" aria-hidden>
                        {a.emoji}
                      </span>
                      <span className="font-semibold text-ink group-hover:underline">
                        {a.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
