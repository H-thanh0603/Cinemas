export const SEAT_TYPE_SURCHARGE: Record<string, number> = {
  NORMAL: 0,
  VIP: 30000,
  COUPLE: 60000,
};

export const SEAT_TYPE_LABELS: Record<string, string> = {
  NORMAL: "Ghế thường",
  VIP: "Ghế VIP",
  COUPLE: "Ghế đôi",
};

export const MAX_SEATS_PER_BOOKING = 8;

export const AGE_RATING_LABELS: Record<string, string> = {
  P: "P — Mọi lứa tuổi",
  K: "K — Dưới 13 tuổi cần người lớn",
  T13: "T13 — Từ 13 tuổi",
  T16: "T16 — Từ 16 tuổi",
  T18: "T18 — Từ 18 tuổi",
};

export const MOVIE_STATUS_LABELS: Record<string, string> = {
  NOW_SHOWING: "Đang chiếu",
  COMING_SOON: "Sắp chiếu",
  ARCHIVED: "Ngừng chiếu",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: "Thẻ tín dụng / ghi nợ",
  E_WALLET: "Ví điện tử",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  AT_COUNTER: "Thanh toán tại quầy",
};

export const SHOWTIME_FORMAT_LABELS: Record<string, string> = {
  "2D": "2D",
  "3D": "3D",
  IMAX: "IMAX",
};

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatTime(date)} ${formatDate(date)}`;
}
