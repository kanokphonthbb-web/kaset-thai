# 🌾 เกษตรกรไทย — คลังความรู้เกษตรครบวงจร

เว็บไซต์ความรู้สำหรับเกษตรกรไทย ครอบคลุมการปลูกพืช เลี้ยงสัตว์ ประมง เกษตรผสมผสาน
โรคพืชโรคสัตว์ ต้นทุนกำไร และตลาดเกษตร — พร้อมเครื่องมือคำนวณและระบบค้นหา

> **Tagline:** ปลูกเป็น เลี้ยงเป็น ทำเกษตรให้มีรายได้

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — design system สไตล์ Ecosia (white canvas · lime accent · pills · radius 20px)
- ฟอนต์ไทย: **Prompt** (display) + **Sarabun** (body) ผ่าน `next/font`
- Static-first: ทุกหน้า prerender เป็น static/SSG โหลดเร็วและ SEO-friendly

## เริ่มใช้งาน

```bash
npm install
npm run dev      # http://localhost:3040
```

คำสั่งอื่น:

```bash
npm run build    # สร้าง production build
npm run start    # รัน production (port 3040)
npm run lint     # ตรวจ ESLint
```

## โครงสร้างโปรเจกต์

```
app/
  layout.tsx            # ฟอนต์ + SEO metadata + JSON-LD (Organization/WebSite)
  page.tsx              # หน้าแรก
  about/                # เกี่ยวกับเรา
  plants|animals|fishery|mixed-farming|diseases|cost-profit|market/   # 7 หมวดหลัก
  tools/                # ดัชนีเครื่องมือ + 4 เครื่องมือ (plant-cost, animal-cost, calendar, disease-check)
  articles/[slug]/      # หน้าบทความ (SSG) เนื้อหาเต็มจาก lib/articleContent.ts
  search/               # ค้นหา (noindex)
  sitemap.ts robots.ts not-found.tsx
components/             # Header, Hero, SearchBox, Cards, Footer, ToolShell, ฯลฯ
  tools/                # ตรรกะเครื่องมือคำนวณ (client components)
lib/
  data.ts               # หมวด/เครื่องมือ/บทความ + ฟังก์ชันค้นหา searchContent()
  articleContent.ts     # เนื้อหาบทความเต็ม (แก้/เพิ่มบทความที่นี่)
  format.ts             # ฟอร์แมตเงินบาท/ตัวเลข
  site.ts               # SITE_URL (อ่านจาก env)
```

## เพิ่มบทความใหม่

1. เพิ่มรายการใน `ARTICLES` ที่ [lib/data.ts](lib/data.ts)
2. เพิ่มเนื้อหาเต็มใน `ARTICLE_CONTENT` ที่ [lib/articleContent.ts](lib/articleContent.ts) โดยใช้ `slug` เดียวกัน

หน้าใหม่จะถูกสร้างเป็น static และเข้า sitemap อัตโนมัติ

## ระบบหลังบ้าน (CMS) — /admin

- เขียน/แก้/เผยแพร่บทความด้วย block editor + SEO score + FAQ (Prisma + SQLite)
- ป้องกันด้วยรหัสผ่าน (middleware) — ตั้งค่าใน `.env`:
  ```
  ADMIN_EMAIL=you@example.com
  ADMIN_PASSWORD=your-strong-password
  AUTH_SECRET=random-long-secret
  ```
  ถ้าไม่ตั้ง `ADMIN_PASSWORD` = auth ปิด (เข้าได้เลยตอน dev)
- เข้าที่ `/admin` → ระบบพาไป `/admin/login`

## Deploy (Vercel + Turso — แนะนำ)

SQLite ไฟล์ไม่ persist บน Vercel serverless จึงใช้ **Turso (libSQL)** สำหรับ production:

1. สร้าง DB บน [turso.tech](https://turso.tech) → ได้ `TURSO_DATABASE_URL` (libsql://…) และ `TURSO_AUTH_TOKEN`
2. push schema ขึ้น Turso ครั้งแรก (ใช้ url รูปแบบ libsql):
   ```bash
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma db push
   ```
   (โปรเจกต์ตั้งค่าให้ `lib/prisma.ts` ใช้ Turso อัตโนมัติเมื่อมี `TURSO_DATABASE_URL`)
3. สร้าง **Vercel Blob store** (Storage → Blob) เพื่อเก็บรูปที่อัปโหลดในหลังบ้าน
   (ถ้าไม่ทำ รูปที่อัปโหลดจะหายเมื่อ redeploy เพราะ serverless เขียนไฟล์ถาวรไม่ได้)
   — Vercel จะตั้ง `BLOB_READ_WRITE_TOKEN` ให้อัตโนมัติ
4. Import โปรเจกต์ใน Vercel แล้วตั้ง Environment Variables:
   - `NEXT_PUBLIC_SITE_URL` = โดเมนจริง (มีผลกับ metadata/canonical/sitemap/robots/OG/RSS)
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (ตั้งรหัสใหม่), `AUTH_SECRET` (สุ่มยาว ๆ)
   - (ถ้าต้องการ) `NEXT_PUBLIC_GA_ID` หรือ `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
5. Deploy — Vercel รัน `next build` ให้เอง (HTTPS อัตโนมัติ)

**เช็กลิสต์ก่อนเปิดจริง:** เปลี่ยน `ADMIN_PASSWORD`/`AUTH_SECRET` เป็นค่าใหม่ · รัน `npm run seed` (ลบบทความทดสอบให้อัตโนมัติ) · ตรวจ `/sitemap.xml` และ `/robots.txt` ว่าโดเมนถูกต้อง

Dev ในเครื่อง: ไม่ต้องตั้ง Turso — ใช้ SQLite ไฟล์ (`prisma/dev.db`) โดยอัตโนมัติ

## หมายเหตุ

- เครื่องมือคำนวณและระบบค้นหา **ทำงานจริง** (ไม่ใช่ mock)
- เนื้อหาบทความเป็นแนวทางสำหรับมือใหม่ ควรปรับตัวเลข/วิธีการตามพื้นที่จริง
