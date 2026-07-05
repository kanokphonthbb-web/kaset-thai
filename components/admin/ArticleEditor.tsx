"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  savePostAction,
  deletePostAction,
  type SavePayload,
} from "@/lib/blogActions";
import {
  newBlock,
  BLOCK_LABELS,
  compileBlocks,
  htmlToAnalysisBlocks,
  type Block,
} from "@/lib/blocks";
import { analyzeSeo, type FaqItem, type SeoCheck } from "@/lib/seoAnalysis";
import { ARTICLE_TYPES } from "@/lib/articleTypes";

type Initial = {
  title: string;
  slug: string;
  excerpt: string;
  format: "blocks" | "html";
  blocks: Block[];
  rawHtml: string;
  faqs: FaqItem[];
  coverImage: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  articleType: string;
  categoryId: string;
  status: string;
};

const input =
  "w-full rounded-lg border border-ash bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink";

const HTML_TEMPLATE = `<p>เกริ่นนำ พร้อมใส่คีย์เวิร์ดหลักในย่อหน้าแรก อธิบายว่าบทความนี้ช่วยผู้อ่านเรื่องอะไร</p>

<h2>คำตอบสั้น ๆ</h2>
<p>ตอบคำถามหลักแบบตรงประเด็นใน 1–3 ประโยค เพื่อให้ค้นหาและ AI ดึงไปตอบได้</p>

<h2>รายละเอียดหลัก</h2>
<p>อธิบายเนื้อหาให้ครบถ้วน ทำตามได้จริง</p>
<ul>
  <li>ประเด็นที่ 1</li>
  <li>ประเด็นที่ 2</li>
  <li>ประเด็นที่ 3</li>
</ul>

<h2>ตารางสรุป</h2>
<table>
  <thead><tr><th>รายการ</th><th>รายละเอียด</th></tr></thead>
  <tbody>
    <tr><td>หัวข้อ ก</td><td>ข้อมูล</td></tr>
    <tr><td>หัวข้อ ข</td><td>ข้อมูล</td></tr>
  </tbody>
</table>

<h2>ข้อควรระวัง</h2>
<p>ข้อมูลบางอย่างเปลี่ยนแปลงได้ ควรตรวจสอบล่าสุดก่อนตัดสินใจ</p>

<h2>สรุป</h2>
<p>ทวนประเด็นสำคัญและสิ่งที่ผู้อ่านควรจำ</p>`;

