import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import { tocFromHtml } from "@/lib/blocks";
import { SITE_URL } from "@/lib/site";

type DbPost = {
  title: string;
  slug: string;
  content: string;
  format: string;
  coverImage: string;
  metaDescription: string;
  excerpt: string;
  blocksJson: string;
  faqJson: string;
  category: { name: string } | null;
};

export default function DbArticleView({ post }: { post: DbPost }) {
  const toc = tocFromHtml(post.content);
  let faqs: { q: string; a: string }[] = [];
  try {
    faqs = JSON.parse(post.faqJson) as { q: string; a: string }[];
  } catch {}

  const url = `${SITE_URL}/articles/${post.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      inLanguage: "th-TH",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "เกษตรกรไทย" },
      publisher: { "@type": "Organization", name: "เกษตรกรไทย" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "บทความ", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
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
        <section className="bg-mist">
          <div className="container-x py-14">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">หน้าแรก</Link>
              <span className="mx-2" aria-hidden>/</span>
              <Link href="/blog" className="hover:text-ink">บทความ</Link>
            </nav>
            <div className="mt-4 flex items-center gap-3">
              {post.category && <span className="tag-chip text-xs">{post.category.name}</span>}
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-snug text-ink sm:text-5xl">
              {post.title}
            </h1>
            {post.metaDescription && (
              <p className="mt-4 max-w-4xl text-lg text-stone">{post.metaDescription}</p>
            )}
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover sm:aspect-[21/9]"
              />
            )}
          </div>
        </section>

        <div className="bg-paper py-16">
          <div className="container-x">
            <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
              {toc.length > 0 && (
                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <div className="rounded-2xl bg-mist p-5">
                    <p className="eyebrow">สารบัญบทความ</p>
                    <nav className="mt-3 space-y-1" aria-label="สารบัญ">
                      {toc.map((t) => (
                        <a
                          key={t.id}
                          href={`#${t.id}`}
                          className={`block rounded-lg px-3 py-1.5 text-sm text-stone hover:bg-linen hover:text-ink ${t.level === 3 ? "pl-6" : ""}`}
                        >
                          {t.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              <article className="min-w-0">
                <div
                  className="cc-article"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* FAQ อัตโนมัติ — ข้ามถ้าเป็น HTML mode (ผู้เขียนใส่ FAQ เองในเนื้อหาแล้ว) */}
                {faqs.length > 0 && post.format !== "html" && (
                  <section id="faq" className="mt-12">
                    <h2 className="font-display text-2xl font-bold text-ink">
                      คำถามที่พบบ่อย
                    </h2>
                    <div className="mt-5 space-y-3">
                      {faqs.map((f) => (
                        <details key={f.q} className="group rounded-2xl bg-mist p-5 [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                            {f.q}
                            <span className="shrink-0 text-lg text-stone transition-transform group-open:rotate-45" aria-hidden>+</span>
                          </summary>
                          <p className="mt-3 text-[15px] text-ink/90">{f.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                <div className="mt-10">
                  <Link href="/blog" className="btn-secondary">← ดูบทความอื่น</Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
