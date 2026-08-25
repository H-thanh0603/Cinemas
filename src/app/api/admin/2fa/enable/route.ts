import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { verifyTotpToken } from "@/lib/two-factor";

/**
 * Xác nhận mã TOTP đầu tiên sau khi quét QR → bật 2FA chính thức.
 * Sai mã KHÔNG tiết lộ nguyên nhân cụ thể (mã sai / hết hạn) — chung 1 thông báo.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok || !guard.session.user) {
    return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  }
  const userId = guard.session.user.id;

  // Giới hạn số lần thử nhập mã: chặn brute-force 6 chữ số.
  const limit = await consumeRateLimit(rateLimitKey("2fa-enable", userId), 10, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Thử quá nhiều lần, thử lại sau." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code : "";
  if (!code) {
    return NextResponse.json({ error: "Thiếu mã xác thực" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: "Chưa bắt đầu cài 2FA — hãy quét QR trước." },
      { status: 400 }
    );
  }

  const valid = await verifyTotpToken(user.twoFactorSecret, code);
  if (!valid) {
    return NextResponse.json({ error: "Mã không đúng hoặc đã hết hạn" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
  await writeAuditLog({
    actorId: userId,
    action: "ADMIN_2FA_ENABLED",
    entity: "User",
    entityId: userId,
  });

  return NextResponse.json({ enabled: true });
}
