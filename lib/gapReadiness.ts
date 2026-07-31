// ─────────────────────────────────────────────────────────────
// GAP (Good Agricultural Practices) readiness checklist — pure,
// unit-testable scoring logic for /tools/gap-readiness-check.
//
// IMPORTANT: this is a self-assessment PREPARATION checklist only.
// It is NOT an official inspection, does NOT guarantee that a farm
// will pass GAP certification, and the checklist items below are
// general good-practice preparation questions — not fabricated
// official standard codes/numbers. Requirements set by official
// agencies can change; users must verify the latest requirements
// themselves (see OFFICIAL_AGENCIES below).
// ─────────────────────────────────────────────────────────────

export type CategoryId =
  | "water"
  | "area"
  | "fertilizer"
  | "hazardous"
  | "storage"
  | "harvest"
  | "hygiene"
  | "records"
  | "traceability"
  | "waste"
  | "worker";

// An item can be answered "yes" (true), "no" (false), or "unsure".
// Unanswered items are NOT present as a key in the answers map at all.
export type AnswerValue = boolean | "unsure";

export interface ChecklistItem {
  id: string;
  category: CategoryId;
  question: string;
}

export interface ChecklistCategory {
  id: CategoryId;
  label: string;
  items: ChecklistItem[];
}

export type ItemAnswerStatus = "no" | "unsure" | "unanswered";

export interface ItemStatus {
  id: string;
  category: CategoryId;
  question: string;
  status: ItemAnswerStatus;
}

export interface CategoryScore {
  category: CategoryId;
  label: string;
  passed: number;
  total: number;
  itemsNeedingFix: ItemStatus[];
}

export type ResultBucket =
  | "พร้อมเบื้องต้น"
  | "ต้องปรับปรุงบางส่วน"
  | "ยังขาดข้อมูลสำคัญ";

export interface GapReadinessResult {
  bucket: ResultBucket;
  overallPercent: number; // 0-100, rounded
  totalPassed: number;
  totalItems: number;
  categoryScores: CategoryScore[];
  itemsToFix: ItemStatus[];
  documentsToPrepare: string[];
  officialAgencies: string[];
}

