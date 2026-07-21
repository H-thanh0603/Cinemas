import { NextResponse } from "next/server";

/**
 * @deprecated Admin login is NextAuth credentials with role ADMIN.
 * Kept to return a clear migration message if old clients still call it.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Đã chuyển sang NextAuth. Dùng /admin/login với email + mật khẩu tài khoản ADMIN.",
      loginUrl: "/admin/login",
    },
    { status: 410 }
  );
}
