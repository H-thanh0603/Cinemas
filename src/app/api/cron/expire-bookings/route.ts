import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { expirePendingBookings } from "@/lib/booking-expire";

/**
 * Cron / manual trigger to expire seat holds.
 * Protect with CRON_SECRET if set: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await expirePendingBookings();
  return NextResponse.json({ ok: true, expired });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
