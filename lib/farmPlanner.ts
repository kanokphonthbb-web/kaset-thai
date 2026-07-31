// ─────────────────────────────────────────────────────────────
// Farm planner — pure, rule-based matching against a small static
// catalog of smallholder farming-option profiles. No AI/API calls.
// Always returns up to 3 ranked options (never zero, never more than 3).
// ─────────────────────────────────────────────────────────────

export type WaterSource = "มีน้ำตลอดปี" | "มีน้ำตามฤดูกาล" | "ต้องซื้อน้ำ" | "ไม่แน่ใจ";
export type TimeAvailable = "เต็มเวลา" | "ครึ่งวัน" | "ไม่กี่ชั่วโมง/วัน" | "วันหยุดเท่านั้น";
export type ExperienceLevel = "ไม่มีประสบการณ์" | "เคยลองทำ" | "มีประสบการณ์";
export type Interest = "พืชผัก/ไม้ผล" | "ปศุสัตว์" | "ประมง/สัตว์น้ำ" | "แบบผสมผสาน";
export type IncomeSpeed =
  | "เร็ว(น้อยกว่า 6 เดือน)"
  | "ปานกลาง(6-12 เดือน)"
  | "ระยะยาว(มากกว่า1ปี)";
export type Purpose = "เพื่อบริโภคเอง" | "รายได้เสริม" | "เป็นอาชีพหลัก";

// Matches the Product.category values used by lib/products.ts /
// scripts/import-affiliate-v2-products.mjs (also the site's own top-level
// category route slugs: /plants /animals /fishery /mixed-farming).
export type FarmingCategory = "plants" | "animals" | "fishery" | "mixed-farming";

export type FarmPlannerInput = {
  province: string;
  landSizeRai: number;
  waterSource: WaterSource;
  budget: number;
  timeAvailable: TimeAvailable;
  experience: ExperienceLevel;
  interest: Interest;
  incomeSpeed: IncomeSpeed;
  purpose: Purpose;
};

export type RelatedLink = { label: string; href: string };

export type FarmPlannerOption = {
  id: string;
  name: string;
  category: FarmingCategory;
  whyItFits: string;
  keyConditions: string[];
  budgetRange: string;
  timeToFirstYield: string;
  workload: string;
  risk: string;
  whatToStudy: string[];
  relatedTools: RelatedLink[];
  relatedArticles: RelatedLink[];
  equipment: string[];
  matchScore: number;
};

type Candidate = {
  id: string;
  name: string;
  category: FarmingCategory;
  interestMatch: Interest[];
  minLandRai: number;
  maxLandRai: number;
  minBudget: number;
  maxBudget: number;
  waterNeed: WaterSource[];
  timeNeed: TimeAvailable[];
  experienceNeed: ExperienceLevel[];
  incomeSpeed: IncomeSpeed[];
  purposeFit: Purpose[];
  budgetRange: string;
  timeToFirstYield: string;
  workload: string;
  risk: string;
  whatToStudy: string[];
  equipment: string[];
  relatedTools: RelatedLink[];
  relatedArticles: RelatedLink[];
};

// Product/category tag vocabulary for AffiliateRecommendations, aligned to
// real Product.category values (see scripts/import-affiliate-v2-products.mjs
// CATEGORY_MAP) so matches have a real chance of hitting catalog products.
export const CATEGORY_PRODUCT_TAGS: Record<FarmingCategory, string[]> = {
  plants: ["plants", "soil-water-fertilizer"],
  animals: ["animals"],
  fishery: ["fishery"],
  "mixed-farming": ["mixed-farming", "plants", "animals", "fishery"],
};

