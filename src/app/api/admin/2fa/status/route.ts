import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/** Trạng thái 2FA của tài khoản ADMIN hiện tại (dùng cho trang Bảo mật). */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok || !guard.session.user) {
    return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { id: guard.session.user.id },
    select: { twoFactorEnabled: true },
  });
  return NextResponse.json({ enabled: user?.twoFactorEnabled ?? false });
}
