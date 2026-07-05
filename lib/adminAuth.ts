// ─────────────────────────────────────────────────────────────
// Admin auth (อีเมล + รหัสผ่านเดียว) — edge-compatible (ใช้ใน middleware ได้)
// ตั้งค่าใน .env: ADMIN_EMAIL, ADMIN_PASSWORD (และ AUTH_SECRET ถ้าต้องการ)
// ถ้าไม่ตั้ง ADMIN_PASSWORD = auth ปิด (โหมด dev เข้าได้เลย)
// ─────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = "kaset_admin";

export function isAuthConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

/** สร้าง token จากอีเมล+รหัส (SHA-256) — เก็บใน cookie แทนรหัสจริง */
export async function computeToken(email: string, password: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "kaset-thai-admin-v1";
  const data = new TextEncoder().encode(`${email}:${password}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** token ที่คาดหวังจาก env (null = auth ปิด) */
export async function expectedToken(): Promise<string | null> {
  const email = process.env.ADMIN_EMAIL ?? "";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return computeToken(email, password);
}

export function checkCredentials(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!p) return false;
  // เทียบตรง ๆ (ผู้ใช้เดียว) — email ว่างใน env = ไม่ตรวจอีเมล
  const emailOk = e === "" || email.trim().toLowerCase() === e.trim().toLowerCase();
  return emailOk && password === p;
}
