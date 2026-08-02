import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/data";
import { saveProductEditorialAction } from "@/lib/productActions";
import {
  freshSchemaPrice,
  getProductById,
  isProductIndexable,
  productDisplayName,
  productEditorialScore,
} from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: { id: string }; searchParams?: { saved?: string; error?: string } };

const ERROR_MESSAGES: Record<string, string> = {
  name: "กรุณากรอกชื่อสินค้าอย่างน้อย 4 ตัวอักษร",
  price: "ราคาต้องเป็นจำนวนเดียว เช่น 1250 หรือ ฿1,250 ไม่ใช่ช่วงราคา",
  "price-required": "กรุณากรอกราคาก่อนยืนยันวันที่ตรวจสอบ",
};

export default async function AdminProductEditor({ params, searchParams }: Params) {
  const product = await getProductById(params.id);
  if (!product) notFound();
  const score = productEditorialScore(product);
  const indexable = isProductIndexable(product);
  const saveAction = saveProductEditorialAction.bind(null, product.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/products" className="text-sm text-stone hover:text-ink">← กลับคิวสินค้า</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">แก้ไขข้อมูลสินค้า</h1>
          <p className="mt-1 text-sm text-stone">/{product.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${indexable ? "bg-lime-canopy text-ink" : "bg-linen text-stone"}`}>
            SEO {score}/7 · {indexable ? "พร้อม Index" : "ยัง Noindex"}
          </span>
          <Link href={`/products/${product.slug}`} target="_blank" className="rounded-full border border-ink px-4 py-2 text-sm text-ink">
            ดูหน้าจริง ↗
          </Link>
        </div>
      </div>

      {searchParams?.saved === "1" && (
        <div className="mt-5 rounded-xl bg-lime-canopy/50 p-4 text-sm text-ink">
          บันทึกแล้ว หน้าเว็บและ Sitemap จะอัปเดตตามรอบ Cache ไม่เกินประมาณ 5 นาที
        </div>
      )}
      {searchParams?.error && (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-ink">
          {ERROR_MESSAGES[searchParams.error] ?? "บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลอีกครั้ง"}
        </div>
      )}

      <form action={saveAction} className="mt-6 space-y-6 rounded-2xl bg-paper p-6 sm:p-8">
        <Field label="ชื่อสินค้าที่แสดง" hint="ตัดคำโฆษณาเกินจริงออก แต่คงชนิด รุ่น และขนาดสินค้าจริง">
          <input name="name" defaultValue={productDisplayName(product)} required maxLength={180} className="input-admin" />
        </Field>

        <Field label="หมวดสินค้า">
          <select name="category" defaultValue={product.category} className="input-admin">
            <option value="">ยังไม่จัดหมวด</option>
            {CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.icon} {category.title}</option>)}
          </select>
        </Field>

        <Field label="ทำไมต้องมีสินค้านี้" hint="อธิบายปัญหาหรือบริบทจริง ไม่รับประกันผลลัพธ์">
          <textarea name="whyNeeded" defaultValue={product.whyNeeded} rows={4} maxLength={2000} className="input-admin" />
        </Field>

        <Field label="ประโยชน์" hint="หนึ่งข้อต่อหนึ่งบรรทัด แนะนำอย่างน้อย 2 ข้อ">
          <textarea name="benefits" defaultValue={product.benefits.join("\n")} rows={5} className="input-admin" />
        </Field>

        <Field label="วิธีใช้ / ใช้เพื่ออะไร" hint="ยึดฉลากหรือคู่มือ ไม่กำหนดอัตราใช้แทนผู้ผลิต">
          <textarea name="usage" defaultValue={product.usage} rows={4} maxLength={2000} className="input-admin" />
        </Field>

        <Field label="วิธีเลือกซื้อ">
          <textarea name="howToChoose" defaultValue={product.howToChoose} rows={4} maxLength={2000} className="input-admin" />
        </Field>

        <Field label="เหมาะกับงานแบบไหน" hint="หนึ่งกรณีใช้งานต่อหนึ่งบรรทัด แนะนำอย่างน้อย 2 ข้อ">
          <textarea name="useCases" defaultValue={product.useCases.join("\n")} rows={4} className="input-admin" />
        </Field>

        <Field label="ข้อควรระวัง">
          <textarea name="safetyNote" defaultValue={product.safetyNote} rows={4} maxLength={2000} className="input-admin" />
        </Field>

        <div className="rounded-2xl bg-mist p-5">
          <h2 className="font-display text-lg font-bold text-ink">ราคาและ Product Schema</h2>
          <p className="mt-1 text-sm text-stone">
            ระบบจะแสดงราคาใน Schema เฉพาะจำนวนที่ตรวจจากหน้าร้านจริงไม่เกิน 30 วัน และเฉพาะหน้าที่พร้อม Index
          </p>
          <div className="mt-4">
            <label htmlFor="priceLabel" className="text-sm font-semibold text-ink">ราคาที่ตรวจพบ</label>
            <input id="priceLabel" name="priceLabel" defaultValue={product.priceLabel} placeholder="เช่น 1250" className="input-admin mt-2" />
          </div>
          <p className="mt-3 text-xs text-stone">
            ตรวจล่าสุด: {product.priceCheckedAt ? product.priceCheckedAt.toLocaleString("th-TH") : "ยังไม่เคยยืนยัน"}
            {freshSchemaPrice(product) ? " · ราคายังอยู่ในช่วง 30 วัน" : " · ยังไม่ใช้ราคาใน Schema"}
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" name="confirmPrice" className="mt-1" />
            ฉันเปิดหน้าร้านและตรวจสอบราคานี้แล้ววันนี้
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm text-stone">
            <input type="checkbox" name="clearPrice" className="mt-1" />
            ล้างราคาและวันที่ตรวจสอบออก
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linen pt-6">
          <p className="max-w-xl text-xs text-stone">
            หลีกเลี่ยงคำว่า ได้ผล 100%, ดีที่สุด, รับประกันผล และข้อมูลที่ตรวจสอบจากตัวสินค้าไม่ได้
          </p>
          <button className="rounded-full bg-lime-canopy px-6 py-3 font-semibold text-ink hover:bg-lime-deep">
            บันทึกข้อมูลสินค้า
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
