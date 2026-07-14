# TechZone Laptop Store — UI Design Spec

**Date:** 2026-07-14  
**Status:** Approved (design dialogue)  
**Scope:** Full storefront UI with mock data; no real backend/payment

## 1. Goal

Build a multi-page **laptop e-commerce storefront** as a **standalone Next.js app**, visually branded as **TechZone** (dark premium tech). Separate from the existing Cinemas booking app. Ship complete UI flows with mock data and client-side cart/compare/auth.

## 2. Non-goals

- Real payment gateway, inventory, or order APIs
- Prisma / shared DB with Cinemas
- Admin dashboard
- English i18n (Vietnamese only)
- Production SEO / analytics overhaul

## 3. Placement & stack

| Item | Choice |
|------|--------|
| Location | `D:\Cinemas\laptop-store/` (sibling folder to cinema `src/`, not inside it) |
| Framework | Next.js 15 App Router + React 19 |
| Styling | Tailwind CSS 4 |
| Data | TypeScript mock modules under `src/data/` |
| State | React Context + `localStorage` (cart, compare, auth mock) |
| Language | Vietnamese UI copy; VND pricing |

Do **not** modify cinema routes, Prisma schema, or cinema components for this feature.

## 4. Brand & design system

Inherited from existing `laptop-landing.html` where applicable.

| Token | Role |
|-------|------|
| Background | `surface-950` `#020617`; cards `surface-900` |
| Brand blue | `#3381ff` → `#1a5ff5` (CTAs, links, glows) |
| Text | Primary slate-200; muted slate-400; headings white |
| Font | Outfit |
| Surfaces | Subtle borders `white/5–10`, soft hero radial glows |
| Radius | Cards `rounded-xl` / `2xl`; buttons `rounded-lg` |

### UI primitives

`Button`, `Input`, `Badge`, `Card`, `Price`, `Rating`, `EmptyState`, `SectionHeading`, `Toast` (or lightweight alert).

## 5. Sitemap

| Route | Page |
|-------|------|
| `/` | Home |
| `/products` | Product listing (filter, sort, search query) |
| `/products/[slug]` | Product detail |
| `/compare` | Compare 2–3 laptops |
| `/cart` | Cart |
| `/checkout` | Checkout form + success state |
| `/search` | Search results (or thin wrapper around products + `q`) |
| `/blog` | Blog list |
| `/blog/[slug]` | Blog post |
| `/about` | About TechZone |
| `/contact` | Contact form (mock submit) |
| `/login` | Login (mock) |
| `/register` | Register (mock) |
| `/account` | Account hub |
| `/account/orders` | Order list (mock) |
| `/account/orders/[id]` | Order detail (mock) |
| `not-found` | 404 |

### Global chrome

- **Header:** Logo, search, Products, Compare, Blog, Account, Cart badge, mobile nav
- **Footer:** Key links, mock hotline, social placeholders, copyright

## 6. Mock data

Files under `src/data/`:

| File | Content |
|------|---------|
| `products.ts` | 12–16 laptops: slug, name, brand, price, salePrice?, specs (CPU, RAM, SSD, GPU, display, battery, weight), images[], tags[], stock, description |
| `brands.ts` | Apple, Dell, ASUS, Lenovo, HP, MSI, Acer, … |
| `categories.ts` | gaming, office, ultralight, creator |
| `blog-posts.ts` | 4–6 posts: slug, title, excerpt, cover, date, content |
| `orders.ts` | 3–4 sample orders for account views |
| `user.ts` | Demo profile for “logged in” state |

Images: external placeholders (e.g. Unsplash) or CSS gradient fallbacks on cards if load fails.

## 7. Client state

| Store | Shape | Persist |
|-------|--------|---------|
| Cart | `{ productId: string; qty: number }[]` | `localStorage` |
| Compare | up to 3 product IDs | `localStorage` |
| Auth | `isLoggedIn` + demo profile | `localStorage` |

