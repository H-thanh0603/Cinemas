import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const authed = await verifySession(
    req.cookies.get(SESSION_COOKIE)?.value
  );

  if (isLogin) {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!authed) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
