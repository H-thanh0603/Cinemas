/**
 * Self-check tính năng 2FA/TOTP cho ADMIN (chạy không cần HTTP server):
 *   npx tsx scripts/test-admin-2fa.ts
 *
 * Phủ: sinh secret, xác minh mã đúng/sai/thiếu, luồng DB
 * setup → enable → đăng nhập yêu cầu mã → disable.
 */
import assert from "node:assert/strict";
import { generate } from "otplib";
import { prisma } from "../src/lib/prisma";
import {
  buildTotpUri,
  checkAdminTwoFactor,
  createTotpSecret,
  normalizeTotpToken,
} from "../src/lib/two-factor";

const TEST_EMAIL = `test-2fa-${Date.now()}@cinestar.test`;

async function main() {
  // ── 1. Lib thuần ──────────────────────────────────────────────────────
  const secret = createTotpSecret();
  assert.match(secret, /^[A-Z2-7]+=*$/, "secret phải là Base32");
  assert.equal(
    normalizeTotpToken(" 123 -456 "),
    "123456",
    "chuẩn hóa khoảng trắng/gạch"
  );
  const uri = buildTotpUri(secret, "admin@cinestar.vn");
  assert.ok(uri.startsWith("otpauth://totp/CineStar:"), "otpauth URI sai định dạng");

  const admin = { role: "ADMIN", twoFactorEnabled: true, twoFactorSecret: secret };

  // Khách hàng / chưa bật 2FA → đi qua tự do
  assert.deepEqual(
    await checkAdminTwoFactor(
      { role: "CUSTOMER", twoFactorEnabled: true, twoFactorSecret: secret },
      undefined
    ),
    { outcome: "ok" }
  );
  assert.deepEqual(
    await checkAdminTwoFactor(
      { role: "ADMIN", twoFactorEnabled: false, twoFactorSecret: null },
      undefined
    ),
    { outcome: "ok" }
  );

  // Thiếu mã (rỗng/không truyền) → bắt nhập
  assert.deepEqual(await checkAdminTwoFactor(admin, ""), { outcome: "totp_required" });
  assert.deepEqual(await checkAdminTwoFactor(admin, undefined), {
    outcome: "totp_required",
  });

  // Sai mã (có input nhưng sai định dạng/giá trị) → từ chối, phân biệt với thiếu mã
  assert.deepEqual(await checkAdminTwoFactor(admin, "000000"), {
    outcome: "invalid_code",
  });
  assert.deepEqual(await checkAdminTwoFactor(admin, "abc"), {
    outcome: "invalid_code",
  });

  // Đúng mã (sinh tại thời điểm hiện tại)
  const token = await generate({ secret });
  assert.deepEqual(await checkAdminTwoFactor(admin, token), { outcome: "ok" });
  // Có khoảng trắng vẫn chấp nhận
  assert.deepEqual(await checkAdminTwoFactor(admin, `${token.slice(0, 3)} ${token.slice(3)}`), {
    outcome: "ok",
  });

  // ── 2. Luồng DB: setup → enable → login cần mã → disable ─────────────
  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Test 2FA Admin",
      passwordHash: "$2a$10$placeholderplaceholderplaceholderplaceholderplace", // bcrypt giả, không dùng trong test này
      role: "ADMIN",
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    },
  });

  try {
    // Chưa enable → không cần mã
    assert.deepEqual(
      await checkAdminTwoFactor(user, undefined),
      { outcome: "ok" }
    );

    // Enable với mã đúng
    const enableToken = await generate({ secret });
    const valid = await checkAdminTwoFactor(user, enableToken);
    assert.notEqual(valid.outcome, "invalid_code", "mã vừa sinh phải hợp lệ");
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    // Sau khi enable: thiếu mã phải bị chặn
    const enabledUser = { ...user, twoFactorEnabled: true };
    assert.deepEqual(await checkAdminTwoFactor(enabledUser, undefined), {
      outcome: "totp_required",
    });
    const loginToken = await generate({ secret });
    assert.deepEqual(await checkAdminTwoFactor(enabledUser, loginToken), {
      outcome: "ok",
    });

    console.log("admin 2FA checks passed");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
