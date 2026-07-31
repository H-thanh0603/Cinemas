import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeRefundIdempotencyKey } from "@/lib/stripe-payment";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Cần tài khoản ADMIN" }, { status: 403 });
  }
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { bookingId: id },
    include: { booking: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Không tìm thấy thanh toán" }, { status: 404 });
  }
  if (payment.status === "REFUNDED") {
    return NextResponse.json({ ok: true, status: "REFUNDED", refundId: payment.refundId });
  }
  if (
    payment.status !== "PAID" ||
    payment.provider !== "STRIPE" ||
    !payment.providerPaymentId
  ) {
    return NextResponse.json(
      { error: "Thanh toán này không đủ điều kiện hoàn tiền Stripe" },
      { status: 409 }
    );
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: "PAID", refundId: null },
    data: { status: "REFUND_PENDING" },
  });
  if (claimed.count !== 1) {
    return NextResponse.json({ error: "Thanh toán đang được xử lý" }, { status: 409 });
  }

  try {
    const refund = await getStripe().refunds.create(
      {
        payment_intent: payment.providerPaymentId,
        amount: payment.amount,
        reason: "requested_by_customer",
        metadata: { bookingId: id, paymentId: payment.id },
      },
      { idempotencyKey: stripeRefundIdempotencyKey(payment.id) }
    );
    const refunded = refund.status === "succeeded";
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refunded ? "REFUNDED" : "REFUND_PENDING",
          refundId: refund.id,
          refundedAt: refunded ? new Date() : null,
          lastError: null,
        },
      }),
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED", expiresAt: null },
      }),
    ]);
    await writeAuditLog({ actorId: guard.session.user.id, action: "REFUND", entity: "Booking", entityId: id, metadata: { refundId: refund.id, status: refund.status } });
    return NextResponse.json({
      ok: true,
      status: refunded ? "REFUNDED" : "REFUND_PENDING",
      refundId: refund.id,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        lastError: error instanceof Error ? error.message.slice(0, 500) : "Refund failed",
      },
    });
    return NextResponse.json({ error: "Không thể hoàn tiền Stripe" }, { status: 502 });
  }
}
