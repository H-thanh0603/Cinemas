# DESIGN.md — CineStar "Soft Mint Cinema" Upgrade (v2)

> Nâng cấp giao diện, hiệu ứng, UX/UI, màu sắc. **Đổi hướng sang mint xanh lá** theo Cinema Hub: nền đen-xanh lá sâu, CTA mint, chữ xanh lá đậm — dịu nhẹ, hài hòa, chuyên nghiệp.

## 1. Màu sắc (Color) — v2
- **Nền:** đen-xanh lá sâu `#010a04` (thay đen trung tính `#0d0f14`).
- **Primary:** mint `#00ff87` (thay rose `#e8637a`). Accent: mint light `#5cffb0` (thay gold `#f5c518`).
- **Text trên nền mint:** `#022c22` dark green — KHÔNG dùng white (tương phản chuẩn như Cinema Hub).
- **Surface layers:** xanh lá đậm 3 cấp (surface/raised/hover) thay xanh dương tối.
- **Semantic giữ nguyên** (success/warning/danger/info) — đủ tương phản trên nền mới.
- **Focus/selection:** mint ring + mint selection.
- Giữ signature: film grain, glass, shine-border, cinema screen, seat laser (đổi màu sang mint).

## 2. Typography
- Giữ Outfit (display) + Inter (body).
- `tabular-nums` cho số liệu, tracking tight cho heading lớn.
- `.text-balance` cho heading.

## 3. Hiệu ứng (Effects)
- **Hero kinetic:** autoplay progress bar (đếm 7s), parallax chuột nhẹ, chữ vào theo wave.
- **Movie card:** 3D tilt nhẹ theo chuột + shine sweep khi hover + poster zoom; card "sắp chiếu" hiện đếm ngày.
- **Button:** sheen sweep gradient khi hover (primary), glow shadow tăng cấp.
- **Booking steps:** nối line gradient animate, số bước spring.
- **Header:** scroll progress bar (mint, mỏng) dưới header.
- **Loading:** shimmer skeleton cho poster/card.

## 4. UX/UI
- Badge có dot trạng thái, EmptyState icon trong glass tile.
- Reduced-motion: tất cả effect mới đều nằm trong `@media (prefers-reduced-motion: reduce)`.

## Tokens (bổ sung vào @theme)
```
--color-background: #010a04
--color-primary: #00ff87
--color-primary-dark: #00b868
--color-accent: #5cffb0
--color-on-primary: #022c22
--color-ring: rgba(0,255,135,0.55)
```

