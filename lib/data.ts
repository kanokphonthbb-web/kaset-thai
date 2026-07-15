// ─────────────────────────────────────────────────────────────
// Central content model for เกษตรกรไทย
// ต่อยอดเป็นเว็บบทความ SEO ขนาดใหญ่ได้ในอนาคต โดยเพิ่มข้อมูลในไฟล์นี้
// ─────────────────────────────────────────────────────────────

import { DISEASES } from "./diseaseData";
import { CROPS } from "./cropCalendar";

export type Category = {
  slug: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  tags: string[];
};

export type Tool = {
  icon: string;
  title: string;
  description: string;
  href: string;
  status: "พร้อมใช้เร็ว ๆ นี้" | "พร้อมใช้งาน";
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  categoryHref: string;
  description: string;
  readMinutes: number;
  emoji: string;
};

export const NAV_LINKS = [
  { label: "ปลูกพืช", href: "/plants" },
  { label: "เลี้ยงสัตว์", href: "/animals" },
  { label: "ประมง", href: "/fishery" },
  { label: "เกษตรผสมผสาน", href: "/mixed-farming" },
  { label: "โรคและการดูแล", href: "/diseases" },
  { label: "ต้นทุนกำไร", href: "/cost-profit" },
  { label: "ตลาดเกษตร", href: "/market" },
  { label: "เทคโนโลยี", href: "/agri-tech-tools" },
  { label: "ข่าว/กฎหมาย", href: "/agri-news-law-standards" },
  { label: "สินค้าเพื่อการเกษตร", href: "/products" },
];

export const CATEGORIES: Category[] = [
  {
    slug: "plants",
    href: "/plants",
    icon: "🌱",
    title: "ปลูกพืช",
    description: "ข้าว ผัก ผลไม้ พืชไร่ สมุนไพร ไม้เศรษฐกิจ วิธีปลูกและดูแล",
    tags: ["ข้าว", "ผัก", "ผลไม้"],
  },
  {
    slug: "animals",
    href: "/animals",
    icon: "🐔",
    title: "เลี้ยงสัตว์",
    description: "ไก่ เป็ด หมู วัว ควาย แพะ โคนม โรงเรือน อาหาร และโรคสัตว์",
    tags: ["ไก่ไข่", "วัว", "หมู"],
  },
  {
    slug: "fishery",
    href: "/fishery",
    icon: "🐟",
    title: "ประมง",
    description: "ปลาดุก ปลานิล กบ กุ้ง ปูนา การทำบ่อ และการดูแลน้ำ",
    tags: ["ปลาดุก", "ปลานิล", "กบ"],
  },
  {
    slug: "mixed-farming",
    href: "/mixed-farming",
    icon: "🚜",
    title: "เกษตรผสมผสาน",
    description: "ปลูกพืช เลี้ยงสัตว์ ทำบ่อปลา ลดต้นทุน และใช้พื้นที่ให้คุ้ม",
    tags: ["1 ไร่", "พอเพียง", "ฟาร์มเล็ก"],
  },
  {
    slug: "diseases",
    href: "/diseases",
    icon: "🦠",
    title: "โรคและการดูแล",
    description: "โรคพืช แมลงศัตรูพืช โรคไก่ โรควัวควาย วิธีป้องกันเบื้องต้น",
    tags: ["โรคพืช", "ศัตรูพืช", "โรคสัตว์"],
  },
  {
    slug: "cost-profit",
    href: "/cost-profit",
    icon: "💰",
    title: "ต้นทุนและกำไร",
    description: "คำนวณต้นทุน กำไร จุดคุ้มทุน และเปรียบเทียบอาชีพเกษตร",
    tags: ["ต้นทุน", "กำไร", "คืนทุน"],
  },
  {
    slug: "market",
    href: "/market",
    icon: "🛒",
    title: "ตลาดและการขาย",
    description: "ราคาสินค้าเกษตร ช่องทางขาย การแปรรูป และขายออนไลน์",
    tags: ["ขายส่ง", "ออนไลน์", "แปรรูป"],
  },
  {
    slug: "soil-water-fertilizer",
    href: "/soil-water-fertilizer",
    icon: "🧪",
    title: "ดิน น้ำ ปุ๋ย",
    description: "ปรับปรุงดิน ระบบน้ำ ปุ๋ยอินทรีย์ ปุ๋ยเคมี และสูตรอาหารสัตว์",
    tags: ["ดิน", "น้ำ", "ปุ๋ย"],
  },
  {
    slug: "agri-tech-tools",
    href: "/agri-tech-tools",
    icon: "⚙️",
    title: "เทคโนโลยีและเครื่องมือ",
    description: "เครื่องมือเกษตร โดรน เซนเซอร์ ระบบน้ำอัตโนมัติ และ Smart Farm",
    tags: ["Smart Farm", "โดรน", "IoT"],
  },
  {
    slug: "agri-news-law-standards",
    href: "/agri-news-law-standards",
    icon: "📋",
    title: "ข่าว กฎหมาย มาตรฐาน",
    description: "ข่าวเกษตร กฎหมาย หน่วยงาน มาตรฐาน GAP อินทรีย์ และขั้นตอนราชการ",
    tags: ["GAP", "กฎหมาย", "มาตรฐาน"],
  },
];

