# CineStar — Nền tảng đặt vé xem phim trực tuyến

Nền tảng đặt vé xem phim hoàn chỉnh, xây dựng với **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL** (Docker) và **NextAuth**.

## Tính năng chính

### Người dùng
- **Đăng ký / Đăng nhập**: NextAuth credentials (email + mật khẩu)
- **Trang chủ**: Hero phim nổi bật, điều hướng theo thể loại, phim đang chiếu / sắp chiếu, hệ thống rạp, ưu đãi
- **Danh sách phim**: Lọc theo trạng thái, thể loại, xếp hạng tuổi; sắp xếp theo phổ biến / mới nhất / ngày khởi chiếu; phân trang
- **Chi tiết phim**: Thông tin đầy đủ (đạo diễn, diễn viên, mô tả, trailer), lịch chiếu theo ngày và rạp
- **Hệ thống rạp**: Danh sách rạp, chi tiết rạp với phòng chiếu và suất chiếu
- **Đặt vé 3 bước**:
  1. **Chọn ghế**: Sơ đồ ghế realtime (SSE + polling fallback), giới hạn số ghế
  2. **Chọn vé & combo**: Loại vé (người lớn / học sinh / trẻ em), combo bắp nước
  3. **Thanh toán**: Thông tin liên hệ, mã khuyến mãi, phương thức thanh toán
- **Giữ ghế**: Mọi đơn bắt đầu `PENDING` + **lock DB** `(showtime, seat)` · countdown **35 phút**
- **Thanh toán sandbox**: `/booking/pay/[code]` — thẻ test `4242…` / fail `4000…0002`, QR ví/CK demo
- **Xác nhận đặt vé**: Mã vé, **QR code thật**, email Resend (nếu cấu hình), hướng dẫn đến rạp
- **Tra cứu vé**: Đăng nhập hoặc nhập email để xem vé sắp tới / đã xem / đã hủy
- **Khuyến mãi**: Danh sách mã ưu đãi đang hoạt động

### Quản trị (Admin)
- **Đăng nhập**: Bảo vệ `/admin` và `/api/admin/*` bằng NextAuth + role `ADMIN`
- **Tổng quan**: Thống kê phim, rạp, suất chiếu, đặt vé, doanh thu; đặt vé và suất chiếu gần đây
- **Quản lý phim**: Thêm / xóa phim, gán thể loại
- **Quản lý rạp**: Thêm / xóa rạp
- **Quản lý phòng & ghế**: Thêm phòng (tự động tạo ghế), xóa phòng, tạo lại ghế
- **Quản lý suất chiếu**: Thêm suất chiếu (kiểm tra xung đột lịch), hủy suất
- **Quản lý đặt vé**: Xem tất cả đặt vé, hủy vé (hoàn tiền nếu đã thanh toán)
- **Quản lý khuyến mãi**: Thêm / xóa mã khuyến mãi

### UX/UI
- Giao diện dark theme cao cấp, poster-driven
- Responsive mobile-first
- Loading skeletons cho từng trang
- Empty states, error states, form validation
- Toast notifications
- Breadcrumbs
- Scroll-to-top khi chuyển trang
- Booking progress indicator
- Sticky booking summary

## Công nghệ

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth credentials (CUSTOMER / ADMIN) |
| Charts | Chart.js |
| Email | Resend (optional) |
| Runtime | Node.js + Docker Compose |

## Cài đặt

### Yêu cầu
- Node.js 18+
- npm
- Docker Desktop (PostgreSQL)

### Bước cài đặt

```bash
# 1. Clone repository
git clone https://github.com/H-thanh0603/Cinemas.git
cd Cinemas

# 2. Cài dependencies
npm install

# 3. Tạo file .env
cp .env.example .env
# Chỉnh AUTH_SECRET; thêm RESEND_API_KEY nếu muốn gửi email

# 4. Bật Postgres + schema + seed
npm run db:setup
# (tương đương: docker compose up -d db && npx prisma db push && npm run db:seed)

# 5. Chạy dev server
npm run dev
```

Truy cập: http://localhost:3000

| Tài khoản | Email / mật khẩu | Role |
|-----------|------------------|------|
| Khách | `khach@example.com` / `khach123` | CUSTOMER |
| Admin | `admin@cinestar.vn` / `admin123` | ADMIN → `/admin` |

**Expire ghế giữ chỗ:** `GET/POST /api/cron/expire-bookings` (header `Authorization: Bearer CRON_SECRET` nếu set).

### Load test (k6)

```bash
# Terminal 1: production server + LOADTEST_SECRET in .env
npm run build && npm run start

# Terminal 2: ladder 100 → 500 → 1000 VU (Docker k6)
npm run loadtest
```

