import { generateSecret, generateURI, verify } from "otplib";

/**
 * 2FA/TOTP cho tài khoản ADMIN — dùng otplib (tương thích Google Authenticator).
 *
 * Vòng đời:
 *   setup()  → sinh secret mới, lưu vào User.twoFactorSecret với
 *              twoFactorEnabled = false (trạng thái "chờ xác nhận").
 *   enable() → người dùng quét QR rồi nhập mã; mã đúng thì bật
 *              twoFactorEnabled = true. Từ đây mọi đăng nhập ADMIN phải kèm mã.
 *   disable()-> yêu cầu nhập lại mật khẩu ở route, xóa secret.
 */

const TOTP_ISSUER = "CineStar";
/** Chấp nhận lệch ±1 bước 30s để bù đồng hồ giữa server và điện thoại. */
const EPOCH_TOLERANCE_SECONDS = 30;

export function createTotpSecret(): string {
  return generateSecret();
}

export function buildTotpUri(secret: string, email: string): string {
  return generateURI({ issuer: TOTP_ISSUER, label: email, secret });
}

/** Chuẩn hóa input người dùng: bỏ khoảng trắng, chỉ giữ số. */
export function normalizeTotpToken(raw: string | undefined | null): string {
  return (raw ?? "").replace(/[\s-]/g, "").trim();
}

export async function verifyTotpToken(
  secret: string,
  rawToken: string | null | undefined
): Promise<boolean> {
  const token = normalizeTotpToken(rawToken);
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const result = await verify({
      token,
      secret,
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid === true;
  } catch {
    // Secret hỏng / token sai định dạng sâu — coi như mã không hợp lệ,
    // không để lỗi thư viện làm sập luồng đăng nhập.
    return false;
  }
}

/**
 * Cổng kiểm tra 2FA dùng trong NextAuth authorize().
 * Chỉ áp dụng cho tài khoản ADMIN đã bật 2FA; khách hàng đi qua không chạm.
 */
export async function checkAdminTwoFactor(
  user: {
    role: string;
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
  },
  rawCode: string | undefined | null
): Promise<
  { outcome: "ok" } | { outcome: "totp_required" } | { outcome: "invalid_code" }
> {
  if (
    user.role !== "ADMIN" ||
    !user.twoFactorEnabled ||
    !user.twoFactorSecret
  ) {
    return { outcome: "ok" };
  }
  const secret = user.twoFactorSecret;
  if (!normalizeTotpToken(rawCode)) {
    return { outcome: "totp_required" };
  }
  const valid = await verifyTotpToken(secret, rawCode);
  return valid ? { outcome: "ok" } : { outcome: "invalid_code" };
}
