// ─────────────────────────────────────────────────────────────
// ตรวจสถานะความปลอดภัย/การขึ้นทะเบียนของสินค้าที่แนะนำในเครื่องมือเช็กโรค
// ค่าเริ่มต้นปลอดภัย: ไม่แสดงสินค้าที่เข้าข่ายควบคุม เว้นแต่จะถูกยืนยัน (allowlist) ไว้ล่วงหน้า
// ─────────────────────────────────────────────────────────────
import allowlistRaw from "@/data/productSafetyAllowlist.json";
import { REGULATED_KEYWORD_RE } from "@/lib/diseaseSafety";

export type ProductSafetyStatus = "verified" | "needs-registration-check" | "do-not-show";

type AllowlistEntry = { status: ProductSafetyStatus };
const ALLOWLIST = allowlistRaw as Record<string, AllowlistEntry>;

export function getProductSafetyStatus(entry: { slug: string | null; name: string }): ProductSafetyStatus {
  if (!entry.slug) return "do-not-show";

  const listed = ALLOWLIST[entry.slug];
  if (listed?.status === "do-not-show") return "do-not-show";
  if (listed?.status === "verified") return "verified";

  if (REGULATED_KEYWORD_RE.test(entry.name)) return "needs-registration-check";

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
