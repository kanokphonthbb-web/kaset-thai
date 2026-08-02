// ─────────────────────────────────────────────────────────────
// ตรวจสถานะความปลอดภัย/การขึ้นทะเบียนของสินค้าที่แนะนำในเครื่องมือเช็กโรค
// ค่าเริ่มต้นปลอดภัย: ไม่แสดงสินค้าที่เข้าข่ายควบคุม เว้นแต่จะถูกยืนยัน (allowlist) ไว้ล่วงหน้า
// ─────────────────────────────────────────────────────────────
import allowlistRaw from "@/data/productSafetyAllowlist.json";

export type ProductSafetyStatus = "verified" | "needs-registration-check" | "do-not-show";

type AllowlistEntry = { status: ProductSafetyStatus };
const ALLOWLIST = allowlistRaw as Record<string, AllowlistEntry>;

export const PRODUCT_REVIEW_REQUIRED_RE =
  /(ยา(?:ฆ่า|กำจัด|รักษา|ปฏิชีวนะ)|สารกำจัด|สารฆ่าเชื้อ|สารคุมหญ้า|วัคซีน|ฮอร์โมน|ปุ๋ย|จุลินทรีย์|บิวเวอเรีย|เมธาไรเซียม|เชื้อบีที|อาหารทดแทนนม|อาหาร(?:ปลา|กุ้ง|ไก่|เป็ด|หมู|วัว|โค|แพะ|แกะ|สัตว์)|พรีมิกซ์|วิตามิน(?:ไก่|เป็ด|หมู|วัว|โค|แพะ|สัตว์)|ยาฆ่าเชื้อ|ฆ่าเชื้อโรงเรือน)/iu;

export const CLEARLY_UNRELATED_PRODUCT_RE =
  /(เสื้อยืด|เสื้อแฟชั่น|กางเกงแฟชั่น|ชุดเดรส|รองเท้า(?!บูท)|กระเป๋าแฟชั่น|เครื่องประดับ|ตุ๊กตา|เคสโทรศัพท์|นิยาย|โปสเตอร์|ของเล่น|แผงโฟมกันเสียง)/iu;

export const CLEARLY_SAFE_EQUIPMENT_RE =
  /(ตะกร้าใส่ปุ๋ย|ถังหมัก(?:เศษอาหาร|ปุ๋ย)|เครื่อง(?:หยอดเมล็ด|ปลูก|หว่าน|ใส่|ผสม|พ่น)(?:[^\n]{0,40})(?:เมล็ด|ปุ๋ย|อาหารสัตว์)|(?:ถัง|ราง|ถ้วย|เครื่อง)ให้อาหาร|อุปกรณ์(?:[^\n]{0,30})(?:ใส่|หว่าน|พ่น)(?:[^\n]{0,20})ปุ๋ย)/iu;

export function getProductSafetyStatus(entry: { slug: string | null; name: string }): ProductSafetyStatus {
  if (!entry.slug) return "do-not-show";

  const listed = ALLOWLIST[entry.slug];
  if (listed?.status === "do-not-show") return "do-not-show";
  if (listed?.status === "verified") return "verified";

  if (CLEARLY_UNRELATED_PRODUCT_RE.test(entry.name)) return "do-not-show";
  if (CLEARLY_SAFE_EQUIPMENT_RE.test(entry.name)) return "verified";
  if (PRODUCT_REVIEW_REQUIRED_RE.test(entry.name)) {
    return "needs-registration-check";
  }

  return "verified";
}

export function filterDiseaseProductRoles<
  T extends { diagnose: any[]; manage: any[]; prevent: any[]; ppe: any[] },
>(roles: T): T {
  const filterRole = (items: any[]) => items.filter((entry) => getProductSafetyStatus(entry) === "verified");

  return {
    ...roles,
    diagnose: filterRole(roles.diagnose),
    manage: filterRole(roles.manage),
    prevent: filterRole(roles.prevent),
    ppe: filterRole(roles.ppe),
  };
}