export default function ArticleEditor({
  id,
  initial,
  categories,
}: {
  id: string;
  initial: Initial;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [format, setFormat] = useState<"blocks" | "html">(initial.format);
  const [blocks, setBlocks] = useState<Block[]>(initial.blocks);
  const [rawHtml, setRawHtml] = useState(initial.rawHtml);
  const [showPreview, setShowPreview] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>(initial.faqs);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [focusKeyword, setFocusKeyword] = useState(initial.focusKeyword);
  const [articleType, setArticleType] = useState(initial.articleType);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [status, setStatus] = useState(initial.status);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string[] } | null>(null);

  const analysisBlocks = useMemo(
    () => (format === "html" ? htmlToAnalysisBlocks(rawHtml) : blocks),
    [format, rawHtml, blocks],
  );
  const seo = useMemo(
    () =>
      analyzeSeo({
        title,
        seoTitle,
        metaDescription,
        focusKeyword,
        blocks: analysisBlocks,
        faqs,
        articleType,
      }),
    [title, seoTitle, metaDescription, focusKeyword, analysisBlocks, faqs, articleType],
  );
  const previewHtml = format === "html" ? rawHtml : compileBlocks(blocks);

  function updateBlock(i: number, b: Block) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? b : x)));
  }
  function removeBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addBlock(type: Block["type"]) {
    setBlocks((prev) => [...prev, newBlock(type)]);
  }

  function save(publish: boolean) {
    setMsg(null);
    const payload: SavePayload = {
      title,
      slug,
      excerpt,
      format,
      blocks,
      rawHtml,
      faqs,
      coverImage,
      seoTitle,
      metaDescription,
      focusKeyword,
      articleType,
      categoryId,
      publish,
    };
    startTransition(async () => {
      const res = await savePostAction(id, payload);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.errors });
        return;
      }
      setStatus(publish ? "published" : "draft");
      if (res.slug) setSlug(res.slug);
      setMsg({
        kind: "ok",
        text: [publish ? "เผยแพร่บทความแล้ว ✓" : "บันทึกฉบับร่างแล้ว ✓"],
      });
      router.refresh();
    });
  }

  async function uploadCover(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setCoverImage(data.url);
    else alert(data.error || "อัปโหลดไม่สำเร็จ");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main editor */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push("/admin/articles")}
            className="text-stone hover:text-ink"
          >
            ← กลับ
          </button>
          <span className="text-stone">/</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === "published" ? "bg-lime-canopy text-ink" : "bg-linen text-stone"
            }`}
          >
            {status === "published" ? "เผยแพร่" : "ร่าง"}
          </span>
        </div>

        <div className="rounded-2xl bg-paper p-5">
          <label className="text-xs font-semibold text-stone">หัวข้อบทความ (H1)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เลี้ยงไก่ไข่สำหรับมือใหม่ เริ่มกี่ตัวถึงคุ้มทุน"
            className={`${input} mt-1 text-lg font-semibold`}
          />
          <div className="mt-1 text-xs text-stone">{title.length} ตัวอักษร (แนะนำ ≤ 60)</div>
        </div>

        {/* Content mode toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-paper p-3">
          <span className="text-xs font-semibold text-stone">โหมดเขียน:</span>
          <button
            onClick={() => setFormat("blocks")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${format === "blocks" ? "bg-lime-canopy text-ink" : "bg-mist text-stone hover:bg-linen"}`}
          >
            ◫ บล็อก
          </button>
          <button
            onClick={() => setFormat("html")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${format === "html" ? "bg-lime-canopy text-ink" : "bg-mist text-stone hover:bg-linen"}`}
          >
            &lt;/&gt; HTML
          </button>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="ml-auto rounded-full border border-ink px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist"
          >
            {showPreview ? "ปิดตัวอย่าง" : "👁 ดูตัวอย่าง"}
          </button>
        </div>

        {/* Live preview */}
        {showPreview && (
          <div className="rounded-2xl bg-paper p-6 sm:p-8">
            <p className="eyebrow">ตัวอย่างการแสดงผล</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">
              {title || "(ยังไม่มีหัวข้อ)"}
            </h1>
            <div
              className="cc-article mt-5"
              dangerouslySetInnerHTML={{ __html: previewHtml || "<p style='color:#999'>ยังไม่มีเนื้อหา</p>" }}
            />
            {faqs.filter((f) => f.q && f.a).length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-ink">คำถามที่พบบ่อย</h2>
                <div className="mt-3 space-y-2">
                  {faqs
                    .filter((f) => f.q && f.a)
                    .map((f, i) => (
                      <details key={i} className="rounded-xl bg-mist p-4">
                        <summary className="cursor-pointer font-semibold text-ink">{f.q}</summary>
                        <p className="mt-2 text-sm text-ink/90">{f.a}</p>
                      </details>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HTML mode */}
        {format === "html" ? (
          <div className="rounded-2xl bg-paper p-5">
            <label className="text-xs font-semibold text-stone">
              เนื้อหา HTML — ใช้ &lt;h2&gt;/&lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;/&lt;ol&gt;, &lt;table&gt;
              (ไม่ต้องใส่ &lt;h1&gt; ระบบใช้หัวข้อด้านบน · ระบบใส่ id ให้ heading เพื่อทำสารบัญอัตโนมัติ)
            </label>
            <textarea
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              rows={20}
              placeholder={"<h2>หัวข้อ</h2>\n<p>ย่อหน้า…</p>\n<ul><li>ข้อ 1</li></ul>"}
              className={`${input} mt-2 font-mono text-xs leading-relaxed`}
            />
            <button
              onClick={() => setRawHtml(HTML_TEMPLATE)}
              className="mt-2 rounded-full bg-mist px-3 py-1.5 text-xs text-ink hover:bg-linen"
            >
              แทรกโครงบทความตัวอย่าง (ผ่าน validator)
            </button>
          </div>
        ) : (
          /* Block mode */
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <BlockCard
                key={b.id}
                block={b}
                first={i === 0}
                last={i === blocks.length - 1}
                onChange={(nb) => updateBlock(i, nb)}
                onRemove={() => removeBlock(i)}
                onMove={(d) => moveBlock(i, d)}
                onUpload={uploadCover}
              />
            ))}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-ash bg-paper p-3">
              {(Object.keys(BLOCK_LABELS) as Block["type"][]).map((t) => (
                <button
                  key={t}
                  onClick={() => addBlock(t)}
                  className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink hover:bg-linen"
                >
                  + {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="rounded-2xl bg-paper p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink">คำถามที่พบบ่อย (FAQ)</h2>
            <button
              onClick={() => setFaqs((f) => [...f, { q: "", a: "" }])}
              className="rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-ink hover:bg-linen"
            >
              + เพิ่มคำถาม
            </button>
          </div>
          <p className="mt-1 text-xs text-stone">
            แนะนำ ≥ 5 ข้อ — ระบบสร้าง FAQPage schema ให้อัตโนมัติ
          </p>
          <div className="mt-3 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-mist p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={f.q}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)),
                      )
                    }
                    placeholder="คำถาม"
                    className={`${input} font-medium`}
                  />
                  <button
                    onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded-lg px-2 py-1 text-stone hover:bg-mist"
                    aria-label="ลบ"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={f.a}
                  onChange={(e) =>
                    setFaqs((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)),
                    )
                  }
                  placeholder="คำตอบ"
                  rows={2}
                  className={`${input} mt-2`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5">
        {msg && (
          <div
            className={`rounded-xl p-4 text-sm ${
              msg.kind === "ok"
                ? "bg-lime-canopy text-ink"
                : "border border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {msg.text.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="rounded-2xl bg-paper p-5">
          <div className="flex gap-2">
            <button
              onClick={() => save(false)}
              disabled={pending}
              className="flex-1 rounded-full border border-ink px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-50"
            >
              บันทึกร่าง
            </button>
            <button
              onClick={() => save(true)}
              disabled={pending}
              className="flex-1 rounded-full bg-lime-canopy px-4 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep disabled:opacity-50"
            >
              {pending ? "…" : "เผยแพร่"}
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm("ลบบทความนี้?")) startTransition(() => deletePostAction(id));
            }}
            className="mt-3 w-full rounded-full px-4 py-2 text-xs text-red-600 hover:bg-red-50"
          >
            ลบบทความ
          </button>
        </div>

        {/* SEO score */}
        <div className="rounded-2xl bg-paper p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink">คะแนน SEO</h2>
            <span
              className={`font-display text-2xl font-bold ${
                seo.score >= 80 ? "text-lime-deep" : seo.score >= 50 ? "text-ink" : "text-red-500"
              }`}
            >
              {seo.score}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {seo.checks.map((c: SeoCheck) => (
              <li key={c.label} className="flex items-start gap-2">
                <span aria-hidden>
                  {c.level === "pass" ? "✅" : c.level === "warn" ? "🟡" : "🔴"}
                </span>
                <span className="text-stone">
                  {c.label}
                  {c.hint && <span className="block text-[11px] text-ash">{c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Meta fields */}
        <div className="space-y-3 rounded-2xl bg-paper p-5">
          <h2 className="font-display font-bold text-ink">ตั้งค่า SEO</h2>
          <Field label={`Slug (/articles/${slug || "…"})`}>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={input} />
          </Field>
          <Field label={`Meta title (${(seoTitle || title).length}/60)`}>
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="ว่างได้ = ใช้หัวข้อ" className={input} />
          </Field>
          <Field label={`Meta description (${metaDescription.length}/160)`}>
            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} className={input} />
          </Field>
          <Field label="คีย์เวิร์ดหลัก">
            <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className={input} />
          </Field>
          <Field label="ประเภทบทความ (กำหนดช่วงความยาว)">
            <select value={articleType} onChange={(e) => setArticleType(e.target.value)} className={input}>
              {ARTICLE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.min}–{t.max} คำ)
                </option>
              ))}
            </select>
          </Field>
          <Field label="หมวดหมู่">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="รูปปก (URL หรืออัปโหลด)">
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/uploads/... หรือ https://…" className={input} />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ash px-3 py-1.5 text-xs text-stone hover:bg-mist">
              📤 อัปโหลดรูป
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                  e.target.value = "";
                }}
              />
            </label>
          </Field>
          <Field label="สรุปย่อ (excerpt)">
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="ว่างได้ = ตัดจากเนื้อหา" className={input} />
          </Field>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ── Per-block editor ─────────────────────────────────────────────
