import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { buildContentSecurityPolicy } from "@/lib/csp";

/**
 * Proxy (Next.js 16 đổi tên convention "middleware" → "proxy").
 * Chạy trên mọi route trừ tài nguyên tĩnh; gắn CSP nonce + bảo vệ /admin.
 * Bug fix 2026-09-12: __Secure- cookie HTTPS — xem comment bên dưới.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gắn request-id để nối log từng request (proxy → route → error).
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  // ─── Nonce-based CSP (strict CSP) ──────────────────────────────────────
  // Mỗi request một nonce; Next.js đọc header CSP trên REQUEST để tự gắn
  // nonce vào các <script> bootstrap của nó (App Router), nhờ vậy script-src
  // không cần 'unsafe-inline'. Header cũng phải đặt lên RESPONSE để trình
  // duyệt thực thi. Trang dùng nonce tự động trở thành dynamic rendering.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV !== "production",
  });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const resp = NextResponse.next({ request: { headers: requestHeaders } });
  resp.headers.set("x-request-id", requestId);
  resp.headers.set("x-nonce", nonce);
  resp.headers.set("Content-Security-Policy", csp);

  // Log tóm tắt mọi API request để theo dõi status/route (không log body).
  if (pathname.startsWith("/api")) {
    console.info(
      `ts=${new Date().toISOString()} lvl=info rid=${requestId} msg=api_request method=${req.method} path=${pathname}`
    );
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) {
    return resp;
  }

  // Production chạy HTTPS nên NextAuth đặt cookie có prefix __Secure-.
  // getToken() mặc định tìm cookie "authjs.session-token" (không prefix)
  // và salt = cookieName khi derive key giải mã JWE — sai tên cookie thì
  // session hợp lệ vẫn bị đọc là null → admin bị đá về login (bug này
  // không hiện trên local HTTP vì cookie không có prefix).
  // Fix: truyền đúng secureCookie theo scheme request + salt/cookieName khớp.
  const secureCookie =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const sessionCookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie,
    salt: sessionCookieName,
    cookieName: sessionCookieName,
  });
  const isAdmin = token?.role === "ADMIN";

  // Login page is public for everyone; admins skip to dashboard
  if (pathname === "/admin/login") {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return resp;
  }

  if (!isAdmin) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Cần tài khoản ADMIN" },
        { status: 403 }
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    // If already logged in as customer, still send to admin login with hint
    if (token) {
      loginUrl.searchParams.set("reason", "not_admin");
    }
    return NextResponse.redirect(loginUrl);
  }

  return resp;
}

export const config = {
  // Chạy trên mọi route trừ tài nguyên tĩnh (_next/static, ảnh tối ưu,
  // favicon, file có đuôi mở rộng) và /api/auth (NextAuth tự bảo vệ bằng
  // CSRF/session). CSP phải phủ cả trang public nên không thể giới hạn
  // matcher như trước đây (trước chỉ chạy cho admin + một số API).
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|[^?]*\\.[\\w]+$).*)",
  ],
};
