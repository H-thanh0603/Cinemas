# Spec — Nâng cấp UI/UX CineStar

## Mục tiêu (≤1 trang)
1. **G1 Atmosphere:** làm nền tối sâu + ambient aurora, refine palette rose/gold, focus/selection state.
2. **G2 Motion:** hero kinetic (progress + parallax + wave chữ), movie card 3D tilt + shine sweep, button sheen, booking steps animate.
3. **G3 Micro-UX:** header scroll progress, badge dot, empty state glass, loading shimmer, countdown "sắp chiếu".
4. **G4 Consistency:** mọi màu mới từ token; reduced-motion đầy đủ; không phá signature cũ.

## Phạm vi (files chạm)
- `src/app/globals.css` — tokens + keyframes + utilities mới (aurora, sheen, tilt, focus)
- `src/components/home/hero-carousel.tsx` — progress + parallax + wave
- `src/components/movies/movie-card.tsx` — tilt + shine + countdown
- `src/components/layout/header.tsx` — scroll progress
- `src/components/booking/progress.tsx` — steps animate
- `src/components/ui/index.tsx` — Badge dot, EmptyState glass, SectionHeading
- `src/app/loading.tsx` + `src/app/movies/loading.tsx` — shimmer (nếu nhẹ)

## Non-goals (KHÔNG làm)
- Không đổi logic nghiệp vụ (booking, payment, auth, API, cron).
- Không đổi route/URL/data model.
- Không thêm dependency mới (dùng framer-motion + lucide sẵn có).
- Không đụng admin panel chi tiết (chỉ hưởng token nền).
- Không đổi copy/nội dung.

## Verify
- `npm run lint` · `npm run typecheck` · `npm run build` pass.
- Screenshot hero + movie card + booking qua browser, critique loop ≤3 vòng.

## Rủi ro
- Framer-motion mới có thể ảnh hưởng SSR → client component giữ nguyên, dùng whileHover/thuộc tính có sẵn.
- 3D tilt cần pointer tracking → giới hạn desktop, reduced-motion tắt.
