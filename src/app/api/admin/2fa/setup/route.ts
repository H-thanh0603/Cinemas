import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { buildTotpUri, createTotpSecret } from "@/lib/two-factor";

/**
 * Bắt đầu cài 2FA: sinh secret mới và trả về ảnh QR (data URL) để quét bằng
 * Google Authenticator / Authy… Secret lưu ở trạng thái PENDING
 * (twoFactorEnabled=false) — chỉ có hiệu lực sau khi gọi /2fa/enable với mã đúng.
 * Gọi lại setup sẽ thay secret cũ (an toàn: bản chưa enable chưa dùng đến).
 */
export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok || !guard.session.user) {
    return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  }
  const userId = guard.session.user.id;

  // Chống spam tạo secret / quét QR hàng loạt nếu session bị lộ.
  const limit = await consumeRateLimit(rateLimitKey("2fa-setup", userId), 5, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Thao tác quá nhiều lần, thử lại sau." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
  }

  const secret = createTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const otpauthUri = buildTotpUri(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
    margin: 1,
    width: 240,
  });

  return NextResponse.json({ otpauthUri, qrDataUrl, secret });
}
