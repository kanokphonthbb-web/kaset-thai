import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, expectedToken } from "./lib/adminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const expected = await expectedToken();
  if (!expected) return NextResponse.next(); // auth ปิด (ยังไม่ตั้ง ADMIN_PASSWORD)

  // อนุญาตหน้า login และ action ของมันเสมอ
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token && token === expected) return NextResponse.next();

  // API → 401, หน้าเว็บ → พาไป login
  if (pathname.startsWith("/api/")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
