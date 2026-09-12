import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expirePendingBookingsBatch } from "@/lib/booking-expire";

/**
 * Cron / manual trigger to expire seat holds + dọn RateLimitBucket hết hạn.
 * Protect with CRON_SECRET if set: Authorization: Bearer ***
 *
 * Ghi chú vận hành: gói Vercel Hobby chỉ chạy cron 1 lần/ngày —
 * ghế vẫn được giải phóng kịp thời nhờ lazy-sweep trong luồng
 * booking/thanh toán. Cron chỉ là lưới an toàn + dọn rác.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expiredCount } = await expirePendingBookingsBatch();

  // Dọn rate-limit bucket đã hết hạn — tránh bảng phình to theo traffic
  // (không có job riêng thì lỗi này tích lũy dần).
  const { count: purgedBuckets } = await prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({
    ok: true,
    expired: expiredCount,
    purgedBuckets,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}