// ── Checklist data ──────────────────────────────────────────────
// 11 categories × 2-4 items each. Items are phrased as general,
// preparation-oriented good-practice checks (no fabricated official
// standard numbers/codes since those cannot be verified here).
export const CHECKLIST: ChecklistCategory[] = [
  {
    id: "water",
    label: "แหล่งน้ำ",
    items: [
      { id: "water-1", category: "water", question: "มีการตรวจสอบคุณภาพน้ำที่ใช้รดพืชหรือไม่" },
      { id: "water-2", category: "water", question: "แหล่งน้ำที่ใช้อยู่ห่างจากแหล่งปนเปื้อน เช่น คอกสัตว์ หรือบ่อบำบัดน้ำเสียหรือไม่" },
      { id: "water-3", category: "water", question: "มีการบันทึกแหล่งที่มาของน้ำที่ใช้ในแปลงหรือไม่" },
    ],
  },
  {
    id: "area",
    label: "พื้นที่เพาะปลูก",
    items: [
      { id: "area-1", category: "area", question: "มีการทำผังแปลง/ผังฟาร์มที่ระบุตำแหน่งแปลงปลูกชัดเจนหรือไม่" },
      { id: "area-2", category: "area", question: "พื้นที่เพาะปลูกอยู่ห่างจากแหล่งมลพิษ เช่น โรงงานหรือกองขยะหรือไม่" },
      { id: "area-3", category: "area", question: "มีการกำหนดขอบเขตแปลงเพื่อป้องกันการปนเปื้อนจากแปลงข้างเคียงหรือไม่" },
    ],
  },
  {
    id: "fertilizer",
    label: "การใช้ปุ๋ย",
    items: [
      { id: "fertilizer-1", category: "fertilizer", question: "มีการบันทึกชนิดและปริมาณปุ๋ยที่ใช้ในแต่ละรอบการปลูกหรือไม่" },
      { id: "fertilizer-2", category: "fertilizer", question: "ปุ๋ยที่ใช้มีฉลากและแหล่งที่มาที่ตรวจสอบได้หรือไม่" },
      { id: "fertilizer-3", category: "fertilizer", question: "มีการเว้นระยะเวลาก่อนเก็บเกี่ยวหลังใส่ปุ๋ยตามคำแนะนำหรือไม่" },
    ],
  },
  {
    id: "hazardous",
    label: "การใช้สารอันตราย",
    items: [
      { id: "hazardous-1", category: "hazardous", question: "มีการบันทึกชนิด ปริมาณ และวันที่ใช้สารกำจัดศัตรูพืชหรือไม่" },
      { id: "hazardous-2", category: "hazardous", question: "ผู้ใช้สารอันตรายสวมอุปกรณ์ป้องกันตนเอง เช่น ถุงมือหรือหน้ากาก ทุกครั้งหรือไม่" },
      { id: "hazardous-3", category: "hazardous", question: "มีการเว้นระยะเวลาก่อนเก็บเกี่ยวหลังพ่นสารตามฉลากหรือไม่" },
      { id: "hazardous-4", category: "hazardous", question: "สารเคมีที่ใช้เป็นชนิดที่ได้รับอนุญาตให้ใช้ทางการเกษตรหรือไม่" },
    ],
  },
  {
    id: "storage",
    label: "การเก็บวัสดุ/สารเคมี",
    items: [
      { id: "storage-1", category: "storage", question: "สารเคมีและปุ๋ยถูกเก็บแยกจากผลผลิตและที่พักอาศัยหรือไม่" },
      { id: "storage-2", category: "storage", question: "สถานที่เก็บสารเคมีมีการล็อกหรือป้องกันการเข้าถึงจากเด็กและสัตว์เลี้ยงหรือไม่" },
      { id: "storage-3", category: "storage", question: "ภาชนะบรรจุสารเคมีมีฉลากชัดเจนและไม่รั่วซึมหรือไม่" },
    ],
  },
  {
    id: "harvest",
    label: "การเก็บเกี่ยว",
    items: [
      { id: "harvest-1", category: "harvest", question: "อุปกรณ์เก็บเกี่ยวได้รับการทำความสะอาดก่อนใช้งานหรือไม่" },
      { id: "harvest-2", category: "harvest", question: "มีการบันทึกวันที่เก็บเกี่ยวของแต่ละรอบผลผลิตหรือไม่" },
      { id: "harvest-3", category: "harvest", question: "ภาชนะบรรจุผลผลิตหลังเก็บเกี่ยวสะอาดและไม่ปนเปื้อนหรือไม่" },
    ],
  },
  {
    id: "hygiene",
    label: "สุขอนามัย",
    items: [
      { id: "hygiene-1", category: "hygiene", question: "ผู้ปฏิบัติงานล้างมือก่อนสัมผัสผลผลิตหรือไม่" },
      { id: "hygiene-2", category: "hygiene", question: "มีจุดล้างมือหรืออุปกรณ์ทำความสะอาดในพื้นที่ปฏิบัติงานหรือไม่" },
      { id: "hygiene-3", category: "hygiene", question: "ผู้ที่มีอาการเจ็บป่วยหรือมีแผลเปิด งดสัมผัสผลผลิตโดยตรงหรือไม่" },
    ],
  },
  {
    id: "records",
    label: "การบันทึกข้อมูล",
    items: [
      { id: "records-1", category: "records", question: "มีสมุดหรือระบบบันทึกกิจกรรมการเพาะปลูกอย่างสม่ำเสมอหรือไม่" },
      { id: "records-2", category: "records", question: "บันทึกข้อมูลย้อนหลังสามารถค้นหาและตรวจสอบได้ง่ายหรือไม่" },
      { id: "records-3", category: "records", question: "มีการเก็บเอกสารหรือใบเสร็จการซื้อปัจจัยการผลิต เช่น ปุ๋ยหรือสารเคมี หรือไม่" },
    ],
  },
  {
    id: "traceability",
    label: "การตรวจสอบย้อนกลับ",
    items: [
      { id: "traceability-1", category: "traceability", question: "สามารถระบุได้ว่าผลผลิตแต่ละล็อตมาจากแปลงใดหรือไม่" },
      { id: "traceability-2", category: "traceability", question: "มีการติดรหัสหรือป้ายกำกับล็อตผลผลิตก่อนส่งขายหรือไม่" },
      { id: "traceability-3", category: "traceability", question: "หากพบปัญหาผลผลิต สามารถย้อนกลับไปหาขั้นตอนการผลิตที่เกี่ยวข้องได้หรือไม่" },
    ],
  },
  {
    id: "waste",
    label: "การจัดการของเสีย",
    items: [
      { id: "waste-1", category: "waste", question: "มีจุดทิ้งขยะหรือบรรจุภัณฑ์สารเคมีที่ใช้แล้วแยกต่างหากหรือไม่" },
      { id: "waste-2", category: "waste", question: "ภาชนะบรรจุสารเคมีที่ใช้หมดแล้วถูกกำจัดอย่างถูกวิธีและไม่นำกลับมาใช้ซ้ำหรือไม่" },
      { id: "waste-3", category: "waste", question: "มีการจัดการเศษวัสดุจากการเกษตร เช่น เศษพืช อย่างเหมาะสมหรือไม่" },
    ],
  },
  {
    id: "worker",
    label: "ความปลอดภัยของแรงงาน",
    items: [
      { id: "worker-1", category: "worker", question: "ผู้ปฏิบัติงานได้รับการอบรมเรื่องความปลอดภัยในการทำงานหรือไม่" },
      { id: "worker-2", category: "worker", question: "มีอุปกรณ์ป้องกันส่วนบุคคล เช่น ถุงมือ หน้ากาก รองเท้าบูท ให้ผู้ปฏิบัติงานใช้หรือไม่" },
      { id: "worker-3", category: "worker", question: "มีจุดปฐมพยาบาลเบื้องต้นในพื้นที่ทำงานหรือไม่" },
    ],
  },
];

