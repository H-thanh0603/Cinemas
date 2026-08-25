import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * Tắt 2FA — yêu cầu nhập lại mật khẩu (re-authentication) để kẻ chiếm session
 * không thể tự tắt lớp bảo vệ thứ hai. Ghi audit log để truy vết.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok || !guard.session.user) {
    return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  }
  const userId = guard.session.user.id;

  const limit = await consumeRateLimit(rateLimitKey("2fa-disable", userId), 5, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Thử quá nhiều lần, thử lại sau." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Thiếu mật khẩu xác nhận" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled || !user.passwordHash) {
    return NextResponse.json({ error: "2FA chưa được bật" }, { status: 400 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await writeAuditLog({
    actorId: userId,
    action: "ADMIN_2FA_DISABLED",
    entity: "User",
    entityId: userId,
  });

  return NextResponse.json({ enabled: false });
}
