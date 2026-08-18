# Fact Quality Audit — Published Article Corpus

**Scan date:** 2026-08-18
**Scope:** all 2,078 articles with `status = 'published'` in the `Article` table (Turso production DB, read via `@libsql/client`).
**Mode:** read-only. No article was edited, and no row was written to the database as part of this audit.

## How to re-run

```bash
cd /Users/bob/kaset-thai
npx tsx scripts/audit/fact-quality-scan.mts
```

The script reads `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `.env.vercel` (same `loadEnv()` pattern used by `scratchpad-briefs/phase2/select-and-insert-batch.mts`), runs a single read-only `SELECT slug, title, content, rawHtml, format FROM Article WHERE status = 'published'`, and prints a JSON summary plus up to 10 example hits per check to stdout. It performs no writes.

Each article is scanned as `title + strip_html(content || rawHtml)` — `content` is the compiled HTML that `DbArticleView` actually renders on the live site (`rawHtml` is only used as a fallback when `content` is empty).

## Methodology

Six deterministic checks, each a regex/keyword scan over the stripped article text:

1. **Land-unit conversion errors** — looks for a standalone `1 ไร่` / `1 งาน` / `1 ตารางวา` followed within ~30 characters by a `ตารางเมตร` (or `ตร.ม.`) figure, and flags it when that figure is not the correct conversion (1,600 / 400 / 4 sqm respectively). A negative lookbehind excludes decimal values such as `0.1 ไร่` from being misread as a literal `1 ไร่`.
2. **Guarantee/forbidden phrases** — exact substring match for the same phrase list the CMS publish gate blocks (`lib/seoAnalysis.ts` `FORBIDDEN_WORDS`): การันตีผล, รับประกันผล, ได้แน่นอน, ได้ชัวร์, รวยแน่นอน, เห็นผลแน่นอน, 100%.
3. **Chemical/medicine dosage exposure** — flags articles that mention สารเคมี / ยาฆ่าแมลง / ยาฆ่าหญ้า / วัคซีน / ยาปฏิชีวนะ with a number + อัตรา/ซีซี/มล./กรัม within an ~80-character window of the same mention.
4. **Price claims** — counts articles where a บาท figure appears near ราคา/ขายได้/ต้นทุน. Not a defect by itself; carries staleness risk since prices are not versioned/dated in the CMS. Cross-referenced against whether the article has a references section.
5. **Missing references section** — articles whose content lacks both the literal heading text `แหล่งข้อมูลอ้างอิง` and any `cc-references` marker.
6. **Fake first-person experience claims** — exact match on จากประสบการณ์ของผม / ผมทำฟาร์ม / ฟาร์มของเรา.

This is a proximity/keyword heuristic, not a semantic parser — every hit needs a human look before any edit. Two of the checks in particular (#1 and #6) produced hits that on manual review turned out to be table/rhetorical false positives; that triage is documented below rather than hidden.

## Results summary

| Check | Count |
|---|---|
| Total published articles scanned | 2,078 |
| Land-unit conversion errors (regex hits) | 4 (2 unique articles; **1 confirmed real defect**, see below) |
| Guarantee/forbidden phrases | 0 |
| Chemical/medicine dosage exposure | 0 |
| Articles with a price claim | 492 |
| ...of which have no references section | 18 |
| Missing references section (all articles) | 31 |
| Fake first-person experience-claim phrases | 1 |

## Findings and examples

### 1. Land-unit conversion errors — 1 confirmed real defect

The regex flagged 4 occurrences across 2 articles. Manual review of each:

- **`mixed-farming-integrated-farm-1-problems` — REAL ERROR.** States `พื้นที่ 1 งาน (100 ตารางเมตร)` — 1 งาน is actually 400 ตารางเมตร, not 100. This is a factual land-area error in a beginner-facing planning article; farmers reading it would under-scope by 4x.
  > "...หลายคนที่อยากเริ่มเกษตรผสมผสานในพื้นที่ 1 งาน (100 ตารางเมตร) มักคิดภาพว่าปลูกผัก เลี้ยงไก่ เลี้ยงปลา..."

- **`mixed-farming-integrated-farm-compare-4915` — false positive (2 hits).** The regex's proximity window picked up `800 ตารางเมตร` (which belongs to ครึ่งไร่ in the same sentence) as if it were describing `1 งาน`. The article separately and correctly states `พื้นที่ 1 งาน (400 ตารางเมตร)` later in the same piece — the underlying content is correct, the regex match was just ambiguous sentence structure.

- **`fishery-pond-silver-barb-answer-4140` — false positive.** `บ่อดิน 1 ไร่ บ่อซีเมนต์ 30 ตร.ม.` is a comparison table row across two different pond types/sizes, not a claim that 1 ไร่ = 30 ตร.ม.

### 2. Guarantee/forbidden phrases — 0 hits

None of the tracked phrases appear in any published article. Consistent with the publish-gate check in `lib/articleValidator.ts` blocking these at write time.

### 3. Chemical/medicine dosage exposure — 0 hits

No published article combines a chemical/medicine keyword with an explicit dosage number within the scan window. (This does not guarantee dosage-free content generally — only that this specific numeric-dosage pattern doesn't appear; articles that discuss chemicals qualitatively, or use different unit words, are not covered by this check.)

### 4. Price claims — 492 articles (18 without references)

Price mentions are common and expected in a cost/market-focused corpus (492 of 2,078 articles, ~24%). Not itself a defect, but prices are not dated/versioned in the CMS schema, so they will drift out of accuracy over time. The 18 articles below carry price claims with no references section at all — highest-priority subset for a staleness/sourcing pass:

```
plants-how-to-grow-rice-jasmine, plants-how-to-grow-sticky-rice, plants-how-to-grow-riceberry,
fishery-how-to-raise-giant-river-prawn, fishery-cost-giant-river-prawn,
fishery-how-to-raise-white-shrimp, fishery-cost-white-shrimp,
soil-water-fertilizer-soil-test-ph-580, soil-water-fertilizer-clay-soil-581,
soil-water-fertilizer-sandy-soil-582, soil-water-fertilizer-problem-soil-583,
soil-water-fertilizer-mulching-592, soil-water-fertilizer-soil-test-ph-595,
soil-water-fertilizer-clay-soil-596, soil-water-fertilizer-sandy-soil-597,
soil-water-fertilizer-problem-soil-598, soil-water-fertilizer-mulching-607
```
(full list of 18 is emitted by the script's raw JSON output)

### 5. Missing references section — 31 articles

31 published articles have no `แหล่งข้อมูลอ้างอิง` heading and no `cc-references` marker — a gap in the E-E-A-T sourcing the publish-gate validator normally requires (`lib/articleValidator.ts` blocks new drafts without one, so these likely predate that gate or slipped through an older pipeline). First 10 of 31:

```
plants-how-to-grow-rice-jasmine
plants-how-to-grow-sticky-rice
plants-how-to-grow-riceberry
fishery-how-to-raise-giant-river-prawn
fishery-cost-giant-river-prawn
fishery-how-to-raise-white-shrimp
fishery-cost-white-shrimp
soil-water-fertilizer-soil-test-ph-580
soil-water-fertilizer-clay-soil-581
soil-water-fertilizer-sandy-soil-582
```

Notable pattern: a `cost-profit-checklist*` series (checklist, checklist-788, -792, -796, -800, -804, -808, -812, -816, -820, -824, -828, -832, checklist-1 — 13 of the 31) is entirely missing references, suggesting this was a templated series produced without a references block rather than 13 independent gaps.

### 6. Fake first-person experience claims — 1 hit

- **`diseases-care-asf-pig-752`**: contains ฟาร์มของเรา, but in context it's a rhetorical reader-address question, not a fabricated first-person farm claim:
  > "...เกษตรกรผู้เลี้ยงหมูจำนวนมากเริ่มถามคำถามเดียวกันว่า "ฟาร์มของเราต้องทำอะไรเพิ่มบ้าง" ความจริงคือมาตรการป้องกัน..."

  Borderline — flagged for a human editorial call rather than treated as a confirmed defect.

## Recommended actions

1. **Fix the 1 confirmed land-unit error** in `mixed-farming-integrated-farm-1-problems` (100 ตารางเมตร → 400 ตารางเมตร for "1 งาน"). Not auto-editable by this audit (read-only); needs a manual content edit + republish.
2. **No action needed** on guarantee phrases or dosage-exposure checks — 0 hits, gate is holding.
3. **18 price-claim articles with no references** — prioritize for a source-verification/refresh pass; prices go stale fastest and these have zero backing citation.
4. **31 articles missing a references section**, with the `cost-profit-checklist*` series (13 articles) as a single batched fix rather than 13 separate reviews — likely one templating gap to patch once.
5. **1 borderline experience-claim hit** — editorial judgment call, not clearly a violation; leave as-is unless editorial review disagrees.
6. **Re-run this script periodically** (e.g. before/after each new batch of published articles) since it is fully deterministic and non-destructive — `npx tsx scripts/audit/fact-quality-scan.mts`.
7. Treat check #1 and #6 hit-counts as upper bounds requiring manual triage, not automatic defect counts — the proximity/keyword heuristics can and did produce false positives on table rows and rhetorical phrasing, documented above.

## Full raw output

The script also prints a `RAW_JSON_START` / `RAW_JSON_END` bounded JSON blob to stdout containing every hit (not just the top 10 shown here) for programmatic re-processing if a fuller audit trail is needed later.