export const ALL_ITEMS: ChecklistItem[] = CHECKLIST.flatMap((c) => c.items);

// Documents worth preparing, grouped by category — surfaced for
// categories that still have unmet (no/unsure/unanswered) items.
const DOCUMENTS_BY_CATEGORY: Record<CategoryId, string[]> = {
  water: ["บันทึกผลตรวจคุณภาพน้ำ", "บันทึกแหล่งที่มาของน้ำที่ใช้"],
  area: ["ผังแปลง/ผังฟาร์ม", "หลักฐานการใช้ประโยชน์ที่ดิน"],
  fertilizer: ["บันทึกการใช้ปุ๋ย", "ฉลากหรือใบเสร็จปุ๋ยที่ซื้อ"],
  hazardous: ["บันทึกการใช้สารกำจัดศัตรูพืช/สารเคมี", "ฉลากสารเคมีที่ใช้"],
  storage: ["ผังจุดเก็บสารเคมี/ปุ๋ย", "บันทึกการตรวจสอบสถานที่เก็บวัสดุ"],
  harvest: ["บันทึกวันเก็บเกี่ยว", "บันทึกการทำความสะอาดอุปกรณ์เก็บเกี่ยว"],
  hygiene: ["บันทึก/ป้ายแนะนำสุขอนามัยผู้ปฏิบัติงาน"],
  records: ["สมุดบันทึกกิจกรรมการเพาะปลูก", "แฟ้มเอกสารใบเสร็จปัจจัยการผลิต"],
  traceability: ["บันทึกรหัสล็อตผลผลิต", "ผังเชื่อมโยงล็อตผลผลิตกับแปลงปลูก"],
  waste: ["บันทึกการจัดการของเสีย/บรรจุภัณฑ์สารเคมี"],
  worker: ["บันทึกการอบรมความปลอดภัยแรงงาน", "ทะเบียนอุปกรณ์ป้องกันส่วนบุคคล"],
};

