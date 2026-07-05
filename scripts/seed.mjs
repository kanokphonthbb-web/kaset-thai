import { PrismaClient } from "@prisma/client";

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
  // ลบบทความตัวอย่าง/ทดสอบเก่า (pattern เก่าที่ไม่ใช้แล้ว)
  await prisma.article.deleteMany({
    where: { slug: { in: ["ตัวอย่างบทความจากระบบ", "ตัวอย่างบทความสไตล์-html"] } },
  });

  console.log("seed done:", await prisma.article.count(), "articles,", await prisma.articleCategory.count(), "categories");
}

main().finally(() => prisma.$disconnect());