function BlockCard({
  block,
  first,
  last,
  onChange,
  onRemove,
  onMove,
  onUpload,
}: {
  block: Block;
  first: boolean;
  last: boolean;
  onChange: (b: Block) => void;
  onRemove: () => void;
  onMove: (d: -1 | 1) => void;
  onUpload: (f: File) => void;
}) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-stone">◫ {BLOCK_LABELS[block.type]}</span>
        <div className="flex items-center gap-1 text-stone">
          <button onClick={() => onMove(-1)} disabled={first} className="rounded px-1.5 hover:bg-mist disabled:opacity-30">↑</button>
          <button onClick={() => onMove(1)} disabled={last} className="rounded px-1.5 hover:bg-mist disabled:opacity-30">↓</button>
          <button onClick={onRemove} className="rounded px-1.5 text-red-500 hover:bg-red-50">✕</button>
        </div>
      </div>
      <BlockBody block={block} onChange={onChange} onUpload={onUpload} />
    </div>
  );
}

function BlockBody({
  block,
  onChange,
  onUpload,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onUpload: (f: File) => void;
}) {
  const ta = "w-full rounded-lg border border-ash bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink";

  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <select
            value={block.level}
            onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
            className="rounded-lg border border-ash bg-paper px-2 text-sm"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="ข้อความหัวข้อ" className={ta} />
        </div>
      );
    case "paragraph":
      return <textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} rows={3} placeholder="ย่อหน้า…" className={ta} />;
    case "quote":
      return <textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} rows={2} placeholder="ข้อความอ้างอิง…" className={ta} />;
    case "list":
      return (
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs text-stone">
            <input type="checkbox" checked={block.ordered} onChange={(e) => onChange({ ...block, ordered: e.target.checked })} />
            รายการมีลำดับเลข
          </label>
          {block.items.map((it, i) => (
            <div key={i} className="mb-1 flex gap-2">
              <input
                value={it}
                onChange={(e) =>
                  onChange({ ...block, items: block.items.map((x, idx) => (idx === i ? e.target.value : x)) })
                }
                placeholder={`ข้อ ${i + 1}`}
                className={ta}
              />
              <button
                onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
                className="shrink-0 rounded px-2 text-stone hover:bg-mist"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, ""] })} className="mt-1 rounded-full bg-mist px-3 py-1 text-xs text-ink hover:bg-linen">
            + เพิ่มข้อ
          </button>
        </div>
      );
    case "tip":
      return (
        <div className="space-y-2">
          <input value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="หัวข้อคำแนะนำ" className={ta} />
          <textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} rows={2} placeholder="รายละเอียด" className={ta} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <input value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="URL รูป หรืออัปโหลด" className={ta} />
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ash px-3 py-1.5 text-xs text-stone hover:bg-mist">
              📤 อัปโหลด
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append("file", f);
                  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.url) onChange({ ...block, url: data.url });
                  e.target.value = "";
                }}
              />
            </label>
            <input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} placeholder="คำบรรยาย (alt)" className={ta} />
          </div>
        </div>
      );
    case "table":
      return <TableEditor block={block} onChange={onChange} />;
    case "divider":
      return <div className="text-center text-xs text-stone">— เส้นคั่น —</div>;
  }
}

function TableEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "table" }>;
  onChange: (b: Block) => void;
}) {
  const cell = "rounded border border-ash bg-paper px-2 py-1 text-sm";
  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex gap-1">
        {block.headers.map((h, ci) => (
          <input
            key={ci}
            value={h}
            onChange={(e) => onChange({ ...block, headers: block.headers.map((x, i) => (i === ci ? e.target.value : x)) })}
            placeholder={`หัว ${ci + 1}`}
            className={`${cell} font-semibold`}
          />
        ))}
        <button
          onClick={() =>
            onChange({
              ...block,
              headers: [...block.headers, ""],
              rows: block.rows.map((r) => [...r, ""]),
            })
          }
          className="rounded bg-mist px-2 text-xs"
        >
          +คอลัมน์
        </button>
      </div>
      {block.rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((c, ci) => (
            <input
              key={ci}
              value={c}
              onChange={(e) =>
                onChange({
                  ...block,
                  rows: block.rows.map((r, i) =>
                    i === ri ? r.map((x, j) => (j === ci ? e.target.value : x)) : r,
                  ),
                })
              }
              className={cell}
            />
          ))}
          <button
            onClick={() => onChange({ ...block, rows: block.rows.filter((_, i) => i !== ri) })}
            className="rounded px-2 text-stone hover:bg-mist"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...block, rows: [...block.rows, block.headers.map(() => "")] })}
        className="rounded-full bg-mist px-3 py-1 text-xs text-ink hover:bg-linen"
      >
        + เพิ่มแถว
      </button>
    </div>
  );
}