// General, well-known Thai agricultural standard/oversight agencies —
// plain names only, no fabricated URLs or phone numbers. Always check
// their latest official information directly.
export const OFFICIAL_AGENCIES: string[] = [
  "กรมวิชาการเกษตร",
  "สำนักงานมาตรฐานสินค้าเกษตรและอาหารแห่งชาติ (มกอช.)",
  "สำนักงานเกษตรจังหวัด / สำนักงานเกษตรอำเภอในพื้นที่",
];

// ── Scoring thresholds ───────────────────────────────────────────
// overallPercent = (จำนวนข้อที่ตอบ "ใช่" / จำนวนข้อทั้งหมด) * 100
//   >= 90%  → "พร้อมเบื้องต้น"        (เกือบครบทุกข้อ)
//   >= 50%  → "ต้องปรับปรุงบางส่วน"   (ทำไปแล้วบางส่วน ยังมีจุดต้องแก้)
//   <  50%  → "ยังขาดข้อมูลสำคัญ"     (ยังไม่พร้อมในหลายด้าน)
// รายการที่ยังไม่ได้ตอบ (ไม่มี key ใน answers) ถือเป็นกรณีเลวร้ายที่สุด
// เหมือนตอบ "ไม่ใช่" — เพื่อไม่ให้ข้อที่ยังไม่ได้ตรวจสอบถูกนับว่าผ่านไปเอง
const TOP_THRESHOLD = 0.9;
const MID_THRESHOLD = 0.5;

function itemStatusFor(item: ChecklistItem, answers: Record<string, AnswerValue>): ItemAnswerStatus | "yes" {
  if (!(item.id in answers)) return "unanswered";
  const value = answers[item.id];
  if (value === true) return "yes";
  if (value === "unsure") return "unsure";
  return "no";
}

export function scoreGapReadiness(
  answers: Record<string, AnswerValue>,
): GapReadinessResult {
  const safeAnswers = answers ?? {};

  const categoryScores: CategoryScore[] = [];
  const itemsToFix: ItemStatus[] = [];
  let totalPassed = 0;

  for (const category of CHECKLIST) {
    let passed = 0;
    const itemsNeedingFix: ItemStatus[] = [];

    for (const item of category.items) {
      const status = itemStatusFor(item, safeAnswers);
      if (status === "yes") {
        passed += 1;
      } else {
        const fixEntry: ItemStatus = {
          id: item.id,
          category: item.category,
          question: item.question,
          status,
        };
        itemsNeedingFix.push(fixEntry);
        itemsToFix.push(fixEntry);
      }
    }

    totalPassed += passed;
    categoryScores.push({
      category: category.id,
      label: category.label,
      passed,
      total: category.items.length,
      itemsNeedingFix,
    });
  }

  const totalItems = ALL_ITEMS.length;
  const overallRatio = totalItems > 0 ? totalPassed / totalItems : 0;
  const overallPercent = Math.round(overallRatio * 100);

  let bucket: ResultBucket;
  if (overallRatio >= TOP_THRESHOLD) {
    bucket = "พร้อมเบื้องต้น";
  } else if (overallRatio >= MID_THRESHOLD) {
    bucket = "ต้องปรับปรุงบางส่วน";
  } else {
    bucket = "ยังขาดข้อมูลสำคัญ";
  }

  const categoriesWithGaps = new Set(
    categoryScores.filter((c) => c.itemsNeedingFix.length > 0).map((c) => c.category),
  );
  const documentsToPrepare = Array.from(categoriesWithGaps).flatMap(
    (id) => DOCUMENTS_BY_CATEGORY[id],
  );
  // de-dupe while preserving order
  const uniqueDocuments = Array.from(new Set(documentsToPrepare));

  return {
    bucket,
    overallPercent,
    totalPassed,
    totalItems,
    categoryScores,
    itemsToFix,
    documentsToPrepare: uniqueDocuments,
    officialAgencies: OFFICIAL_AGENCIES,
  };
}
