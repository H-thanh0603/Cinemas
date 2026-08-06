# CineStar — Brand (v2 — Soft Mint)

## Identity
- **Name:** CineStar (Cine<span mint>Star</span>)
- **Positioning:** Hệ thống rạp chiếu phim hiện đại — "Soft Mint Cinema"
- **Personality:** Soft · Calm · Professional — dịu nhẹ nhưng hiện đại
- **Voice:** Tiếng Việt, gọn, chuyên nghiệp
- **Inspiration:** Cinema Hub (nền đen-xanh lá sâu + CTA mint)

## Palette (design tokens — nguồn: src/app/globals.css @theme)
| Token | Hex | Vai trò |
|-------|-----|---------|
| background | `#010a04` | Nền tối chính (deep green-black) |
| surface | `#04120a` | Card / surface cơ bản |
| surface-raised | `#081a10` | Card nổi / hover |
| surface-hover | `#0d2417` | Hover surface |
| border | `#163024` | Viền cơ bản |
| border-light | `#224533` | Viền nổi bật |
| primary | `#00ff87` | Mint — hành động chính, CTA, link |
| primary-hover | `#00d972` | Hover primary |
| primary-dark | `#00b868` | Gradient deep primary |
| primary-light | `#5cffb0` | Primary sáng (icon) |
| accent | `#5cffb0` | Mint Light — điểm nhấn VIP/ưu đãi |
| accent-hover | `#8affc7` | Hover accent |
| foreground | `#f2f7f4` | Text chính |
| muted | `#8fa89b` | Text phụ (xanh xám dịu) |
| muted-dark | `#5d6f66` | Text mờ |
| success | `#34d399` | Thành công |
| warning | `#fbbf24` | Cảnh báo |
| danger | `#f87171` | Nguy hiểm |
| info | `#60a5fa` | Thông tin |
| on-primary | `#022c22` | **Text trên nền mint** (dark green — tương phản chuẩn) |

## Typography
- **Display:** Outfit (font-display) — tiêu đề, số liệu
- **Body:** Inter (font-sans) — nội dung, giao diện
- Cả hai có subset vietnamese/latin.

## Signature elements
1. **Text gradient:** mint → light mint (`text-gradient`)
2. **Film grain:** lớp nhiễu phim cực nhẹ toàn trang (`film-grain`)
3. **Ambient aurora:** radial mint nhẹ nền (`aurora-bg`)
4. **Glass:** blur + border mỏng (`glass`, `glass-strong`)
5. **Shine border:** viền gradient chạy (`shine-border`)
6. **Cinema screen:** màn hình cong 3D + light beam (`cinema-screen-*`)
7. **Seat experience:** laser sightline mint, sweet spot, âm thanh, fly particle

## Rules
- Mọi component UI dùng token từ bảng trên, không hard-code màu.
- **Text trên primary/accent phải là `#022c22`** (dark green), không dùng white — tương phản đủ.
- Primary = hành động chính. Accent = VIP/ưu đãi/điểm nhấn — dùng tiết chế.
- Dark-first, tối giản, dịu mắt.
