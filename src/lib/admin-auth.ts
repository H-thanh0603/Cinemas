import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export function isAdminSession(
  session: { id: string; role?: string | null } | null,
  databaseRole: string | null | undefined
): boolean {
  return Boolean(session?.id && session.role === "ADMIN" && databaseRole === "ADMIN");
}

/** Server-side guard for admin Server Actions / pages (middleware is primary). */
export async function requireAdmin() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.user) {
    return { ok: false as const, session: null };
  }
  const databaseUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (
    !isAdminSession(
      { id: session.user.id, role: session.user.role },
      databaseUser?.role
    )
  ) {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN";
}
