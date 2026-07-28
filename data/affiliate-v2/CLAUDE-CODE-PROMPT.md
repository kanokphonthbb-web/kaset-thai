# Prompt สำหรับสั่ง Claude Code — kasettakonthai.com Product SEO + Shopee Affiliate

คัดลอกข้อความตั้งแต่บรรทัดถัดไปไปสั่ง Claude Code ได้ทั้งก้อน

---

ทำงานใน repository `/Users/bob/kaset-thai` และลงมือ implement ให้เสร็จจริง ไม่ใช่ตอบเป็นแผนอย่างเดียว

เป้าหมายคือเพิ่มสินค้า Shopee Affiliate ที่เตรียมไว้เข้าเว็บไซต์ `kasettakonthai.com` ให้เป็นหน้า Product SEO ที่มีคุณภาพทุกสินค้า พร้อมผูกสินค้าที่เกี่ยวข้องเข้ากับบทความตาม content map 10,000 บทความ โดยต่อยอดระบบสินค้าปัจจุบัน ไม่สร้างระบบซ้ำ

## กฎสูงสุด: ใช้ลิงก์ Affiliate เท่านั้น

กฎข้อนี้ห้ามเปลี่ยนและมีลำดับความสำคัญสูงกว่าข้ออื่นทั้งหมด:

- ลิงก์ภายนอกทุกจุดที่พาผู้ใช้ไปดูหรือซื้อสินค้า Shopee ต้องใช้ค่า `affiliate_url` จาก catalog ที่ให้มาเท่านั้น
- ค่า URL ที่อนุญาตต้องขึ้นต้นด้วย `https://s.shopee.co.th/` และต้องตรงกับ URL ของสินค้านั้นใน catalog แบบ exact match
- ห้ามใช้ลิงก์หน้าสินค้า Shopee ธรรมดา, `shopee.co.th/product/...`, ลิงก์ร้านค้า, search URL, ordinary storefront URL, redirect ที่สร้างเอง หรือลิงก์ Shopee อื่นที่ไม่ใช่ Affiliate URL ใน catalog
- ห้ามสร้างใหม่, เดา, แปลง, rewrite, shorten หรือเปลี่ยน Affiliate URL เอง
- ถ้าสินค้าไม่มี Affiliate URL ที่ผ่านเงื่อนไข ให้ข้ามสินค้าและรายงาน error ห้ามนำสินค้านั้นขึ้นเว็บ
- `image_url` ใช้เป็นแหล่งรูปภาพเท่านั้น ห้ามนำไปใช้เป็นลิงก์ปลายทางของสินค้า
- Internal link ภายในเว็บ เช่น `/products/[slug]` ยังใช้ได้ตามปกติ แต่เมื่อออกจากเว็บไป Shopee ต้องเป็น Affiliate URL เท่านั้น
- กฎนี้ต้องครอบคลุม Product page, article card, contextual CTA, related products, ปุ่มซื้อ, API response, structured data ที่มี offer URL และทุก component ที่อาจสร้าง outbound product link
- เพิ่ม automated validation ให้ test/build ล้มเหลวทันทีเมื่อพบ outbound product link ที่ไม่ได้อยู่ใน allowlist ของ `affiliate_url` หรือไม่ได้ขึ้นต้นด้วย `https://s.shopee.co.th/`

ก่อนแก้ไข ให้ทำตามลำดับนี้:

1. อ่าน `/Users/bob/kaset-thai/data/affiliate-v2/CLAUDE-CODE-HANDOFF.md` ทั้งไฟล์และถือเป็น implementation contract
2. ตรวจ `prisma/schema.prisma`, `lib/products.ts`, `components/ProductCard.tsx`, `app/products/page.tsx`, `app/products/[slug]/page.tsx`, `app/articles/[slug]/page.tsx`, `components/DbArticleView.tsx`, `lib/seo.ts`, `app/sitemap.ts` และ importer เดิม
3. เปิดดูหน้าสินค้าที่มีอยู่จริงอย่างน้อย 3 ตัวอย่างต่างหมวด เพื่อรักษารูปแบบและยกระดับเฉพาะส่วนที่จำเป็น
4. ตรวจ Product table ปัจจุบันแบบ read-only ก่อน ห้ามเดาจำนวน ห้ามลบข้อมูลเดิม และห้าม deploy ระหว่างทำงาน

