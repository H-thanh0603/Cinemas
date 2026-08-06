import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { expirePendingBookingsBatch } from "@/lib/booking-expire";

/**
 * Cron / manual trigger to expire seat holds.
 * Protect with CRON_SECRET if set: Authorization: Bearer ***
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expiredCount } = await expirePendingBookingsBatch();
  return NextResponse.json({ ok: true, expired: expiredCount });
}

export async function GET(req: NextRequest) {
  return POST(req);
}