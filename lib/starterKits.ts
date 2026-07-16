// ─────────────────────────────────────────────────────────────
// ชุดเริ่มต้น (starter kits) — บันเดิลแนวคิดของสินค้าเพื่อการเกษตร แยกลิงก์รายชิ้น
// ผู้ใช้เลือกซื้อเองทีละชิ้นตามต้องการ ไม่ใช่ชุดขายรวมชิ้นเดียว
// ─────────────────────────────────────────────────────────────
import raw from "@/data/starterKits.json";

export type StarterKitProduct = { slug: string; name: string; imageUrl: string };
export type StarterKitComponent = {
  order: number;
  name: string;
  importance: "required" | "optional";
  quantityHint: string;
  products: StarterKitProduct[];
};
export type StarterKit = {
  kitId: string;
  name: string;
  categorySlug: string;
  category: string;
  targetUser: string;
  summary: string;
  components: StarterKitComponent[];
};

const DATA = raw as Record<string, StarterKit>;

export function getAllStarterKits(): StarterKit[] {
  return Object.values(DATA);
}

export function getStarterKit(kitId: string): StarterKit | null {
  return DATA[kitId] ?? null;
}
