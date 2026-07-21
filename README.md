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
- **Giữ ghế**: Mọi đơn bắt đầu `PENDING` + **lock DB** `(showtime, seat)` · countdown **8 phút**
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

## Giấy phép

MIT