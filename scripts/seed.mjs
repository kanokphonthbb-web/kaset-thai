import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// ใช้ Turso ถ้ามี env (สำหรับ seed production) ไม่งั้นใช้ SQLite ไฟล์ (dev)
async function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}
const prisma = await makePrisma();

const CATS = [
  ["ปลูกพืช", "plants"],
  ["เลี้ยงสัตว์", "animals"],
  ["ประมง", "fishery"],
  ["เกษตรผสมผสาน", "mixed-farming"],
  ["โรคและการดูแล", "diseases"],
  ["ต้นทุนและกำไร", "cost-profit"],
  ["ตลาดและการขาย", "market"],
];

async function main() {
  for (const [name, slug] of CATS) {
    await prisma.articleCategory.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  // ลบบทความทดสอบเก่า (ถ้ามี) ก่อนเปิดใช้จริง
  await prisma.article.deleteMany({ where: { slug: "ตัวอย่างบทความจากระบบ" } });

  // ── บทความตัวอย่างสไตล์ rich HTML (โหมด HTML) จากไฟล์ template ──
  const raw = readFileSync(new URL("../templates/article-template.html", import.meta.url), "utf8");
  const body = raw.replace(/<script[\s\S]*?<\/script>/gi, "").trim(); // ตัด JSON-LD (CMS สร้างเอง)
  const exFaqs = [
    { q: "เริ่มทำเกษตรครั้งแรกควรเริ่มจากอะไร", a: "เริ่มจากประเมินพื้นที่ แหล่งน้ำ และเวลาที่มี แล้วเลือกพืชหรือสัตว์ที่ดูแลง่ายและมีตลาดรองรับ ทดลองในขนาดเล็กก่อนเพื่อเรียนรู้การจัดการจริงโดยไม่เสี่ยงเงินก้อนใหญ่" },
    { q: "ทำเกษตรมือใหม่ใช้ทุนเท่าไหร่", a: "ขึ้นกับชนิดและขนาด ผักสวนครัวเริ่มได้หลักร้อยถึงหลักพันบาท ส่วนไม้ผลหรือปศุสัตว์ใช้ทุนสูงกว่าและคืนทุนช้ากว่า ควรคำนวณต้นทุนต่อรอบและเผื่อเงินสำรองไว้เสมอ" },
    { q: "ควรปลูกพืชหรือเลี้ยงสัตว์ดีกว่ากันสำหรับมือใหม่", a: "พืชผักรอบสั้นเห็นผลเร็วและดูแลง่ายกว่า เหมาะเริ่มต้น ส่วนสัตว์ต้องดูแลทุกวันและมีความเสี่ยงเรื่องโรค ถ้ามีเวลาน้อยควรเริ่มจากพืชก่อนแล้วค่อยขยาย" },
    { q: "ไม่มีที่ดินของตัวเอง ทำเกษตรได้ไหม", a: "ได้ เริ่มจากปลูกในกระถางหรือพื้นที่เช่าขนาดเล็ก หรือทำเกษตรในเมือง เช่น ผักสลัด ผักสวนครัว ก่อนขยับไปพื้นที่ใหญ่เมื่อมีประสบการณ์และตลาด" },
    { q: "จะรู้ได้อย่างไรว่าปลูกอะไรแล้วขายได้", a: "สำรวจตลาดใกล้บ้าน ร้านค้า และกลุ่มรับซื้อในพื้นที่ก่อน ดูว่าอะไรขายดีและราคานิ่ง แล้วเริ่มจากสิ่งที่มีคนซื้อแน่นอน ค่อยเพิ่มความหลากหลายภายหลัง" },
    { q: "ควรตรวจข้อมูลเกษตรจากแหล่งไหน", a: "ควรอ้างอิงหน่วยงานทางการ เช่น กรมส่งเสริมการเกษตร กรมวิชาการเกษตร กรมปศุสัตว์ และกรมประมง ซึ่งมีข้อมูลพันธุ์ โรค และการดูแลที่เชื่อถือได้และอัปเดต" },
  ];
  await prisma.article.upsert({
    where: { slug: "ตัวอย่างบทความสไตล์-html" },
    update: { content: body, rawHtml: body },
    create: {
      title: "เตรียมตัวก่อนเริ่มทำเกษตรครั้งแรก ต้องรู้อะไรบ้างก่อนลงมือ",
      slug: "ตัวอย่างบทความสไตล์-html",
      excerpt: "คู่มือเตรียมตัวก่อนเริ่มทำเกษตรสำหรับมือใหม่ ประเมินพื้นที่ น้ำ ทุน เวลา เลือกสิ่งที่จะปลูกหรือเลี้ยง คำนวณต้นทุน และวางแผนขาย",
      content: body,
      rawHtml: body,
      format: "html",
      metaDescription: "คู่มือเตรียมตัวก่อนเริ่มทำเกษตรสำหรับมือใหม่ ตั้งแต่ประเมินพื้นที่ น้ำ ทุน เลือกสิ่งที่จะปลูกหรือเลี้ยง คำนวณต้นทุน ไปจนถึงการวางแผนขายและข้อผิดพลาดที่พบบ่อย",
      focusKeyword: "เริ่มทำเกษตร",
      faqJson: JSON.stringify(exFaqs),
      status: "published",
      publishedAt: new Date(),
    },
  });

  console.log("seed done:", await prisma.article.count(), "articles,", await prisma.articleCategory.count(), "categories");
}

main().finally(() => prisma.$disconnect());