const PLANT_TOOLS: RelatedLink[] = [
  { label: "คำนวณต้นทุนปลูกพืช", href: "/tools/plant-cost" },
  { label: "คำนวณราคาขายขั้นต่ำ", href: "/tools/minimum-selling-price" },
];
const ANIMAL_TOOLS: RelatedLink[] = [
  { label: "คำนวณต้นทุนเลี้ยงสัตว์", href: "/tools/animal-cost" },
  { label: "คำนวณราคาขายขั้นต่ำ", href: "/tools/minimum-selling-price" },
];
const MIXED_TOOLS: RelatedLink[] = [
  { label: "คำนวณต้นทุนปลูกพืช", href: "/tools/plant-cost" },
  { label: "คำนวณต้นทุนเลี้ยงสัตว์", href: "/tools/animal-cost" },
  { label: "คำนวณราคาขายขั้นต่ำ", href: "/tools/minimum-selling-price" },
];

const PLANT_ARTICLES: RelatedLink[] = [
  { label: "บทความหมวดปลูกพืช", href: "/plants" },
  { label: "ต้นทุน-กำไรเกษตร", href: "/cost-profit" },
];
const ANIMAL_ARTICLES: RelatedLink[] = [
  { label: "บทความหมวดเลี้ยงสัตว์", href: "/animals" },
  { label: "ต้นทุน-กำไรเกษตร", href: "/cost-profit" },
];
const FISHERY_ARTICLES: RelatedLink[] = [
  { label: "บทความหมวดประมง/สัตว์น้ำ", href: "/fishery" },
  { label: "ต้นทุน-กำไรเกษตร", href: "/cost-profit" },
];
const MIXED_ARTICLES: RelatedLink[] = [
  { label: "บทความหมวดเกษตรผสมผสาน", href: "/mixed-farming" },
  { label: "ต้นทุน-กำไรเกษตร", href: "/cost-profit" },
];

