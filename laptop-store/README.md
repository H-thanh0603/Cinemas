# TechZone Laptop Store

Standalone Next.js storefront (mock data) — **tách biệt** app Cinemas.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Vitest (helpers)
- Cart / compare / auth mock via `localStorage`

## Chạy local

```bash
cd laptop-store
npm install
npm run dev
```

Mở [http://localhost:3001](http://localhost:3001)

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server port **3001** |
| `npm run build` | Production build |
| `npm run start` | Start production (3001) |
| `npm test` | Vitest unit tests |
| `npm run typecheck` | `tsc --noEmit` |

## Trang chính

`/` · `/products` · `/products/[slug]` · `/compare` · `/cart` · `/checkout` · `/search` · `/blog` · `/about` · `/contact` · `/login` · `/register` · `/account` · `/account/orders`

## Lưu ý

- **UI demo only** — không thanh toán, không API backend.
- Brand: TechZone dark (Outfit + brand blue).