Chi tiết: [`scripts/k6/README.md`](scripts/k6/README.md).

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npx prisma studio    # Database GUI
npx prisma db seed   # Re-seed database
```

## Database Schema

### Các entity chính
- **User**: Người dùng (CUSTOMER / ADMIN, `passwordHash` cho NextAuth)
- **Movie**: Phim (NOW_SHOWING / COMING_SOON / ARCHIVED)
- **Genre / MovieGenre**: Thể loại (many-to-many)
- **Cinema**: Rạp chiếu
- **Room**: Phòng chiếu (rows × cols)
- **Seat**: Ghế (NORMAL / VIP / COUPLE)
- **Showtime**: Suất chiếu (SCHEDULED / CANCELLED)
- **TicketType**: Loại vé (ADULT / STUDENT / CHILD)
- **FoodCombo**: Combo bắp nước
- **Promotion**: Khuyến mãi (PERCENT / FIXED)
- **Booking**: Đặt vé (PENDING / CONFIRMED / CANCELLED / EXPIRED) + `expiresAt` giữ ghế + `emailSentAt`
- **BookingSeat**: Ghế trong đặt vé (giá ghi lại lúc đặt)
- **BookingCombo**: Combo trong đặt vé
- **Payment**: Thanh toán (UNPAID / PAID / FAILED / REFUNDED)

### Ràng buộc nghiệp vụ
- Ghế không thể bị đặt trùng cho cùng suất chiếu
- Không thể đặt vé cho suất chiếu đã qua hoặc đã hủy
- Giới hạn tối đa 8 ghế mỗi đặt vé
- Mã khuyến mãi phải còn hạn và đạt giá trị tối thiểu
- Admin không thể tạo suất chiếu trùng lịch trong cùng phòng
- Xóa rạp/phim có kiểm tra quan hệ (không xóa nếu đang có suất chiếu)

## Dữ liệu mẫu (Seed)

- 8+ phim (fictional titles)
- 3 rạp chiếu
- 2+ phòng mỗi rạp
- Ghế tự động (thường / VIP / đôi)
- Suất chiếu nhiều ngày
- Loại vé, combo bắp nước
- Mã khuyến mãi
- Một số đặt vé mẫu (ghế đã đặt sẵn)

## Cấu trúc thư mục

```
src/
├── app/
│   ├── admin/           # Admin dashboard + CRUD pages
│   ├── api/admin/       # Admin API routes
│   ├── booking/         # Booking flow + confirmation
│   ├── bookings/        # Booking history lookup
│   ├── cinemas/         # Cinema listing + detail
│   ├── movies/          # Movie listing + detail
│   ├── promotions/      # Promotions page
│   ├── error.tsx        # Global error boundary
│   ├── loading.tsx      # Global loading
│   ├── not-found.tsx    # 404 page
│   └── page.tsx         # Home page
├── components/
│   ├── booking/         # Booking flow components
│   ├── layout/          # Header, Footer
│   ├── movies/          # MovieCard
│   └── ui/              # Badge, Spinner, EmptyState, Toast, Breadcrumbs
└── lib/
    ├── prisma.ts        # Prisma client
    ├── constants.ts     # Constants + formatters
    └── booking.ts       # Booking utilities

prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Seed script
```

## Kiểm tra

```bash
# Type check
npm run typecheck

# Build
npm run build

# Database check
npx tsx scripts/db-check.ts

# Booking test
npx tsx scripts/test-booking.ts
```

## Bảo mật

Ba lớp bảo mật chủ chốt (chi tiết audit: `AUDIT-REPORT.md`):

### 1. Nonce-based CSP (strict CSP)

`src/middleware.ts` sinh một nonce mỗi request và đặt header
`Content-Security-Policy` lên cả request lẫn response; Next.js App Router đọc
header của request để tự gắn nonce vào toàn bộ `<script>` bootstrap. Kết quả:

```
script-src 'self' 'nonce-<mỗi-request>' 'strict-dynamic'
```

— **không còn `'unsafe-inline'`** cho script ở cả dev và production (dev thêm
`'unsafe-eval'` cho HMR). Builder CSP nằm tại `src/lib/csp.ts`. Đánh đổi: mọi
route render động (`headers()` được gọi trong root layout) vì HTML tĩnh đóng
gói lúc build không thể mang nonce theo từng request.

### 2. 2FA/TOTP cho tài khoản ADMIN

- Admin bật 2FA trong panel: **Bảo mật 2FA** → quét QR (otplib, tương thích
  Google Authenticator) → nhập mã xác nhận.
- Sau khi bật, mọi đăng nhập ADMIN yêu cầu mã 6 số; thiếu mã server trả
  lỗi `TOTP_REQUIRED` để form hiển thị ô nhập mã (2 bước), sai mã bị từ chối.
- Tắt 2FA phải nhập lại mật khẩu (re-authentication); bật/tắt đều ghi
  `AuditLog`.
- API: `/api/admin/2fa/{status,setup,enable,disable}` — tất cả yêu cầu session
  ADMIN và có rate limit riêng chống brute-force mã 6 số.

### 3. Rate limit Upstash Redis (fallback Postgres)

`consumeRateLimit()` (`src/lib/rate-limit.ts`) tự chọn backend:

- Có `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` → đếm qua Redis với
  script Lua nguyên tử (`INCR + PEXPIRE + PTTL`) — 1 roundtrip/request, mọi
  instance chia sẻ bộ đếm khi scale ngang.
- Thiếu cấu hình (local dev/test) → dùng đúng logic cũ trên bảng
  `RateLimitBucket` trong Postgres.

Kiểm tra:

```bash
npm run test:admin-2fa        # unit luồng 2FA (không cần server)
npm run -s test:admin-2fa-http BASE_URL=http://localhost:3000   # E2E qua HTTP
npm run test:rate-limit       # rate limit cả 2 backend (Redis mock qua fetch stub)
```

## Giấy phép

MIT