/**
 * E2E luồng đăng nhập ADMIN có 2FA qua HTTP (cần server đang chạy):
 *   BASE_URL=http://localhost:3000 npx tsx scripts/test-admin-2fa-http.ts
 *
 * Phủ: thiếu mã → bị chặn (TOTP_REQUIRED), sai mã → từ chối,
 * đúng mã → session ADMIN thật sự.
 */
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { generate } from "otplib";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const EMAIL = `e2e-2fa-${Date.now()}@cinestar.test`;
const PASSWORD = "Correct-Horse-9";

type Jar = Map<string, string>;

function cookieHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorbCookies(jar: Jar, res: Response): void {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const line of raw) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}

async function credentialsLogin(
  jar: Jar,
  fields: Record<string, string>
): Promise<Response> {
  // 1) Lấy CSRF token + cookie
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  absorbCookies(jar, csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // 2) POST callback credentials với cookie jar
  const body = new URLSearchParams({ ...fields, csrfToken });
  return fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
}

async function main() {
  const secret = await import("../src/lib/two-factor").then(
    (m) => m.createTotpSecret()
  );
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: "E2E 2FA Admin",
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role: "ADMIN",
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    },
  });

  try {
    // ── Thiếu mã TOTP → bị chặn với mã lỗi TOTP_REQUIRED ────────────────
    const jar1: Jar = new Map();
    const noCode = await credentialsLogin(jar1, {
      email: EMAIL,
      password: PASSWORD,
    });
    const location1 = noCode.headers.get("location") ?? "";
    assert.ok(noCode.status >= 400 || location1.includes("error"), "thiếu mã phải fail");
    assert.ok(
      location1.includes("code=TOTP_REQUIRED") || location1.includes("TOTP_REQUIRED"),
      `phải báo TOTP_REQUIRED, nhận: ${location1}`
    );
    console.log("✓ thiếu mã TOTP → chặn với code=TOTP_REQUIRED");

    // ── Sai mật khẩu vẫn fail như thường ────────────────────────────────
    const jarWrong: Jar = new Map();
    const wrong = await credentialsLogin(jarWrong, {
      email: EMAIL,
      password: "sai-mat-khau",
      totpCode: (await generate({ secret })).toString(),
    });
    assert.ok(wrong.status >= 400 || (wrong.headers.get("location") ?? "").includes("error"));
    console.log("✓ sai mật khẩu → từ chối");

    // ── Sai mã TOTP → fail ───────────────────────────────────────────────
    const jarBadCode: Jar = new Map();
    const badCode = await credentialsLogin(jarBadCode, {
      email: EMAIL,
      password: PASSWORD,
      totpCode: "000000",
    });
    assert.ok(badCode.status >= 400 || (badCode.headers.get("location") ?? "").includes("error"));
    console.log("✓ sai mã TOTP → từ chối");

    // ── Đủ mật khẩu + mã hợp lệ → session ADMIN ─────────────────────────
    const jarOk: Jar = new Map();
    const ok = await credentialsLogin(jarOk, {
      email: EMAIL,
      password: PASSWORD,
      totpCode: await generate({ secret }),
    });
    absorbCookies(jarOk, ok);
    assert.ok(!cookieHeader(jarOk).includes("undefined"), "cookie jar hợp lệ");

    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { cookie: cookieHeader(jarOk) },
    });
    const session = (await sessionRes.json()) as {
      user?: { role?: string; email?: string };
    };
    assert.equal(session.user?.role, "ADMIN", "session phải có role ADMIN");
    assert.equal(session.user?.email, EMAIL);
    console.log("✓ mật khẩu + mã hợp lệ → đăng nhập được với role ADMIN");

    console.log("admin 2FA HTTP flow passed");
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