ใช้ข้อมูลเหล่านี้:

- `/Users/bob/kaset-thai/data/affiliate-v2/products-affiliate-only-v2.json` — catalog 1,074 สินค้า
- `/Users/bob/kaset-thai/data/affiliate-v2/article-product-map.json` — mapping 10,000 บทความ รายการละ 4 สินค้า
- `/Users/bob/kaset-thai/data/affiliate-v2/article-product-assignments.csv` — mapping แบบ flat 40,000 แถว
- `/Users/bob/kaset-thai/data/affiliate-v2/manual-review-products.json` — 37 สินค้าที่ห้ามนำขึ้นอัตโนมัติ
- `/Users/bob/Documents/Codex/2026-07-28/kasettakonthai-affiliate/images` — รูปที่ดาวน์โหลดครบแล้ว

ข้อกำหนดการ import:

- นำเข้าอัตโนมัติเฉพาะ `needs_manual_review === false` จำนวนที่คาดไว้ 1,037 สินค้า
- กัน 37 สินค้า manual review ออกจากหน้าเว็บ, sitemap, related products และบทความทั้งหมดจนกว่าจะอนุมัติ
- ทำ importer แบบ idempotent มี `--dry-run`, batch, progress, resume และสรุป created/updated/skipped/errors
- upsert ด้วย Shopee product ID ที่เก็บใน stable source field ก่อน จากนั้น exact affiliate URL และ existing match ที่ตรวจสอบแล้ว
- ถ้าชนสินค้าที่มีอยู่ให้ update/merge และรักษา slug เดิม ห้ามสร้างหน้าซ้ำ
- สินค้าใหม่ใช้ slug ที่ stable จาก Shopee product ID ห้ามใช้ลำดับแถว
- copy รูปเดิมไป path สาธารณะที่เสถียร เช่น `public/images/products/<id>.webp`; ห้ามดาวน์โหลดรูปใหม่
- ถ้าต้องเพิ่ม field ใน Product model ให้ทำ migration ที่ปลอดภัยและ backward-compatible

ทำ Product SEO จริงทุกสินค้าที่ eligible:

- หน้า `/products/[slug]` ต้อง indexable และมี H1, บทนำเฉพาะสินค้า, เหตุผลที่น่าใช้, คุณสมบัติ/ประโยชน์, เหมาะกับใครหรือกรณีใด, วิธีเลือกและสิ่งที่ควรเช็กก่อนซื้อ, วิธีใช้, ข้อจำกัด/ความปลอดภัยที่เกี่ยวข้อง, affiliate disclosure, บทความที่เกี่ยวข้อง และสินค้าใกล้เคียง
- สร้างเนื้อหาเฉพาะสินค้าโดยอิงข้อเท็จจริงในชื่อสินค้าและ `core_topics`, `primary_keywords`, `keywords`; ห้ามเขียน boilerplate ซ้ำทุกหน้าและห้าม keyword stuffing
- มี unique SEO title, meta description, canonical, Open Graph และ Twitter metadata ตาม helper เดิม
- เพิ่ม Product JSON-LD และ BreadcrumbList JSON-LD ที่ valid
- ห้ามแต่ง brand, รุ่น, ใบรับรอง, stock, rating, review, ผลรักษา, ผลผลิต, กำไร หรือ claim ที่ไม่มีข้อมูล
- ราคาเปลี่ยนได้: ถ้ามีตัวเลขที่ parse ได้จึงค่อยแสดงพร้อมวันที่ตรวจและบอกให้เช็กราคาล่าสุดที่ Shopee; ห้ามสร้าง AggregateRating, review หรือ availability schema เอง
- เพิ่ม Product route ที่ public เข้า `app/sitemap.ts` โดยใช้ `updatedAt` จริง และไม่เอา 37 สินค้าที่ถูก hold เข้า sitemap

พฤติกรรมลิงก์:

