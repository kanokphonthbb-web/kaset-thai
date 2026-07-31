// ─────────────────────────────────────────────────────────────
// ข้อมูลความปลอดภัยกลาง (boilerplate) แยกตามหมวดสิ่งมีชีวิต — ใช้ร่วมกับ diseaseData.ts
// ไม่ผูกกับโรคใดโรคหนึ่งเจาะจง เป็นแนวทางทั่วไปเพื่อความปลอดภัยของผู้ใช้
// ─────────────────────────────────────────────────────────────
import type { Disease } from "@/lib/diseaseData";

export type GroupKind = "plant" | "rice" | "livestock" | "fishery";

export function groupKindOf(group: string): GroupKind {
  switch (group) {
    case "พืชผัก–ไม้ผล":
      return "plant";
    case "ข้าว":
      return "rice";
    case "ปลา (ประมง)":
      return "fishery";
    default:
      return "livestock";
  }
}

export type OfficialSource = { name: string; url: string };

type SafetyBundle = {
  stopSignals: string[];
  consult: string[];
  ppe: string[];
  sources: OfficialSource[];
};

const PLANT_SOURCES: OfficialSource[] = [
  { name: "กรมวิชาการเกษตร", url: "https://www.doa.go.th" },
  { name: "กรมส่งเสริมการเกษตร", url: "https://www.doae.go.th" },
  { name: "กระทรวงเกษตรและสหกรณ์", url: "https://www.moac.go.th" },
];

const RICE_SOURCES: OfficialSource[] = [
  { name: "กรมการข้าว", url: "https://www.ricethailand.go.th" },
  { name: "กรมส่งเสริมการเกษตร", url: "https://www.doae.go.th" },
  { name: "กระทรวงเกษตรและสหกรณ์", url: "https://www.moac.go.th" },
];

const LIVESTOCK_SOURCES: OfficialSource[] = [
  { name: "กรมปศุสัตว์", url: "https://www.dld.go.th" },
  { name: "กระทรวงเกษตรและสหกรณ์", url: "https://www.moac.go.th" },
];

const FISHERY_SOURCES: OfficialSource[] = [
  { name: "กรมประมง", url: "https://www.fisheries.go.th" },
  { name: "กระทรวงเกษตรและสหกรณ์", url: "https://www.moac.go.th" },
];

