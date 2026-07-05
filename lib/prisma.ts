import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;

  // Production: Turso / libSQL (persist บน serverless เช่น Vercel)
  if (url) {
    // require แบบ dynamic เพื่อไม่ให้ dev ที่ใช้ SQLite ไฟล์ต้องโหลด adapter
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const { createClient } = require("@libsql/client");
    const libsql = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  // Dev: SQLite ไฟล์ (prisma/dev.db)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
