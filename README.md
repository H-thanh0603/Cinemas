# CineStar — Nền tảng đặt vé xem phim trực tuyến

Nền tảng đặt vé xem phim hoàn chỉnh, xây dựng với **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma** và **SQLite**.

## Tính năng chính

### Người dùng
- **Trang chủ**: Hero phim nổi bật, điều hướng theo thể loại, phim đang chiếu / sắp chiếu, hệ thống rạp, ưu đãi
- **Danh sách phim**: Lọc theo trạng thái, thể loại, xếp hạng tuổi; sắp xếp theo phổ biến / mới nhất / ngày khởi chiếu; phân trang
- **Chi tiết phim**: Thông tin đầy đủ (đạo diễn, diễn viên, mô tả, trailer), lịch chiếu theo ngày và rạp
- **Hệ thống rạp**: Danh sách rạp, chi tiết rạp với phòng chiếu và suất chiếu
- **Đặt vé 3 bước**:
  1. **Chọn ghế**: Sơ đồ ghế trực quan (thường / VIP / đôi), ghế đã đặt, giới hạn số ghế
  2. **Chọn vé & combo**: Loại vé (người lớn / học sinh / trẻ em), combo bắp nước
  3. **Thanh toán**: Thông tin liên hệ, mã khuyến mãi, phương thức thanh toán
- **Xác nhận đặt vé**: Mã vé, QR placeholder, chi tiết đầy đủ, hướng dẫn đến rạp
- **Tra cứu vé**: Nhập email để xem vé sắp tới, đã xem, đã hủy
- **Khuyến mãi**: Danh sách mã ưu đãi đang hoạt động

### Quản trị (Admin)
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
| Database | SQLite (Prisma ORM) |
| Runtime | Node.js |

## Cài đặt

### Yêu cầu
- Node.js 18+
- npm

### Bước cài đặt

```bash
# 1. Clone repository
git clone https://github.com/H-thanh0603/Cinemas.git
cd Cinemas

# 2. Cài dependencies
npm install

# 3. Tạo file .env
cp .env.example .env

# 4. Tạo database và seed data
npx prisma migrate dev
npx prisma db seed

# 5. Chạy dev server
npm run dev
```

Truy cập: http://localhost:3000

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
- **User**: Người dùng (CUSTOMER / ADMIN)
- **Movie**: Phim (NOW_SHOWING / COMING_SOON / ARCHIVED)
- **Genre / MovieGenre**: Thể loại (many-to-many)
- **Cinema**: Rạp chiếu
- **Room**: Phòng chiếu (rows × cols)
- **Seat**: Ghế (NORMAL / VIP / COUPLE)
- **Showtime**: Suất chiếu (SCHEDULED / CANCELLED)
- **TicketType**: Loại vé (ADULT / STUDENT / CHILD)
- **FoodCombo**: Combo bắp nước
- **Promotion**: Khuyến mãi (PERCENT / FIXED)
- **Booking**: Đặt vé (PENDING / CONFIRMED / CANCELLED / EXPIRED)
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