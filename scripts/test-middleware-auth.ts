/**
 * Regression test: middleware getToken phải đọc được session cookie
 * ở CẢ hai chế độ HTTP (cookie "authjs.session-token") và HTTPS
 * (cookie "__Secure-authjs.session-token").
 *
 * Bug gốc (fix 2026-09-12): middleware gọi getToken() không truyền
 * secureCookie/salt nên trên production HTTPS nó tìm sai tên cookie —
 * session ADMIN hợp lệ bị đọc là null → mọi route /admin/* trả 403
 * mặc dù đăng nhập thành công. Local HTTP không bị nên bug trốn rất kỹ.
 *
 * Cách test: tái hiện đúng lời gọi getToken mà middleware thực hiện
 * (copy logic secureCookie từ src/middleware.ts), rồi verify:
 *   1. Cookie có prefix __Secure- được đọc ra token role=ADMIN.
 *   2. Cookie không prefix (HTTP dev) vẫn đọc ra như cũ.
 *   3. Không có cookie → null (không thả admin qua).
 *   4. Cookie rác → null (decode fail im lặng, không throw).
 *
 * Chạy: npx tsx scripts/test-middleware-auth.ts
 */
import assert from "node:assert/strict";
import { encode as encodeJwe, getToken, type JWT } from "next-auth/jwt";

const SECRET =
  process.env.AUTH_SECRET_FOR_TEST ?? "test-secret-middleware-regression";

function makeReq(cookieHeader: string) {
  return { headers: new Headers({ cookie: cookieHeader }) };
}

function roleOf(token: string | JWT | null): string | undefined {
  if (token === null) return undefined;
  if (typeof token === "string") return undefined;
  return token.role as string | undefined;
}

async function main() {
  const token = await encodeJwe({
    token: { sub: "u1", role: "ADMIN", name: "Test Admin" },
    secret: SECRET,
    salt: "__Secure-authjs.session-token", // phải khớp salt dùng khi decode
  });

  // ── Logic mirror từ src/middleware.ts (giữ đồng bộ khi sửa middleware!) ──
  const secureCookie = true; // production HTTPS
  const sessionCookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // 1. HTTPS production: cookie __Secure- prefix phải đọc được
  const httpsToken = await getToken({
    req: makeReq(`__Secure-authjs.session-token=${token}`),
    secret: SECRET,
    secureCookie,
    salt: sessionCookieName,
    cookieName: sessionCookieName,
  } as Parameters<typeof getToken>[0]);
  assert.equal(roleOf(httpsToken), "ADMIN", "HTTPS: phải đọc được role ADMIN");

  // 2. HTTP dev: cookie không prefix vẫn đọc được (salt khớp tên cookie)
  const httpTokenRaw = await encodeJwe({
    token: { sub: "u1", role: "ADMIN", name: "Test Admin" },
    secret: SECRET,
    salt: "authjs.session-token",
  });
  const httpToken = await getToken({
    req: makeReq(`authjs.session-token=${httpTokenRaw}`),
    secret: SECRET,
    secureCookie: false,
    salt: "authjs.session-token",
    cookieName: "authjs.session-token",
  } as Parameters<typeof getToken>[0]);
  assert.equal(roleOf(httpToken), "ADMIN", "HTTP: phải đọc được role ADMIN");

  // 3. Không cookie → null
  const none = await getToken({
    req: makeReq(""),
    secret: SECRET,
    secureCookie,
    salt: sessionCookieName,
    cookieName: sessionCookieName,
  } as Parameters<typeof getToken>[0]);
  assert.equal(none, null, "Không cookie → phải null");

  // 4. Cookie rác → null (không throw)
  const garbage = await getToken({
    req: makeReq("__Secure-authjs.session-token=not.a.valid.jwe"),
    secret: SECRET,
    secureCookie,
    salt: sessionCookieName,
    cookieName: sessionCookieName,
  } as Parameters<typeof getToken>[0]);
  assert.equal(garbage, null, "Cookie rác → phải null, không throw");

  console.log("✅ middleware auth regression checks passed");
  console.log("   (HTTPS __Secure- prefix, HTTP dev cookie, no-cookie, garbage)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