export const SAFETY_TABLE: Record<GroupKind, SafetyBundle> = {
  plant: {
    stopSignals: [
      "อาการลุกลามเร็วหรือแย่ลงหลังดูแลเบื้องต้นตามระยะเวลาที่เหมาะสม",
      "ต้น/แปลงจำนวนมากทยอยแสดงอาการพร้อมกันในเวลาใกล้เคียงกัน",
      "ไม่แน่ใจว่าเป็นโรคจริงหรืออาการคล้ายกันจากสาเหตุอื่น",
    ],
    consult: [
      "เกษตรอำเภอ หรือนักวิชาการเกษตรในพื้นที่",
      "กรมวิชาการเกษตร หรือกรมส่งเสริมการเกษตร",
    ],
    ppe: [
      "สวมถุงมือทุกครั้งที่สัมผัสต้น/สารเคมี",
      "สวมหน้ากากป้องกันไอระเหยเมื่อพ่นสารป้องกันกำจัดศัตรูพืช",
      "สวมแว่นตานิรภัยและเสื้อแขนยาวขณะพ่นสาร",
      "ล้างมือและอาบน้ำหลังสัมผัสสารหรือพืชที่เป็นโรค",
    ],
    sources: PLANT_SOURCES,
  },
  rice: {
    stopSignals: [
      "อาการลุกลามทั่วแปลงเร็วหรือแย่ลงหลังดูแลเบื้องต้นตามระยะเวลาที่เหมาะสม",
      "พบระบาดพร้อมกันในหลายแปลงข้างเคียงในช่วงเวลาใกล้กัน",
      "ไม่แน่ใจว่าเป็นโรคจริงหรืออาการคล้ายกันจากสาเหตุอื่น",
    ],
    consult: [
      "เกษตรอำเภอ หรือนักวิชาการเกษตรในพื้นที่",
      "กรมการข้าว หรือกรมส่งเสริมการเกษตร",
    ],
    ppe: [
      "สวมถุงมือทุกครั้งที่สัมผัสสารป้องกันกำจัดศัตรูพืช",
      "สวมหน้ากากป้องกันไอระเหยเมื่อพ่นสาร",
      "สวมแว่นตานิรภัยและรองเท้าบูทขณะลงแปลงพ่นสาร",
      "ล้างมือและอาบน้ำหลังสัมผัสสารหรือลงแปลงที่มีโรคระบาด",
    ],
    sources: RICE_SOURCES,
  },
  livestock: {
    stopSignals: [
      "สัตว์ตายผิดปกติหลายตัวในเวลาใกล้กัน",
      "อาการไม่ดีขึ้นหรือแย่ลงหลังดูแลเบื้องต้นตามระยะเวลาที่เหมาะสม",
      "มีอาการทางระบบประสาท เลือดออก หรือหายใจลำบากรุนแรง",
      "สงสัยว่าเป็นโรคติดต่อร้ายแรงหรือโรคที่ต้องแจ้งเจ้าหน้าที่",
    ],
    consult: [
      "ปศุสัตว์อำเภอ/จังหวัด หรือสัตวแพทย์ในพื้นที่",
    ],
    ppe: [
      "สวมถุงมือทุกครั้งที่สัมผัสสัตว์ป่วยหรือซาก",
      "สวมหน้ากากอนามัยเมื่อดูแลสัตว์ป่วยหรือทำความสะอาดคอก",
      "สวมรองเท้าบูทและเสื้อผ้าที่ล้างทำความสะอาดได้ง่าย",
      "ล้างมือและอาบน้ำหลังสัมผัสสัตว์ป่วยหรือซากเสมอ",
    ],
    sources: LIVESTOCK_SOURCES,
  },
  fishery: {
    stopSignals: [
      "ปลาตายผิดปกติจำนวนมากในเวลาใกล้กัน",
      "อาการไม่ดีขึ้นหรือแย่ลงหลังดูแลเบื้องต้นตามระยะเวลาที่เหมาะสม",
      "คุณภาพน้ำผิดปกติรุนแรง (มีกลิ่นเหม็น สีเข้มผิดปกติ) ควบคู่กับปลาป่วย",
    ],
    consult: [
      "ประมงอำเภอ/จังหวัด",
    ],
    ppe: [
      "สวมถุงมือเมื่อสัมผัสปลาป่วยหรือสารเคมีในบ่อ",
      "สวมแว่นตานิรภัยเมื่อผสม/ใช้สารเคมีปรับคุณภาพน้ำ",
      "สวมรองเท้าบูทขณะทำงานรอบบ่อ",
      "ล้างมือและอาบน้ำหลังสัมผัสปลาป่วยหรือสารเคมี",
    ],
    sources: FISHERY_SOURCES,
  },
};

export function getSafetyContent(disease: Pick<Disease, "group">): SafetyBundle {
  return SAFETY_TABLE[groupKindOf(disease.group)];
}

// จับคำที่บ่งชี้สาร/ยา/วัคซีนที่ควรมีการกำกับดูแล หรือใช้อย่างระมัดระวัง
export const REGULATED_KEYWORD_RE =
  /สาร(?!ชีวภัณฑ์)|ยาปฏิชีวนะ|ฆ่าเชื้อ|กำจัดศัตรู|วัคซีน|ปฏิชีวนะ|พ่นสาร|คอปเปอร์|กำมะถัน/;

export function splitTreatByRisk(disease: Disease): { lowRisk: string[]; needsConsult: string[] } {
  const lowRisk: string[] = [];
  const needsConsult: string[] = [];

  if (disease.lowRiskTreatIdx) {
    const lowRiskIdx = new Set(disease.lowRiskTreatIdx);
    disease.treat.forEach((t, i) => {
      if (lowRiskIdx.has(i)) lowRisk.push(t);
      else needsConsult.push(t);
    });
    return { lowRisk, needsConsult };
  }

  for (const t of disease.treat) {
    if (REGULATED_KEYWORD_RE.test(t)) needsConsult.push(t);
    else lowRisk.push(t);
  }
  return { lowRisk, needsConsult };
}
