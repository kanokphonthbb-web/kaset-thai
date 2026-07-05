"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkCredentials, computeToken } from "@/lib/adminAuth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!checkCredentials(email, password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await computeToken(process.env.ADMIN_EMAIL ?? "", password);
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  cookies().delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