Hydration: read `localStorage` only on client after mount to avoid SSR mismatch.

### Main flows

1. **Purchase:** browse → detail → add to cart → cart → checkout form → success screen with mock order code → optional appearance under orders if logged in
2. **Discover:** header search / `/products?q=` + filters (brand, CPU, RAM, price) + sort
3. **Compare:** add from card/detail → `/compare` spec table
4. **Account:** login/register toggles mock session → account + orders
5. **Content:** blog list/detail; about; contact fake submit feedback

## 8. Project structure

```
laptop-store/
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── public/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx
    │   ├── not-found.tsx
    │   ├── products/page.tsx
    │   ├── products/[slug]/page.tsx
    │   ├── compare/page.tsx
    │   ├── cart/page.tsx
    │   ├── checkout/page.tsx
    │   ├── search/page.tsx
    │   ├── blog/page.tsx
    │   ├── blog/[slug]/page.tsx
    │   ├── about/page.tsx
    │   ├── contact/page.tsx
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   └── account/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       └── orders/page.tsx
    │           └── [id]/page.tsx
    ├── components/
    │   ├── layout/      # Header, Footer, MobileNav, SearchBar
    │   ├── product/     # ProductCard, grid, gallery, filters, compare
    │   ├── cart/        # CartItem, summary, AddToCart
    │   ├── account/     # OrderCard, timeline, AccountNav
    │   ├── blog/        # BlogCard, content
    │   ├── home/        # Hero, brands, deals, featured
    │   └── ui/          # primitives
    ├── data/
    ├── lib/             # formatVnd, cn, filter/search helpers
    └── context/         # cart, compare, auth providers
```

## 9. Page UI checklist

| Page | Must include |
|------|----------------|
| Home | Hero CTA, brand strip, deals, featured grid, blog teaser |
| Products | Filter sidebar, sort, product grid, empty state, URL-driven `q`/filters |
| Detail | Gallery, price/sale, specs, add cart, compare, related products |
| Compare | 2–3 column table, remove slot, empty CTA |
| Cart | Line items, qty, subtotal, checkout CTA, empty state |
| Checkout | Contact/shipping form, order summary, success + mock code |
| Search | Results or empty; link back to catalog |
| Blog | List cards + readable detail typography |
| About | Story + USP (warranty, shipping, support — mock) |
| Contact | Form + client-side “sent” feedback |
| Auth | Login/register forms + cross-links |
| Account | Profile demo + nav to orders |
| Orders | List + detail (items, status timeline) |
| 404 | Branded message + links home/products |

## 10. Error handling & edge cases

- Empty cart / empty compare / no search results → dedicated empty states with CTA
- Invalid product/blog/order slug → `notFound()`
- Account routes when logged out → prompt to login (UI guard only)
- Image failure → gradient/brand placeholder
- Checkout with empty cart → redirect or message to `/products`

## 11. Testing approach

- Primary: manual walkthrough of all routes and cart/compare persistence after reload
- Optional later: Playwright smoke on home → product → cart → checkout
- No coverage gate for pure mock UI phase

## 12. Implementation order (for planning)

1. Scaffold Next.js app + Tailwind + design tokens + root layout (Header/Footer)
2. Mock data modules + `lib` helpers
3. Context providers (cart, compare, auth)
4. UI primitives + ProductCard
5. Home + Products list + Detail
6. Cart + Checkout
7. Compare + Search
8. Blog + About + Contact
9. Auth + Account + Orders
10. 404 polish + final visual pass against TechZone landing

## 13. Success criteria

- All routes in §5 render with coherent TechZone dark UI
- Cart and compare persist across refresh
- Filters/search narrow product list correctly from mock data
- Checkout completes to a success state without a backend
- App runs via `npm run dev` inside `laptop-store/` independently of Cinemas
- Cinema app remains untouched
```
