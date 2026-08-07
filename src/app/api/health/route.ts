import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Simple health check — verifies database connectivity. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error) {
    logger.error("health database check failed", error);
    return NextResponse.json(
      { status: "degraded", db: "disconnected", error: "Database unreachable" },
      { status: 503 }
    );
  }
}