- ชื่อสินค้า รูปสินค้า การ์ดสินค้า และคำกล่าวถึงสินค้าในบทความ ให้ลิงก์ภายในไป `/products/[slug]` เพื่อส่ง internal-link equity ให้หน้า Product SEO
- ปุ่ม “ดูสินค้าที่ Shopee/เช็กราคาล่าสุด” เท่านั้นที่ออก external ไป `affiliate_url` ซึ่งต้องเป็น `https://s.shopee.co.th/...`
- external CTA ต้องมี `target="_blank"` และ `rel="sponsored nofollow noopener noreferrer"` พร้อม disclosure ที่เห็นชัด
- ใช้ Affiliate URL จาก catalog แบบตรงตัวเท่านั้น ห้าม fallback ไป ordinary Shopee URL ไม่ว่ากรณีใด
- อย่าส่ง affiliate URL ทั้งหมดเข้า client hydration ถ้าทำ server-side ตาม pattern เดิมได้

การผูกกับบทความ:

- ไฟล์ต้นทางมี source slug ไม่ซ้ำเพียง 8,590 ค่า และมีแถว slug ชนกัน 1,410 แถว ห้ามใช้ source slug เป็น identity เพราะ importer เดิมอาจ update ทับบทความ
- เพิ่ม stable unique source article number ใน Article schema หรือ relation key ที่ปลอดภัย แล้ว join ด้วย normalized `article_no` เป็นหลัก
- ใน mapping ให้ใช้ `article_slug` เป็น public slug ที่ resolve collision แล้วและไม่ซ้ำ 10,000 ค่า; `source_article_slug` มีไว้ trace/cross-check เท่านั้น
- รักษา public slug เดิมของบทความที่เผยแพร่แล้วเมื่อ match ด้วย source article number ได้แน่นอน; ถ้ามี conflict ให้รายงาน migration plan และ redirect ที่ต้องเพิ่ม ห้ามเปลี่ยน URL แบบเงียบ ๆ
- ทุก 10,000 บทความต้องมีสินค้า 4 รายการที่ไม่ซ้ำกันตาม rank ในไฟล์ mapping รวม 40,000 assignments
- การ์ด 4 รายการและ contextual product link ใช้สินค้า 4 ตัวเดียวกัน
- ถ้าหาบทความไม่เจอหลัง normalize ให้หยุดและรายงาน ห้ามสุ่มสินค้าทดแทน
- ห้ามทำให้ JSON mapping ขนาดใหญ่ถูก bundle หรือ hydrate ไปฝั่ง client; ให้ import ลง DB/ตาราง relation หรือสร้าง artifact server-side ที่เล็กและ query ได้เหมาะสม

ห้ามแสดงศัพท์หลังบ้านต่อผู้ใช้ใน HTML, metadata, structured data, API payload สาธารณะ หรือ alt text เช่น match type, fallback, taxonomy, validator, manual review, source query, source row, relevance score, queue หรือ browser run ให้ใช้ภาษาสินค้าและภาษาเกษตรตามธรรมชาติเท่านั้น

เพิ่ม automated tests สำหรับ importer idempotency, deduplication, held-product exclusion, article join, affiliate-only outbound allowlist, link rel, metadata/JSON-LD และ sitemap จากนั้นรัน:

- `node scripts/validate-affiliate-v2.mjs`
- `npm test`
- lint/type check ที่ใช้ได้ใน repo
- `npm run build`

ตรวจตัวอย่างหน้าสินค้าทุก main category ทั้ง desktop/mobile และตรวจอย่างน้อย title, meta description, canonical, OG/Twitter, Product/Breadcrumb JSON-LD, internal links, disclosure, CTA และ sitemap

ก่อนจบให้ส่งรายงาน:

- ไฟล์ที่แก้และเหตุผล
- schema/migration ที่เพิ่ม
- จำนวน DB ก่อนทำ
- created/updated/skipped/held/errors หลัง dry-run และหลัง import
- จำนวน product pages และ article assignments ที่ตรวจพบจริง
- ผลตรวจว่า outbound product URLs ทุกจุดเป็น Affiliate URL จาก catalog 100% และ ordinary Shopee URL เท่ากับ 0
- ผลตรวจ 10,000 unique resolved article slugs พร้อมสรุป source slug collision 1,410 แถว
- ผล test/lint/typecheck/build/validator
- ตัวอย่าง URL สินค้าและบทความต่างหมวด
- ความเสี่ยงหรือรายการที่ยังต้อง manual review

หยุดก่อน deploy production และขออนุมัติจากเจ้าของเว็บหลังผลตรวจทั้งหมดผ่าน

---
