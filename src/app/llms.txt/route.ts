import { NextResponse } from "next/server";

/**
 * GET /llms.txt — hướng dẫn cho AI agent hiểu website này.
 * Chuẩn cộng đồng llms.txt (Markdown cho LLM). Content-Type text/plain
 * để mọi crawler/agent đọc thẳng được.
 */
export function GET() {
  const body = `# Cinemas (CineStar) — AI Agent Guide

> Nền tảng đặt vé xem phim. Tài liệu này cho AI agent hiểu website và
> các công cụ có thể gọi trực tiếp (không cần "nhìn rồi click").

## Về trang web này

- Tên: CineStar — hệ thống rạp chiếu phim (TP.HCM, Hà Nội, Đà Nẵng)
- Ngôn ngữ chính: tiếng Việt
- Tiền tệ: VND
- Domain chính: ${process.env.APP_URL ?? "https://cinemas-khaki.vercel.app"}

## Trang quan trọng

| Trang | Mục đích |
|---|---|
| /movies | Danh sách phim đang chiếu / sắp chiếu |
| /movies/[slug] | Chi tiết phim + lịch chiếu (JSON-LD Movie schema) |
| /booking/[showtimeId] | Chọn ghế cho một suất chiếu |
| /bookings | Tra cứu đơn đặt vé theo email + mã đơn |
| /promotions | Mã ưu đãi đang chạy |

## Công cụ cho AI Agent (MCP)

Endpoint MCP: /api/mcp — JSON-RPC 2.0 theo chuẩn Model Context Protocol
(streamable HTTP). Xác thực: header Authorization: Bearer <CINEMAS_AGENT_KEY>.

Các tool:

| Tool | Chức năng |
|---|---|
| list_movies | Phim đang chiếu / sắp chiếu |
| get_showtimes | Lịch chiếu 1 phim theo slug, lọc rạp/ngày |
| check_seats | Ghế trống cho 1 suất + tự đề xuất cụm ghế tốt nhất |
| hold_seats | Giữ ghế giúp người dùng → trả link thanh toán |

Quan trọng khi dùng hold_seats:
- Ghế chỉ giữ 35 phút — nhắc người dùng thanh toán kịp.
- Luôn hỏi người dùng XÁC NHẬN trước khi gọi (human-in-the-loop).
- Không dùng tool này để spam giữ ghế.

## Quy ước dữ liệu

- Ngày giờ ISO 8601 (UTC trong DB; hiển thị giờ Việt Nam UTC+7).
- Giá VND nguyên (75000 = 75.000đ). Cuối tuần x1.2, tối 17-23h x1.1.
- Ghế hàng A-J, số 1-14; NORMAL/VIP/COUPLE (COUPLE = ghế đôi).
- Mã đơn CS-XXXXXXXXXX.

## Liên hệ / pháp lý

- Dự án học tập/demo. Không xử lý thanh toán thật khi sandbox bật.
- Tôn trọng rate limit (429 kèm Retry-After).
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
