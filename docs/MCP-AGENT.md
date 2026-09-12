# MCP Server — Cinemas cho AI Agent

Website này có một **lớp giao tiếp dành cho AI agent** (Model Context
Protocol): agent gọi thẳng vào dữ liệu rạp — tìm phim, xem lịch chiếu,
kiểm ghế, giữ ghế — **không cần cào HTML hay mô phỏng click**.

## Bật server (admin)

MCP tắt mặc định. Bật bằng cách set biến môi trường trên Vercel:

```
CINEMAS_AGENT_KEY=<chuỗi bí mật ngẫu nhiên, vd: openssl rand -hex 24>
```

Không set = endpoint `/api/mcp` luôn trả 401 (fail-closed).

## Gắn vào Claude Desktop / Claude Code

Thêm vào `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "cinemas": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://cinemas-khaki.vercel.app/api/mcp"],
      "env": {
        "MCP_REMOTE_AUTHORIZATION_TOKEN": "<CINEMAS_AGENT_KEY>"
      }
    }
  }
}
```

`mcp-remote` là bridge chuẩn (streamable HTTP → stdio) mà Claude Desktop
cần. Nó tự gắn header `Authorization: Bearer ...` từ biến trên.

### Claude Code (CLI)

```bash
claude mcp add --transport http cinemas https://cinemas-khaki.vercel.app/api/mcp \
  --header "Authorization: Bearer <CINEMAS_AGENT_KEY>"
```

### ChatGPT / các client MCP khác

Endpoint là JSON-RPC 2.0 thuần — mọi client MCP streamable-HTTP đều gắn
được. Auth: header `Authorization: Bearer <CINEMAS_AGENT_KEY>`.

## 4 tool

| Tool | Input chính | Trả về |
|---|---|---|
| `list_movies` | `status` (NOW_SHOWING/COMING_SOON) | slug, tên, mô tả, thể loại, tuổi |
| `get_showtimes` | `movie_slug`, `cinema_slug?`, `date?` | id suất, giờ (VN), rạp, phòng, format, giá |
| `check_seats` | `showtime_id`, `want_count?` | sơ đồ ghế, ghế trống, **đề xuất cụm ghế tốt nhất** + giá ước tính |
| `hold_seats` | `showtime_id`, `seat_ids`, contact, `idempotency_key` | mã đơn + link thanh toán cho người dùng |

### Quy tắc human-in-the-loop

`hold_seats` **chỉ giữ ghế** (booking PENDING, tự giải phóng sau 35 phút).
Agent KHÔNG thanh toán thay người — trả `payment_page` link cho người
dùng tự chốt. Đây là ranh giới thiết kế cố ý: agent làm phần tra cứu/viết
tay chân, con người xác nhận giao dịch.

## Ví dụ prompt demo

Gắn xong, thử hỏi Claude:

> "CineStar đang chiếu phim gì? Với phim Interstellar, suất tối nay ở
> Đà Nẵng còn 2 ghế đẹp không? Nếu có thì giữ giúp tôi 2 ghế, tên Nguyễn
> Văn A, email a@example.com, SĐT 0912345678."

Claude sẽ lần lượt gọi `list_movies` → `get_showtimes` (cinema_slug
`cinestar-da-nang`) → `check_seats` (want_count 2) → hỏi bạn xác nhận →
`hold_seats` → trả link thanh toán + nhắn "ghế giữ đến 20:35, thanh toán
kịp nhé".

## Test

```bash
# Cần server đang chạy + key khớp
BASE_URL=http://localhost:3000 AGENT_KEY=<key> npx tsx scripts/test-mcp.ts
```

24 check: auth fail-closed, handshake, tools/list, từng tool, idempotency
(hold 2 lần cùng key → cùng mã đơn), ghế vừa giữ → taken, giành ghế bị
chiếm → lỗi.

## Chi tiết kỹ thuật

- Transport: HTTP POST stateless, JSON-RPC 2.0 (mỗi request tự auth Bearer).
- Protocol version: `2025-03-26`.
- Rate limit: 60 request/phút theo key (429 + Retry-After).
- Giá ước tính trong `check_seats` đã gồm hệ số khung giờ (cuối tuần ×1.2,
  tối 17–23h ×1.1) + phụ thu VIP/COUPLE.
- Suggestion dùng cùng scoring engine với web (`pickBestSeats`): giữa hàng,
  giữa cột, ưu tiên kề nhau.
- Múi giờ hiển thị: Asia/Ho_Chi_Minh (UTC+7). DB lưu UTC.
