import { auth } from "@/auth";

/** Server-side guard for admin Server Actions / pages (middleware is primary). */
export async function requireAdmin() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN";
}
