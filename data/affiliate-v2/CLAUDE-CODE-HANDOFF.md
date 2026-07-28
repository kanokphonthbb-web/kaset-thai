# Kasettakonthai Shopee Affiliate v2 — Implementation Handoff

## Objective

Integrate the prepared Shopee Affiliate catalog into the existing `kasettakonthai.com` product and article system. Every eligible product must have a useful, indexable Product SEO page. Every one of the 10,000 planned articles must show exactly four relevant products without exposing internal matching terminology to readers.

This handoff describes prepared inputs. It does not authorize deployment. Inspect the current database and implementation, make reversible code/data changes, validate locally, and report before production deployment.

## Non-negotiable affiliate-only rule

Every outbound link that sends a user to a Shopee product must use the product's exact prepared `affiliate_url` and nothing else.

- Allowed outbound product destination: an exact catalog URL beginning with `https://s.shopee.co.th/`.
- Forbidden: ordinary Shopee product URLs, storefront/shop URLs, search URLs, seller URLs, self-created redirects, regenerated short links, guessed links, or any Shopee URL not present in the prepared catalog allowlist.
- Never rewrite, shorten, construct, replace, or silently fall back from a prepared Affiliate URL.
- If a product lacks a valid prepared Affiliate URL, skip it and report an error; do not publish it.
- `image_url` is an image source only and must never become the product destination link.
- Internal links such as `/products/[slug]` remain valid. The rule applies whenever a link exits the website toward Shopee.
- Enforce this across Product pages, article modules, contextual CTAs, related-product UI, API output, and any structured-data offer URL.
- Add an allowlist test that makes validation/build fail if any outbound product URL is not an exact catalog `affiliate_url` or does not start with `https://s.shopee.co.th/`.

## Prepared result

- Source articles: **10,000**
- Source content clusters: **198**
- Content clusters with product coverage: **198 / 198**
- Unique merged Shopee Affiliate products: **1,074**
- Eligible for automatic import and article placement: **1,037**
- Held for manual safety/compliance review: **37**
- Article-product assignments: **40,000**
- Products per article: **4**
- Downloaded product images: **1,074 / 1,074**
- Affiliate URL policy: only `https://s.shopee.co.th/...`
- Unique slugs in the source workbook: **8,590**; **1,410** repeated source-slug rows were deterministically disambiguated in the prepared map

## Source files

All paths are absolute to avoid ambiguity.

- Product catalog JSON: `/Users/bob/kaset-thai/data/affiliate-v2/products-affiliate-only-v2.json`
- Product catalog CSV: `/Users/bob/kaset-thai/data/affiliate-v2/products-affiliate-only-v2.csv`
- Article mapping JSON: `/Users/bob/kaset-thai/data/affiliate-v2/article-product-map.json`
- Flat assignment CSV: `/Users/bob/kaset-thai/data/affiliate-v2/article-product-assignments.csv`
- Coverage report: `/Users/bob/kaset-thai/data/affiliate-v2/coverage-summary.json`
- Products requiring manual review: `/Users/bob/kaset-thai/data/affiliate-v2/manual-review-products.json`
- Validation report: `/Users/bob/kaset-thai/data/affiliate-v2/validation-report.json`
- Master image directory: `/Users/bob/Documents/Codex/2026-07-28/kasettakonthai-affiliate/images`

The large JSON files are build/import inputs. Do not send the 45 MB article map to a client component or browser hydration payload.

## Existing website architecture to preserve

- Next.js 14 App Router with Prisma and Turso/libSQL.
- `Product` model already exists in `prisma/schema.prisma`.
- Product access and contextual linking exist in `lib/products.ts`.
- Product cards are internal links in `components/ProductCard.tsx`.
- Product list and detail routes exist at `/products` and `/products/[slug]`.
- Product metadata is generated through `pageMeta` in `app/products/[slug]/page.tsx`.
- Article rendering already uses `findMatchingProducts` and `injectProductLinks`.
- `app/sitemap.ts` currently includes articles but not database product routes; add them.

Prefer extending this system over creating a second product stack.

## Import contract

1. Inspect the live/current Product table read-only before changing it. Do not assume that its row count equals this prepared catalog.
2. Never delete existing products merely because they are absent from this export.
3. Import only products with `needs_manual_review: false` automatically: expected **1,037**.
4. Keep all 37 manual-review products out of public pages and article assignments until explicitly approved.
5. Upsert idempotently using this priority:
   - prepared Shopee product `id` stored in a dedicated stable source field;
   - exact canonical `affiliate_url`;
   - a carefully reviewed existing record match.
