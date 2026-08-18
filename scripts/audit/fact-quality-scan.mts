// ─────────────────────────────────────────────────────────────
// FACT QUALITY AUDIT — read-only scan of published Article corpus (Turso)
// Does NOT write to the DB and does NOT edit any article.
//
// Run: npx tsx scripts/audit/fact-quality-scan.mts
// Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from .env.vercel (same loadEnv
// pattern as scratchpad-briefs/phase2/select-and-insert-batch.mts).
//
// Checks (see docs/audit/FACT_QUALITY_AUDIT.md for the write-up):
//   1. Land-unit conversion errors (ไร่ / งาน / ตารางวา near ตารางเมตร)
//   2. Guarantee/forbidden phrases (should be zero — publish gate blocks them)
//   3. Chemical/medicine dosage exposure (needs source spot-check)
//   4. Price claims (count only — staleness risk, not a defect per se)
//   5. Missing "แหล่งข้อมูลอ้างอิง" (references) section
//   6. Fake first-person experience-claim phrases
// ─────────────────────────────────────────────────────────────

import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

function loadEnv(): Record<string, string> {
  const t = readFileSync(new URL("../../.env.vercel", import.meta.url), "utf8");
  const e: Record<string, string> = {};
  for (const l of t.split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) e[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return e;
}

type ArticleRow = {
  slug: string;
  title: string;
  content: string;
  rawHtml: string;
  format: string;
};

type Hit = { slug: string; snippet: string };

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetAround(text: string, index: number, radius = 60): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return `…${text.slice(start, end).replace(/\s+/g, " ").trim()}…`;
}

// ── Check 1: land-unit conversion errors ──────────────────────
// 1 ไร่ = 1,600 ตร.ม. / 1 งาน = 400 ตร.ม. / 1 ตารางวา = 4 ตร.ม.
// (?<![\d.]) guards against matching the "1" inside "0.1 ไร่" (a *correct* 160 sqm value) —
// only a standalone literal "1 <unit>" should be treated as an explicit conversion claim.
const LAND_UNIT_RULES: { unit: string; correctSqm: number; regex: RegExp }[] = [
  {
    unit: "ไร่",
    correctSqm: 1600,
    regex: /(?<![\d.])1\s*ไร่[^0-9]{0,30}?([\d,]+(?:\.\d+)?)\s*(?:ตร\.?\s*ม\.?|ตารางเมตร)/g,
  },
  {
    unit: "งาน",
    correctSqm: 400,
    regex: /(?<![\d.])1\s*งาน[^0-9]{0,30}?([\d,]+(?:\.\d+)?)\s*(?:ตร\.?\s*ม\.?|ตารางเมตร)/g,
  },
  {
    unit: "ตารางวา",
    correctSqm: 4,
    regex: /(?<![\d.])1\s*ตารางวา[^0-9]{0,30}?([\d,]+(?:\.\d+)?)\s*(?:ตร\.?\s*ม\.?|ตารางเมตร)/g,
  },
];

function checkLandUnitErrors(text: string): { snippet: string }[] {
  const hits: { snippet: string }[] = [];
  for (const rule of LAND_UNIT_RULES) {
    rule.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.regex.exec(text)) !== null) {
      const value = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value !== rule.correctSqm) {
        hits.push({ snippet: snippetAround(text, m.index) });
      }
    }
  }
  return hits;
}

// ── Check 2: guarantee / forbidden phrases ────────────────────
const GUARANTEE_PHRASES = [
  "การันตีผล",
  "รับประกันผล",
  "ได้แน่นอน",
  "ได้ชัวร์",
  "รวยแน่นอน",
  "เห็นผลแน่นอน",
  "100%",
];

function checkGuaranteePhrases(text: string): { phrase: string; snippet: string }[] {
  const hits: { phrase: string; snippet: string }[] = [];
  for (const phrase of GUARANTEE_PHRASES) {
    let idx = text.indexOf(phrase);
    while (idx !== -1) {
      hits.push({ phrase, snippet: snippetAround(text, idx) });
      idx = text.indexOf(phrase, idx + phrase.length);
    }
  }
  return hits;
}

// ── Check 3: chemical/medicine dosage exposure ────────────────
const CHEMICAL_TERMS = ["สารเคมี", "ยาฆ่าแมลง", "ยาฆ่าหญ้า", "วัคซีน", "ยาปฏิชีวนะ"];
const DOSAGE_UNIT_REGEX = /\d+(?:\.\d+)?\s*(?:อัตรา|ซีซี|มล\.?|กรัม)/;

function checkDosageExposure(text: string): { term: string; snippet: string }[] {
  const hits: { term: string; snippet: string }[] = [];
  for (const term of CHEMICAL_TERMS) {
    let idx = text.indexOf(term);
    while (idx !== -1) {
      const windowStart = Math.max(0, idx - 80);
      const windowEnd = Math.min(text.length, idx + term.length + 80);
      const window = text.slice(windowStart, windowEnd);
      const dosageMatch = window.match(DOSAGE_UNIT_REGEX);
      if (dosageMatch) {
        hits.push({ term, snippet: snippetAround(text, idx) });
      }
      idx = text.indexOf(term, idx + term.length);
    }
  }
  return hits;
}