export const TOOLS: Tool[] = [
  {
    icon: "📊",
    title: "คำนวณต้นทุนปลูกพืช",
    description: "ใส่พื้นที่ ค่าเมล็ดพันธุ์ ปุ๋ย แรงงาน แล้วดูจุดคุ้มทุน",
    href: "/tools/plant-cost",
    status: "พร้อมใช้งาน",
  },
  {
    icon: "🐖",
    title: "คำนวณต้นทุนเลี้ยงสัตว์",
    description: "ประเมินค่าพันธุ์ อาหาร โรงเรือน และกำไรต่อรอบ",
    href: "/tools/animal-cost",
    status: "พร้อมใช้งาน",
  },
  {
    icon: "🗓️",
    title: "ปฏิทินเพาะปลูก",
    description: "ดูช่วงเวลาปลูกพืชแต่ละชนิดให้เหมาะกับฤดูกาล",
    href: "/tools/calendar",
    status: "พร้อมใช้งาน",
  },
  {
    icon: "🔎",
    title: "เช็กโรคเบื้องต้น",
    description: "เลือกอาการที่พบ แล้วดูแนวทางดูแลและป้องกัน",
    href: "/tools/disease-check",
    status: "พร้อมใช้งาน",
  },
];

export const ARTICLES: Article[] = [
  {
    slug: "raising-laying-hens-for-beginners",
    title: "เลี้ยงไก่ไข่สำหรับมือใหม่ เริ่มกี่ตัวถึงคุ้มทุน",
    category: "เลี้ยงสัตว์",
    categoryHref: "/animals",
    description:
      "เลี้ยงไก่ไข่เริ่มกี่ตัวถึงคุ้มทุน? สรุปจำนวนไก่ที่เหมาะกับมือใหม่ โรงเรือน อาหาร โรคที่ต้องระวัง ต้นทุน-รายได้โดยประมาณ และวิธีขายไข่ในชุมชนให้มีรายได้เสริม",
    readMinutes: 8,
    emoji: "🐔",
  },
  {
    slug: "home-vegetable-garden-for-beginners",
    title: "ปลูกผักสวนครัวสำหรับมือใหม่ ใช้พื้นที่น้อยก็เริ่มได้",
    category: "ปลูกพืช",
    categoryHref: "/plants",
    description:
      "ปลูกผักสวนครัวกินเองสำหรับมือใหม่ เลือกผักที่ปลูกง่าย เตรียมดิน รดน้ำ ใส่ปุ๋ย ป้องกันแมลงแบบปลอดภัย พร้อมอายุเก็บเกี่ยวและเคล็ดลับให้มีผักกินตลอดปี",
    readMinutes: 7,
    emoji: "🥬",
  },
  {
    slug: "beef-cattle-startup-budget",
    title: "เลี้ยงวัวเนื้อเริ่มต้นต้องใช้งบเท่าไหร่",
    category: "วัวควาย",
    categoryHref: "/animals",
    description:
      "เลี้ยงวัวเนื้อเริ่มต้นใช้งบเท่าไหร่ สรุปงบลงทุนจริง ค่าพันธุ์วัว คอก อาหารหยาบ-อาหารข้น วัคซีน โรคที่ต้องระวัง พร้อมวิธีวางแผนขายให้คุ้มทุนและได้กำไร",
    readMinutes: 9,
    emoji: "🐄",
  },
  {
    slug: "rice-cost-per-rai",
    title: "ต้นทุนปลูกข้าว 1 ไร่ เท่าไหร่ กำไรจริงแค่ไหน",
    category: "ต้นทุนเกษตร",
    categoryHref: "/cost-profit",
    description:
      "เจาะต้นทุนปลูกข้าว 1 ไร่ ทั้งเมล็ดพันธุ์ ปุ๋ย ค่าแรง ค่าน้ำ พร้อมผลผลิตที่ควรคาดหวังและวิธีลดต้นทุนให้เหลือกำไรมากขึ้น เหมาะกับคนอยากรู้ตัวเลขก่อนลงมือทำนา",
    readMinutes: 7,
    emoji: "🌾",
  },
  {
    slug: "catfish-in-cement-pond",
    title: "เลี้ยงปลาดุกในบ่อปูนสำหรับมือใหม่",
    category: "ประมง",
    categoryHref: "/fishery",
    description:
      "สอนเลี้ยงปลาดุกในบ่อปูนแบบมือใหม่ทำตามได้จริง ตั้งแต่บ่มบ่อ ปล่อยลูกปลา ให้อาหาร ดูแลคุณภาพน้ำ ป้องกันโรค จับขาย พร้อมตารางต้นทุน-รายได้และคำถามที่พบบ่อย",
    readMinutes: 8,
    emoji: "🐟",
  },
  {
    slug: "integrated-farming-1-rai",
    title: "เกษตรผสมผสาน 1 ไร่ ทำอะไรได้บ้าง",
    category: "เกษตรผสมผสาน",
    categoryHref: "/mixed-farming",
    description:
      "เกษตรผสมผสาน 1 ไร่ ทำอะไรได้บ้าง แบ่งพื้นที่ยังไง เลือกพืชและสัตว์ให้เกื้อกูลกัน หมุนเวียนของเสียเป็นทุน ลดต้นทุน กระจายความเสี่ยง เริ่มต้นแบบไม่เหนื่อยเกิน",
    readMinutes: 9,
    emoji: "🚜",
  },
  {
    slug: "before-you-start-farming",
    title: "เตรียมตัวก่อนเริ่มทำเกษตรครั้งแรก ต้องรู้อะไรบ้าง",
    category: "เริ่มต้นทำเกษตร",
    categoryHref: "/mixed-farming",
    description:
      "คู่มือเตรียมตัวก่อนเริ่มทำเกษตรสำหรับมือใหม่ ประเมินพื้นที่ น้ำ ทุน เวลา เลือกสิ่งที่จะปลูกหรือเลี้ยง คำนวณต้นทุน วางแผนขาย และข้อผิดพลาดที่ควรเลี่ยง",
    readMinutes: 8,
    emoji: "🌱",
  },
];