6. Preserve an existing public slug when an import matches an existing product. For a new product, use a stable unique slug based on the Shopee product ID rather than an index that can shift.
7. Do not create duplicate Product rows, affiliate URLs, slugs, or images.
8. Copy the prepared image for each imported product to the repository's stable public product-image convention, for example `public/images/products/<shopee-id>.webp`. Do not re-download the images.
9. If the database schema needs more Product SEO fields, add a reviewed migration and a resumable, dry-run-capable import script. Do not patch production rows ad hoc.

## Product SEO content contract

Create a real product page for every eligible product, not a thin redirect page and not just a raw affiliate link. Use the existing visible examples as the design and content baseline.

Each product page should have:

- One unique H1 based on the factual product title.
- A concise, unique introduction aligned with relevant `core_topics`, `primary_keywords`, and `keywords`.
- Sections equivalent to: why it may be useful, key benefits/features, suitable use cases, how to choose/check before ordering, usage guidance, and safety/limitations when relevant.
- A clear affiliate disclosure close to the Shopee CTA.
- Related products and relevant article links using internal URLs.
- A canonical URL, unique SEO title, unique meta description, Open Graph, and Twitter metadata.
- Valid `Product` JSON-LD and `BreadcrumbList` JSON-LD using only facts actually present.
- Inclusion in the XML sitemap with the real Product `updatedAt`.

Never fabricate brand, model, certification, stock status, delivery promise, rating, review count, medical/veterinary effect, yield, profit, or performance. Price is volatile: show it only when a reliable numeric value is present, label it as last checked, and direct users to Shopee for the current price. Do not emit `AggregateRating`, reviews, or availability schema without verified data.

## Link behavior

- Product name, image, and editorial product mentions should link internally to `/products/[slug]` so the product page can rank.
- The explicit buy/check-price CTA links externally to the prepared `affiliate_url` only.
- Use the catalog value exactly. There is no fallback to an ordinary Shopee URL.
- External CTA must open safely and use `rel="sponsored nofollow noopener noreferrer"`.
- Do not serialize affiliate URLs into broad client-side product listing payloads when the current server-side pattern can avoid it.
- Keep article product placement editorial and contextual. Do not replace unrelated words or inject links into headings, anchors, scripts, styles, or attributes.

## Article mapping contract

- The current Article schema has no source article number even though the workbook's source slugs are not all unique. Add a stable, unique source article number field (or an equivalently safe relation key) and use it as the canonical import/join key. Do not use the repeated source slug as identity.
- Join the 10,000 source articles by normalized `article_no` first. Use the prepared unique `article_slug` as the intended public slug and `source_article_slug` only for traceability/cross-checking.
- The first occurrence of a source slug keeps its original value; later collisions have the source article number appended. Treat the leading slash consistently with the current Article route/storage convention.
- Render exactly four distinct eligible products from each article's prepared `products` array.
- All 10,000 articles have mappings. A missing match after normalization is an implementation error; report it instead of substituting an arbitrary product.
- Use the prepared rank order.
- Do not expose assignment metadata or matching mechanics in public HTML, metadata, JSON-LD, visible labels, API responses, or alt text.
- Preserve the site's current internal product-link safety rules. The prepared map should determine the four product cards; contextual links can point to those same four product pages.

## Public-language rule

Readers should see normal agricultural and shopping language only. Never expose backstage vocabulary such as matching type, fallback, taxonomy, validator, manual-review flag, source query, source row, relevance score, queue, or browser run.

## Required validation before handoff/deploy

- Run the prepared validator: `node scripts/validate-affiliate-v2.mjs`.
- Run project tests, lint/type checks available in the repository, and `npm run build`.
- Verify idempotency by running the import in dry-run mode and then re-running without generating new duplicate rows.
- Verify sample Product pages from every main category on mobile and desktop.
- Verify canonical, title, description, OG/Twitter, Product JSON-LD, Breadcrumb JSON-LD, affiliate disclosure, related articles, internal links, and CTA rel attributes.
- Verify that 100% of outbound Shopee product destinations are exact catalog Affiliate URLs and that the ordinary Shopee product/storefront URL count is zero.
- Verify the sitemap includes all public eligible Product routes and excludes the 37 held products.
- Verify article mapping totals: 10,000 articles, 40,000 assignments, four distinct products per article, zero held products.
- Verify 10,000 unique resolved public article slugs. Report the known 8,590 unique source slugs and 1,410 resolved collision rows rather than silently overwriting an Article record.
- Do not deploy until the final report shows the exact created/updated/skipped/error counts and the owner approves production execution.
