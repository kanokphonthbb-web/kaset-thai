// ─────────────────────────────────────────────────────────────
// Block editor model + HTML compiler
// บทความเก็บเป็น blocks (แก้ไขง่าย) แล้ว compile เป็น HTML สำหรับแสดงผล
// ─────────────────────────────────────────────────────────────

export type Block =
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "image"; url: string; caption: string }
  | { id: string; type: "table"; headers: string[]; rows: string[][] }
  | { id: string; type: "tip"; title: string; text: string }
  | { id: string; type: "divider" };

export const BLOCK_LABELS: Record<Block["type"], string> = {
  heading: "หัวข้อ (H2/H3)",
  paragraph: "ย่อหน้า",
  list: "รายการ",
  quote: "คำพูด/ยกมา",
  image: "รูปภาพ",
  table: "ตาราง",
  tip: "กล่องคำแนะนำ",
  divider: "เส้นคั่น",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugifyHeading(text: string, i: number): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-${i}` : `section-${i}`;
}

/** compile blocks -> HTML string (scoped under .cc-article by the renderer) */
export function compileBlocks(blocks: Block[]): string {
  const parts: string[] = [];
  blocks.forEach((b, i) => {
    switch (b.type) {
      case "heading": {
        const tag = b.level === 3 ? "h3" : "h2";
        parts.push(`<${tag} id="${slugifyHeading(b.text, i)}">${esc(b.text)}</${tag}>`);
        break;
      }
      case "paragraph":
        if (b.text.trim()) parts.push(`<p>${esc(b.text)}</p>`);
        break;
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        const items = b.items
          .filter((x) => x.trim())
          .map((x) => `<li>${esc(x)}</li>`)
          .join("");
        if (items) parts.push(`<${tag}>${items}</${tag}>`);
        break;
      }
      case "quote":
        if (b.text.trim()) parts.push(`<blockquote>${esc(b.text)}</blockquote>`);
        break;
      case "image":
        if (b.url.trim()) {
          const cap = b.caption.trim()
            ? `<figcaption>${esc(b.caption)}</figcaption>`
            : "";
          parts.push(
            `<figure><img src="${esc(b.url)}" alt="${esc(b.caption)}" loading="lazy" />${cap}</figure>`,
          );
        }
        break;
      case "table": {
        const head = b.headers.map((h) => `<th>${esc(h)}</th>`).join("");
        const body = b.rows
          .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
          .join("");
        parts.push(
          `<div class="cc-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
        );
        break;
      }
      case "tip":
        parts.push(
          `<aside class="cc-tip"><p class="cc-tip-title">💡 ${esc(b.title)}</p><p>${esc(b.text)}</p></aside>`,
        );
        break;
      case "divider":
        parts.push("<hr />");
        break;
    }
  });
  return parts.join("\n");
}

/** plain text (for word count / SEO analysis) */
export function blocksPlainText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.type === "heading" || b.type === "paragraph" || b.type === "quote")
      out.push(b.text);
    else if (b.type === "tip") out.push(b.title, b.text);
    else if (b.type === "list") out.push(...b.items);
    else if (b.type === "table") out.push(...b.headers, ...b.rows.flat());
  }
  return out.join(" ");
}

/** สารบัญ (จาก heading blocks) */
export function blocksToc(blocks: Block[]): { id: string; text: string; level: 2 | 3 }[] {
  return blocks
    .map((b, i) =>
      b.type === "heading"
        ? { id: slugifyHeading(b.text, i), text: b.text, level: b.level }
        : null,
    )
    .filter((x): x is { id: string; text: string; level: 2 | 3 } => x !== null);
}

// ── HTML authoring mode helpers ─────────────────────────────────
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** ใส่ id ให้ h2/h3 ที่ยังไม่มี เพื่อให้ทำสารบัญ (TOC) ได้ */
export function ensureHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gis, (m, tag, attrs, inner) => {
    i += 1;
    if (/\bid\s*=/.test(attrs)) return m;
    const slug =
      stripTags(inner)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || `section-${i}`;
    return `<${tag}${attrs} id="${slug}-${i}">${inner}</${tag}>`;
  });
}

/** สร้างสารบัญจาก HTML (อ่าน h2/h3 ที่มี id) */
export function tocFromHtml(html: string): { id: string; text: string; level: 2 | 3 }[] {
  const out: { id: string; text: string; level: 2 | 3 }[] = [];
  const re = /<(h[23])([^>]*)>(.*?)<\/\1>/gis;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const idMatch = m[2].match(/\bid\s*=\s*["']([^"']+)["']/i);
    if (!idMatch) continue;
    out.push({ id: idMatch[1], text: stripTags(m[3]), level: m[1] === "h3" ? 3 : 2 });
  }
  return out;
}

/** แปลง HTML เป็น Block[] สังเคราะห์ สำหรับป้อนเข้า analyzeSeo/validateArticle */
export function htmlToAnalysisBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  // หัวข้อ (นับ h2/h3)
  const hs = html.match(/<h[23][^>]*>.*?<\/h[23]>/gis) ?? [];
  hs.forEach((h, i) => {
    const inner = h.replace(/<[^>]*>/g, "");
    const level = /<h3/i.test(h) ? 3 : 2;
    blocks.push({ id: `h${i}`, type: "heading", level: level as 2 | 3, text: stripTags(inner) });
  });
  // ตาราง/รายการ (ให้ validator รู้ว่ามี)
  if (/<table[\s>]/i.test(html)) {
    blocks.push({ id: "t", type: "table", headers: ["-"], rows: [["-"]] });
  }
  if (/<(ul|ol)[\s>]/i.test(html)) {
    const items = (html.match(/<li[^>]*>(.*?)<\/li>/gis) ?? []).map((x) => stripTags(x));
    blocks.push({ id: "l", type: "list", ordered: false, items: items.length ? items : ["-"] });
  }
  // ย่อหน้าแรก (สำหรับเช็ก keyword ในย่อหน้าแรก)
  const firstP = html.match(/<p[^>]*>(.*?)<\/p>/is)?.[1] ?? "";
  const firstText = stripTags(firstP);
  if (firstText) blocks.unshift({ id: "p0", type: "paragraph", text: firstText });
  // เนื้อหาทั้งหมด (สำหรับนับจำนวนคำ) — ตัดย่อหน้าแรกออกกันนับซ้ำ
  const full = stripTags(html);
  const rest = firstText && full.startsWith(firstText) ? full.slice(firstText.length) : full;
  blocks.push({ id: "pall", type: "paragraph", text: rest });
  return blocks;
}

export function newBlock(type: Block["type"]): Block {
  const id = Math.random().toString(36).slice(2, 9);
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "" };
    case "paragraph":
      return { id, type, text: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, text: "" };
    case "image":
      return { id, type, url: "", caption: "" };
    case "table":
      return { id, type, headers: ["", ""], rows: [["", ""]] };
    case "tip":
      return { id, type, title: "", text: "" };
    case "divider":
      return { id, type };
  }
}
