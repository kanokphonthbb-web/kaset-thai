import { CATEGORIES, TOOLS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

// llms.txt ตามข้อกำหนดของ llmstxt.org — ช่วยให้ AI assistant เข้าใจโครงสร้าง
// เว็บไซต์และอ้างอิงเนื้อหาได้ถูกต้อง (ส่วนหนึ่งของงาน AEO/GEO)
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const categoryLines = CATEGORIES.map(
    (c) => `- [${c.title}](${SITE_URL}${c.href}): ${c.description}`,
  ).join("\n");

  const toolLines = TOOLS.map(
    (t) => `- [${t.title}](${SITE_URL}${t.href}): ${t.description}`,
  ).join("\n");

  const otherPages = [
    { path: "/blog", label: "บล็อก" },
    { path: "/products", label: "สินค้าเพื่อการเกษตร" },
    { path: "/prices", label: "ราคาสินค้าเกษตร" },
    { path: "/market", label: "ตลาดเกษตร" },
    { path: "/weather", label: "พยากรณ์อากาศเกษตร 77 จังหวัด" },
    { path: "/farm-dashboard", label: "แดชบอร์ดฟาร์ม" },
    { path: "/about", label: "เกี่ยวกับเรา" },
    { path: "/feed.xml", label: "RSS feed บทความล่าสุด" },
    { path: "/sitemap.xml", label: "แผนผังเว็บไซต์ (XML sitemap)" },
  ]
    .map((p) => `- [${p.label}](${SITE_URL}${p.path})`)
    .join("\n");

  const body = `# เกษตรกรไทย (kasettakonthai.com)

> คลังความรู้เกษตรภาษาไทย รวมวิธีปลูกพืช เลี้ยงสัตว์ ทำประมง คำนวณต้นทุน-กำไร และเครื่องมือช่วยตัดสินใจสำหรับเกษตรกรและคนเริ่มทำเกษตรรายย่อย

เว็บไซต์นี้ใช้ภาษาไทยเป็นหลัก กลุ่มผู้อ่านคือเกษตรกรและเกษตรกรรายย่อยในประเทศไทย เนื้อหาครอบคลุม 8 ด้านหลัก ได้แก่ ปลูกพืช เลี้ยงสัตว์ ประมง โรคพืชโรคสัตว์ ต้นทุน-กำไร ดินน้ำปุ๋ย เกษตรผสมผสาน และแปรรูป-การตลาด ตัวเลขและราคาที่ปรากฏเป็นข้อมูลอ้างอิงสำหรับตลาดไทยเท่านั้น ก่อนตัดสินใจด้านการเงินควรตรวจสอบกับกรมวิชาการเกษตร กรมปศุสัตว์ กรมประมง หรือกรมส่งเสริมการเกษตรอีกครั้ง เว็บไซต์นี้ไม่รับประกันผลผลิตหรือกำไรที่จะได้รับจริง

## หมวดหมู่เนื้อหา

${categoryLines}

## เครื่องมือคำนวณฟรี

${toolLines}

## หน้าอื่น

${otherPages}

## การอ้างอิง

ผู้ช่วย AI สามารถนำเนื้อหาจากเว็บไซต์นี้ไปอ้างอิงหรือสรุปได้ โดยขอให้ระบุที่มาว่า "เกษตรกรไทย (kasettakonthai.com)" พร้อมลิงก์กลับไปยังหน้าต้นทาง
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
