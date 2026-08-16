"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_S,
  createSessionValue,
  credentialsConfigured,
  credentialsMatch,
} from "@/lib/auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(
  _prev: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  if (!credentialsConfigured()) {
    return {
      ok: false,
      error: "ADMIN_EMAIL / ADMIN_PASSWORD chưa được cấu hình trong .env",
    };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!credentialsMatch(email, password)) {
    return { ok: false, error: "Email hoặc mật khẩu không đúng" };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionValue(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_S,
  });
  const next = String(formData.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
