import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gắn request-id để nối log từng request (middleware → route → error).
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const resp = NextResponse.next();
  resp.headers.set("x-request-id", requestId);

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

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
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
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/showtimes/:path*",
    "/api/payments/:path*",
    "/api/cron/:path*",
    "/api/health",
    "/api/loadtest/:path*",
  ],
};
