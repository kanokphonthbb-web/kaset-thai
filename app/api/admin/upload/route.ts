import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_WIDTH = 1600; // ย่อให้กว้างไม่เกินนี้เพื่อลดขนาดไฟล์

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะรูปภาพ" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // GIF: เก็บไฟล์เดิม (รักษาภาพเคลื่อนไหว) · อื่น ๆ: ย่อ + แปลงเป็น webp
    let out: Buffer;
    let name: string;
    let contentType: string;
    if (file.type === "image/gif") {
      out = input;
      name = `${base}.gif`;
      contentType = "image/gif";
    } else {
      out = await sharp(input)
        .rotate() // แก้การหมุนตาม EXIF
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      name = `${base}.webp`;
      contentType = "image/webp";
    }

    // Production: Vercel Blob (persist ได้บน serverless) — เปิดใช้เมื่อมี BLOB_READ_WRITE_TOKEN
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${name}`, out, {
        access: "public",
        contentType,
      });
      return NextResponse.json({ url: blob.url, size: out.length });
    }

    // Dev / self-host: เขียนลง /public/uploads
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), out);
    return NextResponse.json({ url: `/uploads/${name}`, size: out.length });
  } catch {
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