export function statsFor(articleCount: number) {
  return [
    { value: "8+", label: "หมวดหลัก", hint: "ครอบคลุมงานเกษตรทุกด้าน" },
    {
      value: `${articleCount}+`,
      label: "หัวข้อความรู้เกษตร",
      hint: "กำลังทยอยเพิ่มต่อเนื่อง",
    },
    { value: "อ่านง่าย", label: "สำหรับคนไทย", hint: "ภาษาชัด ทำตามได้จริง" },
  ];
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

// ─────────────────────────────────────────────────────────────
// รูปภาพจริง (Unsplash) — เก็บเป็น photo id, ประกอบ URL ด้วย unsplashUrl()
// ตรวจสอบแล้วว่าตรงหัวข้อ (ไก่จริง, นาข้าวจริง ฯลฯ)
// ─────────────────────────────────────────────────────────────
export const IMAGES: Record<string, string> = {
  // หมวดหลัก (key = category slug)
  plants: "1728895604559-a4e16081504e",
  animals: "1548550023-2bdb3c5beed7",
  fishery: "1541441056316-443fff347c40",
  "mixed-farming": "1677741447046-2021fb219d3e",
  diseases: "1692481060581-98c224124f12",
  "cost-profit": "1505471768190-275e2ad7b3f9",
  market: "1579113800032-c38bd7635818",
  "soil-water-fertilizer": "1611843467160-25afb8df1074",
  // บทความ (key = article slug)
  "raising-laying-hens-for-beginners": "https://images.pexels.com/photos/34185946/pexels-photo-34185946.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "home-vegetable-garden-for-beginners": "https://images.pexels.com/photos/14007005/pexels-photo-14007005.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "beef-cattle-startup-budget": "1618080206739-14e8ac105472",
  "rice-cost-per-rai": "https://images.pexels.com/photos/32200256/pexels-photo-32200256.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "catfish-in-cement-pond": "https://images.pexels.com/photos/166633/pexels-photo-166633.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "integrated-farming-1-rai": "https://images.pexels.com/photos/2698449/pexels-photo-2698449.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "before-you-start-farming": "https://images.pexels.com/photos/26833033/pexels-photo-26833033.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "agri-tech-tools": "https://images.pexels.com/photos/9963140/pexels-photo-9963140.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "agri-news-law-standards": "https://images.pexels.com/photos/32834464/pexels-photo-32834464.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

export const HERO_IMAGE = "1505471768190-275e2ad7b3f9"; // ชาวนาไทยดำนา

/** ประกอบ URL รูปจาก photo id (Unsplash) หรือคืน URL เต็มตรงๆ ถ้าเป็น Pexels (คืน null ถ้าไม่มี id) */
export function unsplashUrl(id: string | undefined, w = 800): string | null {
  if (!id) return null;
  if (id.startsWith("http")) return id;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** รูปตาม slug (หมวดหรือบทความ) */
export function imageFor(slug: string, w = 800): string | null {
  return unsplashUrl(IMAGES[slug], w);
}

// ─────────────────────────────────────────────────────────────
// Search — รวมหมวด บทความ และเครื่องมือเป็นดัชนีเดียว
// ค้นแบบ substring + keyword ภาษาไทย (ไม่ต้องพึ่ง service ภายนอก)
// ─────────────────────────────────────────────────────────────

export type SearchResult = {
  type: "หมวด" | "บทความ" | "เครื่องมือ" | "โรค" | "พืช";
  title: string;
  description: string;
  href: string;
  icon: string;
};

const SEARCH_INDEX: (SearchResult & { keywords: string })[] = [
  ...CATEGORIES.map((c) => ({
    type: "หมวด" as const,
    title: c.title,
    description: c.description,
    href: c.href,
    icon: c.icon,
    keywords: `${c.title} ${c.description} ${c.tags.join(" ")}`,
  })),
  ...ARTICLES.map((a) => ({
    type: "บทความ" as const,
    title: a.title,
    description: a.description,
    href: `/articles/${a.slug}`,
    icon: a.emoji,
    keywords: `${a.title} ${a.description} ${a.category}`,
  })),
  ...TOOLS.map((t) => ({
    type: "เครื่องมือ" as const,
    title: t.title,
    description: t.description,
    href: t.href,
    icon: t.icon,
    keywords: `${t.title} ${t.description}`,
  })),
  // คลังโรค (ลิงก์ไปเครื่องมือเช็กโรค)
  ...DISEASES.map((d) => ({
    type: "โรค" as const,
    title: d.name,
    description: `${d.group} · ${d.signs}`,
    href: `/tools/disease-check?d=${encodeURIComponent(d.name)}`,
    icon: "🦠",
    keywords: `${d.name} ${d.aka ?? ""} ${d.group} ${d.signs} ${d.cause}`,
  })),
  // ปฏิทินพืช (ลิงก์ไปปฏิทินเพาะปลูก)
  ...CROPS.map((c) => ({
    type: "พืช" as const,
    title: c.name,
    description: `${c.type} · ${c.harvest} · ${c.note}`,
    href: `/tools/calendar?c=${encodeURIComponent(c.name)}`,
    icon: c.emoji,
    keywords: `${c.name} ${c.type} ปลูก${c.name} ${c.note}`,
  })),
];

export function searchContent(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  return SEARCH_INDEX.map((item) => {
    const title = item.title.toLowerCase();
    const haystack = `${title} ${item.keywords}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 3; // คำค้นอยู่ในชื่อ
      if (haystack.includes(term)) score += 1; // คำค้นอยู่ใน keyword
      // ทิศกลับ: คำค้นยาวกว่าและครอบชื่อ เช่น "ปลูกทุเรียน" ⊃ "ทุเรียน"
      if (term.length >= 3 && title.length >= 2 && term.includes(title)) score += 3;
    }
    return { item, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => {
      const { keywords, ...rest } = item;
      return rest;
    });
}
