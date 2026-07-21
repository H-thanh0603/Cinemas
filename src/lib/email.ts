import { Resend } from "resend";
import { formatDateTime, formatVnd } from "@/lib/constants";

type BookingEmailPayload = {
  code: string;
  contactName: string;
  contactEmail: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startsAt: Date;
  seats: string[];
  finalTotal: number;
  status: string;
};

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload
): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  if (!resend) {
    console.info(
      `[email] RESEND_API_KEY missing — skip email for ${payload.code}`
    );
    return { sent: false, reason: "no_api_key" };
  }

  const from =
    process.env.EMAIL_FROM ?? "CineStar <onboarding@resend.dev>";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const confirmUrl = `${appUrl}/booking/confirmation/${payload.code}`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.contactEmail,
      subject: `CineStar — Xác nhận đặt vé ${payload.code}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
          <h1 style="color:#e11d48">CineStar</h1>
          <p>Xin chào <b>${payload.contactName}</b>,</p>
          <p>Đặt vé của bạn đã được ghi nhận.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#666">Mã vé</td><td style="padding:6px 0;font-weight:700">${payload.code}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Phim</td><td style="padding:6px 0">${payload.movieTitle}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Suất</td><td style="padding:6px 0">${formatDateTime(payload.startsAt)}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Rạp</td><td style="padding:6px 0">${payload.cinemaName} · ${payload.roomName}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Ghế</td><td style="padding:6px 0">${payload.seats.join(", ")}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Tổng</td><td style="padding:6px 0;font-weight:700">${formatVnd(payload.finalTotal)}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Trạng thái</td><td style="padding:6px 0">${payload.status}</td></tr>
          </table>
          <p><a href="${confirmUrl}" style="display:inline-block;background:#e11d48;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Xem vé điện tử</a></p>
          <p style="color:#666;font-size:12px">Vui lòng có mặt trước giờ chiếu 15 phút và mang mã QR / mã đặt vé.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] failed:", e);
    return {
      sent: false,
      reason: e instanceof Error ? e.message : "unknown",
    };
  }
}
