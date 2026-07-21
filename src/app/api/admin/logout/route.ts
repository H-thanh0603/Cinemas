import { NextResponse } from "next/server";

/**
 * @deprecated Use next-auth signOut from the client.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Dùng signOut() của NextAuth thay vì /api/admin/logout",
      hint: "await signOut({ callbackUrl: '/admin/login' })",
    },
    { status: 410 }
  );
}