// ── Check 4: price claims (count only) ────────────────────────
const PRICE_REGEX = /\d+(?:,\d{3})*(?:\.\d+)?\s*บาท[^฿]{0,40}?(?:ราคา|ขายได้|ต้นทุน)|(?:ราคา|ขายได้|ต้นทุน)[^฿]{0,40}?\d+(?:,\d{3})*(?:\.\d+)?\s*บาท/g;

function hasPriceClaim(text: string): boolean {
  PRICE_REGEX.lastIndex = 0;
  return PRICE_REGEX.test(text);
}

// ── Check 5: missing references section ───────────────────────
function hasReferencesSection(text: string): boolean {
  return text.includes("แหล่งข้อมูลอ้างอิง") || text.includes("cc-references");
}

// ── Check 6: fake first-person experience-claim phrases ───────
const EXPERIENCE_PHRASES = ["จากประสบการณ์ของผม", "ผมทำฟาร์ม", "ฟาร์มของเรา"];

function checkExperienceClaims(text: string): { phrase: string; snippet: string }[] {
  const hits: { phrase: string; snippet: string }[] = [];
  for (const phrase of EXPERIENCE_PHRASES) {
    const idx = text.indexOf(phrase);
    if (idx !== -1) hits.push({ phrase, snippet: snippetAround(text, idx) });
  }
  return hits;
}

async function main() {
  const env = loadEnv();
  if (!env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL missing from .env.vercel");
  }
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const result = await client.execute(
    "SELECT slug, title, content, rawHtml, format FROM Article WHERE status = 'published'",
  );
  const rows = result.rows as unknown as ArticleRow[];

  console.log(`Scanning ${rows.length} published articles (read-only)…`);

  const landUnitHits: Hit[] = [];
  const guaranteeHits: Hit[] = [];
  const dosageHits: Hit[] = [];
  let priceClaimCount = 0;
  let priceClaimWithoutRefs = 0;
  const missingReferences: string[] = [];
  const experienceHits: Hit[] = [];

  for (const row of rows) {
    const rawSource = (row.content && row.content.trim().length > 0 ? row.content : row.rawHtml) || "";
    const plainBody = stripHtml(rawSource);
    const text = `${row.title} ${plainBody}`;

    for (const hit of checkLandUnitErrors(text)) {
      landUnitHits.push({ slug: row.slug, snippet: hit.snippet });
    }

    for (const hit of checkGuaranteePhrases(text)) {
      guaranteeHits.push({ slug: row.slug, snippet: `[${hit.phrase}] ${hit.snippet}` });
    }

    for (const hit of checkDosageExposure(text)) {
      dosageHits.push({ slug: row.slug, snippet: `[${hit.term}] ${hit.snippet}` });
    }

    const priced = hasPriceClaim(text);
    const hasRefs = hasReferencesSection(rawSource) || hasReferencesSection(plainBody);
    if (priced) {
      priceClaimCount += 1;
      if (!hasRefs) priceClaimWithoutRefs += 1;
    }

    if (!hasRefs) missingReferences.push(row.slug);

    for (const hit of checkExperienceClaims(text)) {
      experienceHits.push({ slug: row.slug, snippet: `[${hit.phrase}] ${hit.snippet}` });
    }
  }

  const summary = {
    totalScanned: rows.length,
    landUnitErrors: landUnitHits.length,
    guaranteePhrases: guaranteeHits.length,
    dosageExposure: dosageHits.length,
    priceClaimArticles: priceClaimCount,
    priceClaimArticlesWithoutReferences: priceClaimWithoutRefs,
    missingReferencesSection: missingReferences.length,
    experienceClaims: experienceHits.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  console.log("\n--- Land-unit error examples ---");
  console.log(landUnitHits.slice(0, 10).map((h) => `${h.slug}: ${h.snippet}`).join("\n"));

  console.log("\n--- Guarantee phrase examples ---");
  console.log(guaranteeHits.slice(0, 10).map((h) => `${h.slug}: ${h.snippet}`).join("\n"));

  console.log("\n--- Dosage exposure examples ---");
  console.log(dosageHits.slice(0, 10).map((h) => `${h.slug}: ${h.snippet}`).join("\n"));

  console.log("\n--- Missing references examples ---");
  console.log(missingReferences.slice(0, 10).join("\n"));

  console.log("\n--- Experience-claim examples ---");
  console.log(experienceHits.slice(0, 10).map((h) => `${h.slug}: ${h.snippet}`).join("\n"));

  // Emit machine-readable results for the report writer.
  const output = {
    scanDate: new Date().toISOString(),
    summary,
    landUnitHits,
    guaranteeHits,
    dosageHits,
    missingReferences,
    experienceHits,
  };
  console.log("\n--- RAW_JSON_START ---");
  console.log(JSON.stringify(output));
  console.log("--- RAW_JSON_END ---");
}

main().catch((err) => {
  console.error("Fact quality scan failed:", err);
  process.exitCode = 1;
});