const CANDIDATES: Candidate[] = [
  {
    id: "veggie-home-plot",
    name: "ปลูกผักสวนครัวขาย (แปลงเล็ก)",
    category: "plants",
    interestMatch: ["พืชผัก/ไม้ผล", "แบบผสมผสาน"],
    minLandRai: 0,
    maxLandRai: 1,
    minBudget: 0,
    maxBudget: 8000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล", "ไม่แน่ใจ"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน", "วันหยุดเท่านั้น", "เต็มเวลา"],
    experienceNeed: ["ไม่มีประสบการณ์", "เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["เร็ว(น้อยกว่า 6 เดือน)"],
    purposeFit: ["เพื่อบริโภคเอง", "รายได้เสริม"],
    budgetRange: "0 - 8,000 บาท",
    timeToFirstYield: "ประมาณ 3-6 สัปดาห์",
    workload: "เบา-ปานกลาง รดน้ำ/ดูแลวันละ 30 นาที - 1 ชั่วโมง",
    risk: "ผลผลิตอาจเสียหายจากแมลง/โรคพืช และราคาผักผันผวนตามฤดูกาล ควรมีตลาดรองรับก่อนขยายแปลง",
    whatToStudy: ["เทคนิคเตรียมแปลงและดินปลูก", "การป้องกันโรคและแมลงแบบประหยัด", "ช่องทางขายผักในพื้นที่"],
    equipment: ["บัวรดน้ำ", "จอบ/เสียม", "เมล็ดพันธุ์", "ปุ๋ยอินทรีย์"],
    relatedTools: PLANT_TOOLS,
    relatedArticles: PLANT_ARTICLES,
  },
  {
    id: "herb-processed",
    name: "ปลูกพืชสมุนไพร/แปรรูปขายออนไลน์",
    category: "plants",
    interestMatch: ["พืชผัก/ไม้ผล", "แบบผสมผสาน"],
    minLandRai: 0,
    maxLandRai: 2,
    minBudget: 2000,
    maxBudget: 20000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน", "วันหยุดเท่านั้น"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)"],
    purposeFit: ["รายได้เสริม"],
    budgetRange: "2,000 - 20,000 บาท",
    timeToFirstYield: "ประมาณ 3-6 เดือน (รวมช่วงแปรรูป/สร้างช่องทางขาย)",
    workload: "ปานกลาง ต้องแบ่งเวลาทั้งปลูกและแปรรูป/ขาย",
    risk: "ต้องใช้ทักษะด้านการตลาดควบคู่ไปกับการปลูก หากขายไม่ออกอาจสต๊อกสินค้าค้าง",
    whatToStudy: ["การแปรรูปเบื้องต้นและมาตรฐานความสะอาด", "การขายผ่านช่องทางออนไลน์", "บรรจุภัณฑ์และการตั้งราคา"],
    equipment: ["อุปกรณ์ตากแห้ง/อบ", "บรรจุภัณฑ์", "เครื่องชั่ง"],
    relatedTools: PLANT_TOOLS,
    relatedArticles: PLANT_ARTICLES,
  },
  {
    id: "fruit-orchard",
    name: "ปลูกไม้ผลยืนต้น (เช่น มะม่วง มะนาว)",
    category: "plants",
    interestMatch: ["พืชผัก/ไม้ผล"],
    minLandRai: 2,
    maxLandRai: 20,
    minBudget: 20000,
    maxBudget: 150000,
    waterNeed: ["มีน้ำตลอดปี"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ระยะยาว(มากกว่า1ปี)"],
    purposeFit: ["เป็นอาชีพหลัก", "รายได้เสริม"],
    budgetRange: "20,000 - 150,000 บาท",
    timeToFirstYield: "ประมาณ 1.5-3 ปีจึงเริ่มเก็บผลผลิตได้เต็มที่",
    workload: "ปานกลาง-หนักช่วงเตรียมแปลงแรก จากนั้นดูแลตามฤดูกาล",
    risk: "ใช้เวลานานกว่าจะคืนทุน และผลผลิตปีแรก ๆ อาจยังไม่เต็มที่ ควรวางแผนกระแสเงินสดระยะยาว",
    whatToStudy: ["การเลือกพันธุ์และระยะปลูกที่เหมาะสม", "การจัดการทรงพุ่มและให้ปุ๋ยตามช่วงอายุ", "แนวโน้มราคาผลไม้ในพื้นที่"],
    equipment: ["ระบบน้ำหยด/สปริงเกลอร์", "กรรไกรตัดแต่งกิ่ง", "ปุ๋ยคอก/ปุ๋ยเคมี"],
    relatedTools: PLANT_TOOLS,
    relatedArticles: PLANT_ARTICLES,
  },
  {
    id: "field-crop-rice",
    name: "ปลูกพืชไร่/นาข้าว",
    category: "plants",
    interestMatch: ["พืชผัก/ไม้ผล"],
    minLandRai: 5,
    maxLandRai: 100,
    minBudget: 15000,
    maxBudget: 120000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)", "ระยะยาว(มากกว่า1ปี)"],
    purposeFit: ["เป็นอาชีพหลัก"],
    budgetRange: "15,000 - 120,000 บาท ต่อรอบ (ขึ้นกับพื้นที่)",
    timeToFirstYield: "ประมาณ 3-4 เดือนต่อรอบเพาะปลูก",
    workload: "หนักช่วงเตรียมดินและเก็บเกี่ยว ต้องอาศัยแรงงาน/เครื่องจักรร่วมด้วย",
    risk: "ราคาพืชผลผันผวนตามตลาดโลก/นโยบายรัฐ และต้องพึ่งพาสภาพอากาศ ควรศึกษาประกันภัยพืชผลเพิ่มเติม",
    whatToStudy: ["การเตรียมดินและเลือกพันธุ์ตามพื้นที่", "การบริหารต้นทุนเครื่องจักร/แรงงาน", "ช่องทางขายและโรงสี/พ่อค้าคนกลาง"],
    equipment: ["เครื่องมือเตรียมดิน", "ปุ๋ยตามค่าดิน", "อุปกรณ์เก็บเกี่ยว"],
    relatedTools: PLANT_TOOLS,
    relatedArticles: PLANT_ARTICLES,
  },
  {
    id: "egg-layer-chicken",
    name: "เลี้ยงไก่ไข่",
    category: "animals",
    interestMatch: ["ปศุสัตว์", "แบบผสมผสาน"],
    minLandRai: 0,
    maxLandRai: 3,
    minBudget: 5000,
    maxBudget: 40000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล", "ไม่แน่ใจ"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["ไม่มีประสบการณ์", "เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)"],
    purposeFit: ["เพื่อบริโภคเอง", "รายได้เสริม"],
    budgetRange: "5,000 - 40,000 บาท",
    timeToFirstYield: "ประมาณ 4-5 เดือน (ไก่เริ่มไข่)",
    workload: "ปานกลาง ให้อาหาร/เก็บไข่/ทำความสะอาดโรงเรือนทุกวัน",
    risk: "โรคระบาดในสัตว์ปีกและราคาไข่ผันผวน ควรมีระบบป้องกันโรคและวางแผนตลาดล่วงหน้า",
    whatToStudy: ["การจัดการโรงเรือนและสุขาภิบาล", "สูตรอาหารและต้นทุนต่อฟอง", "ช่องทางขายไข่ในพื้นที่"],
    equipment: ["โรงเรือน/กรงไก่", "รางอาหาร-น้ำ", "อุปกรณ์ทำความสะอาด"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: ANIMAL_ARTICLES,
  },
  {
    id: "broiler-native-chicken",
    name: "เลี้ยงไก่เนื้อ/ไก่บ้าน",
    category: "animals",
    interestMatch: ["ปศุสัตว์", "แบบผสมผสาน"],
    minLandRai: 0,
    maxLandRai: 3,
    minBudget: 3000,
    maxBudget: 30000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล", "ไม่แน่ใจ"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน", "วันหยุดเท่านั้น"],
    experienceNeed: ["ไม่มีประสบการณ์", "เคยลองทำ"],
    incomeSpeed: ["เร็ว(น้อยกว่า 6 เดือน)"],
    purposeFit: ["เพื่อบริโภคเอง", "รายได้เสริม"],
    budgetRange: "3,000 - 30,000 บาท",
    timeToFirstYield: "ประมาณ 2-3.5 เดือนต่อรุ่น",
    workload: "ปานกลาง ให้อาหารวันละ 2-3 มื้อ ดูแลอุณหภูมิโรงเรือนช่วงลูกไก่เล็ก",
    risk: "อัตราการรอดของลูกไก่ขึ้นกับการจัดการโรงเรือน และราคาขายอาจแกว่งตามช่วงเทศกาล",
    whatToStudy: ["การกกลูกไก่และควบคุมอุณหภูมิ", "สูตรอาหารตามช่วงอายุ", "รอบการเลี้ยงและวางแผนขายล่วงหน้า"],
    equipment: ["โรงเรือน/คอกไก่", "เครื่องกกไฟ", "รางอาหาร-น้ำ"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: ANIMAL_ARTICLES,
  },
  {
    id: "pig-pit-farming",
    name: "เลี้ยงหมูหลุม/สุกร",
    category: "animals",
    interestMatch: ["ปศุสัตว์"],
    minLandRai: 1,
    maxLandRai: 10,
    minBudget: 30000,
    maxBudget: 180000,
    waterNeed: ["มีน้ำตลอดปี"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)"],
    purposeFit: ["เป็นอาชีพหลัก", "รายได้เสริม"],
    budgetRange: "30,000 - 180,000 บาท",
    timeToFirstYield: "ประมาณ 5-6 เดือนต่อรุ่น",
    workload: "หนัก ต้องดูแลใกล้ชิดทุกวัน ทั้งอาหารและสุขภาพสัตว์",
    risk: "เสี่ยงต่อโรคระบาดในสุกรและต้นทุนอาหารที่ผันผวน ควรศึกษามาตรการป้องกันโรคอย่างเข้มงวด",
    whatToStudy: ["ระบบความปลอดภัยทางชีวภาพ (biosecurity)", "สูตรอาหารและการจัดการมูลสัตว์", "สัญญาซื้อขายกับโรงชำแหละ/พ่อค้า"],
    equipment: ["คอก/หลุมเลี้ยง", "รางอาหาร-น้ำอัตโนมัติ", "อุปกรณ์ทำความสะอาด/ฆ่าเชื้อ"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: ANIMAL_ARTICLES,
  },
  {
    id: "goat-sheep",
    name: "เลี้ยงแพะ/แกะ",
    category: "animals",
    interestMatch: ["ปศุสัตว์"],
    minLandRai: 3,
    maxLandRai: 30,
    minBudget: 20000,
    maxBudget: 100000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ระยะยาว(มากกว่า1ปี)"],
    purposeFit: ["เป็นอาชีพหลัก", "รายได้เสริม"],
    budgetRange: "20,000 - 100,000 บาท",
    timeToFirstYield: "ประมาณ 8-12 เดือน",
    workload: "ปานกลาง ต้องมีพื้นที่แทะเล็มหรือแปลงหญ้าเลี้ยงสัตว์",
    risk: "ตลาดรับซื้อในบางพื้นที่ยังจำกัด ควรสำรวจแหล่งรับซื้อก่อนขยายฝูง",
    whatToStudy: ["การจัดการแปลงหญ้า/อาหารหยาบ", "การป้องกันพยาธิและโรคทั่วไป", "ช่องทางขายและแหล่งรับซื้อในพื้นที่"],
    equipment: ["คอกพักสัตว์", "รั้วกั้นแปลงหญ้า", "อุปกรณ์ถ่ายพยาธิ"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: ANIMAL_ARTICLES,
  },
  {
    id: "catfish-pond",
    name: "เลี้ยงปลาดุกในบ่อ/บ่อพลาสติก",
    category: "fishery",
    interestMatch: ["ประมง/สัตว์น้ำ", "แบบผสมผสาน"],
    minLandRai: 0,
    maxLandRai: 2,
    minBudget: 5000,
    maxBudget: 40000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน", "วันหยุดเท่านั้น"],
    experienceNeed: ["ไม่มีประสบการณ์", "เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)"],
    purposeFit: ["เพื่อบริโภคเอง", "รายได้เสริม"],
    budgetRange: "5,000 - 40,000 บาท",
    timeToFirstYield: "ประมาณ 3-4 เดือนต่อรุ่น",
    workload: "เบา-ปานกลาง ให้อาหารวันละ 2 มื้อ ตรวจคุณภาพน้ำเป็นระยะ",
    risk: "คุณภาพน้ำที่ไม่เหมาะสมอาจทำให้ปลาป่วยหรือตายยกบ่อ ควรหมั่นตรวจสอบและมีระบบถ่ายน้ำสำรอง",
    whatToStudy: ["การจัดการคุณภาพน้ำในบ่อ", "สูตรอาหารและอัตราการให้อาหาร", "ช่องทางขายและราคาตลาดปลาดุก"],
    equipment: ["บ่อพลาสติก/บ่อซีเมนต์", "เครื่องเติมอากาศ", "สวิงตักปลา"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: FISHERY_ARTICLES,
  },
  {
    id: "frog-farming",
    name: "เลี้ยงกบในกระชัง/บ่อซีเมนต์",
    category: "fishery",
    interestMatch: ["ประมง/สัตว์น้ำ"],
    minLandRai: 0,
    maxLandRai: 1,
    minBudget: 3000,
    maxBudget: 25000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ไม่กี่ชั่วโมง/วัน", "ครึ่งวัน"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["เร็ว(น้อยกว่า 6 เดือน)"],
    purposeFit: ["รายได้เสริม"],
    budgetRange: "3,000 - 25,000 บาท",
    timeToFirstYield: "ประมาณ 2.5-3 เดือนต่อรุ่น",
    workload: "ปานกลาง ต้องดูแลความสะอาดบ่อและป้องกันกบกินกันเอง",
    risk: "กบไวต่อโรคและคุณภาพน้ำ อัตราการรอดอาจไม่แน่นอนในผู้เลี้ยงมือใหม่",
    whatToStudy: ["การคัดขนาดกบเพื่อลดการกินกันเอง", "การจัดการน้ำและความหนาแน่นในบ่อ", "แหล่งรับซื้อกบในพื้นที่"],
    equipment: ["กระชัง/บ่อซีเมนต์", "ตาข่ายกันหนี", "ถังเลี้ยงปลา/อนุบาลลูกกบ"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: FISHERY_ARTICLES,
  },
  {
    id: "tilapia-earthen-pond",
    name: "เลี้ยงปลานิลในบ่อดิน",
    category: "fishery",
    interestMatch: ["ประมง/สัตว์น้ำ"],
    minLandRai: 1,
    maxLandRai: 15,
    minBudget: 15000,
    maxBudget: 100000,
    waterNeed: ["มีน้ำตลอดปี"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)", "ระยะยาว(มากกว่า1ปี)"],
    purposeFit: ["เป็นอาชีพหลัก", "รายได้เสริม"],
    budgetRange: "15,000 - 100,000 บาท",
    timeToFirstYield: "ประมาณ 6-8 เดือนต่อรุ่น",
    workload: "ปานกลาง-หนักช่วงขุดบ่อและจับปลา จากนั้นดูแลตามรอบให้อาหาร",
    risk: "ต้องใช้แหล่งน้ำที่เพียงพอตลอดรอบเลี้ยง และราคาปลานิลอาจแกว่งตามฤดูกาลจับปลา",
    whatToStudy: ["การเตรียมบ่อดินและคุณภาพน้ำ", "อัตราปล่อยลูกปลาต่อพื้นที่", "ช่องทางขายส่ง/ขายปลีก"],
    equipment: ["บ่อดิน", "เครื่องให้อาหารปลา", "อวน/สวิงจับปลา"],
    relatedTools: ANIMAL_TOOLS,
    relatedArticles: FISHERY_ARTICLES,
  },
  {
    id: "mixed-veggie-chicken-pond",
    name: "เกษตรผสมผสาน (ผัก + ไก่ไข่ + บ่อปลา)",
    category: "mixed-farming",
    interestMatch: ["แบบผสมผสาน", "พืชผัก/ไม้ผล", "ปศุสัตว์", "ประมง/สัตว์น้ำ"],
    minLandRai: 1,
    maxLandRai: 15,
    minBudget: 15000,
    maxBudget: 120000,
    waterNeed: ["มีน้ำตลอดปี", "มีน้ำตามฤดูกาล"],
    timeNeed: ["ครึ่งวัน", "เต็มเวลา"],
    experienceNeed: ["เคยลองทำ", "มีประสบการณ์"],
    incomeSpeed: ["ปานกลาง(6-12 เดือน)", "ระยะยาว(มากกว่า1ปี)"],
    purposeFit: ["เป็นอาชีพหลัก", "รายได้เสริม", "เพื่อบริโภคเอง"],
    budgetRange: "15,000 - 120,000 บาท",
    timeToFirstYield: "ประมาณ 4-8 เดือน (ทยอยมีผลผลิตจากแต่ละส่วน)",
    workload: "หนัก ต้องแบ่งเวลาดูแลหลายกิจกรรมพร้อมกัน แต่ช่วยกระจายความเสี่ยงด้านรายได้",
    risk: "ต้องบริหารจัดการหลายกิจกรรมพร้อมกัน หากวางแผนไม่ดีอาจดูแลได้ไม่ทั่วถึง",
    whatToStudy: ["หลักเกษตรทฤษฎีใหม่/ผสมผสานเบื้องต้น", "การวางผังฟาร์มให้ทรัพยากรหมุนเวียนกัน", "การบริหารเวลาและแรงงานในฟาร์ม"],
    equipment: ["บัวรดน้ำ", "โรงเรือนไก่ขนาดเล็ก", "บ่อปลา/ถังเลี้ยงปลา"],
    relatedTools: MIXED_TOOLS,
    relatedArticles: MIXED_ARTICLES,
  },
];

function clampNumber(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function inRange(v: number, min: number, max: number): boolean {
  return v >= min && v <= max;
}

function scoreCandidate(
  c: Candidate,
  input: FarmPlannerInput,
): { score: number; reasons: string[] } {
  const land = clampNumber(input.landSizeRai);
  const budget = clampNumber(input.budget);
  const reasons: string[] = [];
  let score = 0;

  if (c.interestMatch.includes(input.interest)) {
    score += 2;
    reasons.push(`ตรงกับความสนใจด้าน${input.interest}ที่เลือกไว้`);
  }

  if (inRange(land, c.minLandRai, c.maxLandRai)) {
    score += 1;
    reasons.push(`เหมาะกับขนาดพื้นที่ประมาณ ${land || 0} ไร่ที่มีอยู่`);
  }

  if (inRange(budget, c.minBudget, c.maxBudget)) {
    score += 1;
    reasons.push("งบเริ่มต้นที่มีอยู่ในช่วงที่พอเริ่มต้นได้จริง");
  } else if (budget > c.maxBudget) {
    score += 0.5;
  }

  if (c.waterNeed.includes(input.waterSource)) {
    score += 1;
    reasons.push(`สอดคล้องกับแหล่งน้ำที่มี (${input.waterSource})`);
  }

  if (c.timeNeed.includes(input.timeAvailable)) {
    score += 1;
    reasons.push(`ใช้เวลาต่อวันสอดคล้องกับเวลาที่สะดวก (${input.timeAvailable})`);
  }

  if (c.experienceNeed.includes(input.experience)) {
    score += 1;
    reasons.push("ระดับความยากสอดคล้องกับประสบการณ์ปัจจุบัน");
  }

  if (c.incomeSpeed.includes(input.incomeSpeed)) {
    score += 1;
    reasons.push(`ระยะเวลาก่อนมีผลผลิต/รายได้ใกล้เคียงกับที่ต้องการ (${input.incomeSpeed})`);
  }

  if (c.purposeFit.includes(input.purpose)) {
    score += 0.5;
  }

  return { score, reasons };
}

/**
 * Rule-based, static-data matching only (no AI/API calls). Always returns
 * between 1 and 3 ranked options — if fewer than 3 candidates clear a
 * reasonable score threshold, it relaxes and still ranks up to 3 rather
 * than returning zero.
 */
export function recommendFarmingOptions(input: FarmPlannerInput): FarmPlannerOption[] {
  const scored = CANDIDATES.map((c, index) => ({
    candidate: c,
    index,
    ...scoreCandidate(c, input),
  }));

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const top = scored.slice(0, 3);

  return top.map(({ candidate, reasons, score }) => {
    const whyItFits =
      reasons.length > 0
        ? reasons.slice(0, 3).join(" ")
        : "เป็นอีกทางเลือกที่ควรศึกษาเพิ่มเติม แม้ยังไม่ตรงเงื่อนไขทั้งหมดที่กรอกไว้";

    return {
      id: candidate.id,
      name: candidate.name,
      category: candidate.category,
      whyItFits,
      keyConditions: [
        `พื้นที่แนะนำ ${candidate.minLandRai}-${candidate.maxLandRai} ไร่`,
        `งบเริ่มต้นโดยประมาณ ${candidate.budgetRange}`,
      ],
      budgetRange: candidate.budgetRange,
      timeToFirstYield: candidate.timeToFirstYield,
      workload: candidate.workload,
      risk: candidate.risk,
      whatToStudy: candidate.whatToStudy,
      relatedTools: candidate.relatedTools,
      relatedArticles: candidate.relatedArticles,
      equipment: candidate.equipment,
      matchScore: score,
    };
  });
}
