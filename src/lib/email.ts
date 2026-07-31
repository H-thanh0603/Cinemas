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

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
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
  const safe = {
    code: escapeHtml(payload.code),
    contactName: escapeHtml(payload.contactName),
    movieTitle: escapeHtml(payload.movieTitle),
    cinemaName: escapeHtml(payload.cinemaName),
    roomName: escapeHtml(payload.roomName),
    startsAt: escapeHtml(formatDateTime(payload.startsAt)),
    seats: escapeHtml(payload.seats.join(", ")),
    finalTotal: escapeHtml(formatVnd(payload.finalTotal)),
    status: escapeHtml(payload.status),
    confirmUrl: escapeHtml(
      `${appUrl}/booking/confirmation/${encodeURIComponent(payload.code)}`
    ),
  };

  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.contactEmail,
      subject: `CineStar — Xác nhận đặt vé ${payload.code}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
          <h1 style="color:#e11d48">CineStar</h1>
          <p>Xin chào <b>${safe.contactName}</b>,</p>
          <p>Đặt vé của bạn đã được ghi nhận.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#666">Mã vé</td><td style="padding:6px 0;font-weight:700">${safe.code}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Phim</td><td style="padding:6px 0">${safe.movieTitle}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Suất</td><td style="padding:6px 0">${safe.startsAt}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Rạp</td><td style="padding:6px 0">${safe.cinemaName} · ${safe.roomName}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Ghế</td><td style="padding:6px 0">${safe.seats}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Tổng</td><td style="padding:6px 0;font-weight:700">${safe.finalTotal}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Trạng thái</td><td style="padding:6px 0">${safe.status}</td></tr>
          </table>
          <p><a href="${safe.confirmUrl}" style="display:inline-block;background:#b45f6a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Xem vé điện tử</a></p>
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

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "no_api_key" };
  const from = process.env.EMAIL_FROM ?? "CineStar <onboarding@resend.dev>";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
  try {
    const { error } = await resend.emails.send({
      from,
      to: input.email,
      subject: "CineStar — Đặt lại mật khẩu",
      html: `<p>Xin chào ${escapeHtml(input.name)},</p><p>Liên kết đặt lại mật khẩu có hiệu lực trong 60 phút.</p><p><a href="${escapeHtml(url)}">Đặt lại mật khẩu</a></p>`,
    });
    return error ? { sent: false, reason: error.message } : { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "unknown" };
  }
}
