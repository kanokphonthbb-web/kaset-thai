// ─────────────────────────────────────────────────────────────
// สินค้าที่เกี่ยวข้องกับแต่ละโรค (เช็กโรคเบื้องต้น) — สร้างจากข้อมูล Shopee affiliate
// จับคู่กับ lib/diseaseData.ts แบบ exact name ก่อน แล้ว fallback เป็นระดับกลุ่ม (species)
// เพราะสินค้าหลายชุดเป็นของดูแล/ป้องกันทั่วไปของสัตว์ชนิดนั้น ไม่ผูกกับโรคใดโรคหนึ่งเจาะจง
// ─────────────────────────────────────────────────────────────
import raw from "@/data/diseaseProducts.json";
import type { Disease } from "@/lib/diseaseData";

type Entry = { name: string; imageUrl: string; slug: string | null };
type Roles = { diagnose: Entry[]; manage: Entry[]; prevent: Entry[]; ppe: Entry[] };
type Target = { safetyNote: string; roles: Roles };

const DATA = raw as Record<string, Target>;

export type { Entry as DiseaseProductEntry, Roles as DiseaseProductRoles };

export const ROLE_LABELS: Record<keyof Roles, { icon: string; title: string }> = {
  diagnose: { icon: "🔍", title: "ตรวจสาเหตุ" },
  manage: { icon: "🧪", title: "ช่วยจัดการ" },
  prevent: { icon: "🛡️", title: "ป้องกันซ้ำ" },
  ppe: { icon: "🥾", title: "อุปกรณ์ปลอดภัย" },
};

export function getDiseaseProducts(disease: Pick<Disease, "group" | "name">): Target | null {
  return DATA[`name::${disease.group}::${disease.name}`] ?? DATA[`group::${disease.group}`] ?? null;
}
