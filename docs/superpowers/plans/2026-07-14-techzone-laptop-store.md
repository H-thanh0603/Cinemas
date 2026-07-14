# TechZone Laptop Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone Next.js + Tailwind TechZone laptop storefront with full e-commerce UI pages, mock data, and client-side cart/compare/auth — without touching the Cinemas app.

**Architecture:** New app at `laptop-store/` (App Router). Mock catalogs in `src/data/`. Cart, compare, and auth mock via React Context + `localStorage`. Shared dark TechZone tokens in `globals.css` / Tailwind theme. All copy Vietnamese; prices VND.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Vitest (pure helpers only)

## Global Constraints

- App root: `laptop-store/` only — do not modify Cinemas `src/`, Prisma, or cinema routes
- UI language: Vietnamese; currency: VND via `formatVnd`
- Brand: TechZone dark (`#020617` surface, brand blue `#3381ff` / `#1a5ff5`, font Outfit)
- No real backend, payment, email, or admin
- Cart/compare/auth persist in `localStorage`; hydrate after mount (no SSR mismatch)
- Spec: `docs/superpowers/specs/2026-07-14-techzone-laptop-store-design.md`

---

## File map (create under `laptop-store/`)

| Path | Responsibility |
|------|----------------|
| `package.json`, configs | Next 15, Tailwind 4, Vitest, scripts |
| `src/app/globals.css` | Tokens, base dark styles, Outfit import |
| `src/app/layout.tsx` | Providers + Header + Footer shell |
| `src/app/page.tsx` | Home |
| `src/app/not-found.tsx` | 404 |
| `src/app/products/page.tsx` | Catalog + filters |
| `src/app/products/[slug]/page.tsx` | Detail |
| `src/app/compare/page.tsx` | Compare table |
| `src/app/cart/page.tsx` | Cart |
| `src/app/checkout/page.tsx` | Checkout + success |
| `src/app/search/page.tsx` | Search results |
| `src/app/blog/page.tsx`, `[slug]/page.tsx` | Blog |
| `src/app/about/page.tsx`, `contact/page.tsx` | Static/marketing |
| `src/app/login/page.tsx`, `register/page.tsx` | Auth mock forms |
| `src/app/account/layout.tsx`, `page.tsx`, `orders/...` | Account area |
| `src/types/index.ts` | Shared types |
| `src/data/*.ts` | Mock products, brands, categories, blog, orders, user |
| `src/lib/cn.ts`, `format.ts`, `products.ts` | Utilities + filter/search |
| `src/context/*.tsx` | Cart, Compare, Auth providers |
| `src/components/**` | Layout, product, cart, account, blog, home, ui |
| `src/lib/*.test.ts` | Vitest for pure logic |

---

### Task 1: Scaffold Next.js app + design tokens

**Files:**
- Create: `laptop-store/package.json`
- Create: `laptop-store/tsconfig.json`
- Create: `laptop-store/next.config.ts`
- Create: `laptop-store/postcss.config.mjs`
- Create: `laptop-store/next-env.d.ts`
- Create: `laptop-store/vitest.config.ts`
- Create: `laptop-store/src/app/globals.css`
- Create: `laptop-store/src/app/layout.tsx`
- Create: `laptop-store/src/app/page.tsx` (temporary placeholder)
- Create: `laptop-store/.gitignore`

**Interfaces:**
- Produces: runnable `npm run dev` on port 3001 (avoid clash with Cinemas on 3000)

- [ ] **Step 1: Create `laptop-store/package.json`**

```json
{
  "name": "techzone-laptop-store",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.10.7",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.3",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Add configs**

`tsconfig.json` — standard Next App Router strict config with `"paths": { "@/*": ["./src/*"] }`.

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
    ],
  },
};
export default nextConfig;
```

`postcss.config.mjs`:
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

`.gitignore`: `node_modules`, `.next`, `out`, `.env*`, `*.tsbuildinfo`

- [ ] **Step 3: Create `src/app/globals.css`**

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");

@theme {
  --font-sans: "Outfit", system-ui, sans-serif;
  --color-brand-50: #eef6ff;
  --color-brand-100: #d9eaff;
  --color-brand-200: #bcdbff;
  --color-brand-300: #8ec5ff;
  --color-brand-400: #59a5ff;
  --color-brand-500: #3381ff;
  --color-brand-600: #1a5ff5;
  --color-brand-700: #134ae1;
  --color-brand-800: #163db6;
  --color-brand-900: #18378f;
  --color-brand-950: #142257;
  --color-surface-50: #f8fafc;
  --color-surface-100: #f1f5f9;
  --color-surface-200: #e2e8f0;
  --color-surface-300: #cbd5e1;
  --color-surface-400: #94a3b8;
  --color-surface-500: #64748b;
  --color-surface-600: #475569;
  --color-surface-700: #334155;
  --color-surface-800: #1e293b;
  --color-surface-900: #0f172a;
  --color-surface-950: #020617;
}

html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background: var(--color-surface-950);
  color: var(--color-surface-200);
  min-height: 100vh;
}
```

- [ ] **Step 4: Minimal root layout + home placeholder**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TechZone — Laptop cao cấp", template: "%s | TechZone" },
  description: "Cửa hàng laptop chính hãng — TechZone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-white">TechZone</h1>
      <p className="mt-2 text-surface-400">Scaffold OK — port 3001</p>
    </main>
  );
}
```

- [ ] **Step 5: Install and verify**

```bash
cd laptop-store && npm install && npm run dev
```

Expected: http://localhost:3001 shows “TechZone” / Scaffold OK. Stop dev server after check.

- [ ] **Step 6: Commit**

```bash
git add laptop-store
git commit -m "feat(laptop-store): scaffold Next.js TechZone app on port 3001"
```

---

### Task 2: Types + mock data

**Files:**
- Create: `laptop-store/src/types/index.ts`
- Create: `laptop-store/src/data/brands.ts`
- Create: `laptop-store/src/data/categories.ts`
- Create: `laptop-store/src/data/products.ts`
- Create: `laptop-store/src/data/blog-posts.ts`
- Create: `laptop-store/src/data/orders.ts`
- Create: `laptop-store/src/data/user.ts`
- Create: `laptop-store/src/data/index.ts`

**Interfaces:**
- Produces:
  - `Product`, `Brand`, `Category`, `BlogPost`, `Order`, `UserProfile`
  - `products: Product[]` length ≥ 12
  - `getProductBySlug(slug: string): Product | undefined`
  - `getBlogBySlug`, `getOrderById` helpers in data or lib

- [ ] **Step 1: Define types**

```ts
// src/types/index.ts
export type BrandId =
  | "apple" | "dell" | "asus" | "lenovo" | "hp" | "msi" | "acer";

export type CategoryId = "gaming" | "office" | "ultralight" | "creator";

export interface ProductSpecs {
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  display: string;
  battery: string;
  weight: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: BrandId;
  category: CategoryId;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  description: string;
  specs: ProductSpecs;
  images: string[];
  featured?: boolean;
  deal?: boolean;
}

export interface Brand {
  id: BrandId;
  name: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  date: string; // ISO date
  author: string;
  content: string; // HTML or plain paragraphs joined by \n\n
}

export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  customerName: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}
```

- [ ] **Step 2: Seed brands, categories, 12–16 products**

- Brands: map of BrandId → display name  
- Categories: 4 entries with Vietnamese names (Gaming, Văn phòng, Siêu mỏng, Đồ họa)  
- Products: mix of brands/categories; at least 4 `featured`, 4 `deal`; prices in VND integers (e.g. 18_990_000); Unsplash laptop image URLs  
- Export `products`, `getProductBySlug`, `getProductById`, `getRelatedProducts(product, limit=4)`

- [ ] **Step 3: Seed blog (4–6), orders (3–4), demo user**

```ts
// user.ts
export const demoUser: UserProfile = {
  id: "u1",
  name: "Nguyễn Văn A",
  email: "demo@techzone.vn",
  phone: "0901234567",
};
```

Orders reference real `productId`s from catalog. Blog content: 2–4 short Vietnamese paragraphs each.

- [ ] **Step 4: Barrel export `src/data/index.ts`**

- [ ] **Step 5: Commit**

```bash
git add laptop-store/src/types laptop-store/src/data
git commit -m "feat(laptop-store): add types and mock catalog data"
```

---

### Task 3: Lib helpers + Vitest (TDD)

**Files:**
- Create: `laptop-store/src/lib/cn.ts`
- Create: `laptop-store/src/lib/format.ts`
- Create: `laptop-store/src/lib/products.ts`
- Create: `laptop-store/src/lib/format.test.ts`
- Create: `laptop-store/src/lib/products.test.ts`

**Interfaces:**
- Produces:
  - `cn(...inputs: (string | false | null | undefined)[]): string`
  - `formatVnd(amount: number): string` → e.g. `18.990.000₫`
  - `ProductFilter` type + `filterProducts(products, filter): Product[]`
  - `sortProducts(products, sort: ProductSort): Product[]`
  - `searchProducts(products, q: string): Product[]`

- [ ] **Step 1: Write failing tests**

```ts
// format.test.ts
import { describe, it, expect } from "vitest";
import { formatVnd } from "./format";

describe("formatVnd", () => {
  it("formats millions with dots and dong sign", () => {
    expect(formatVnd(18990000)).toBe("18.990.000₫");
  });
  it("formats zero", () => {
    expect(formatVnd(0)).toBe("0₫");
  });
});
```

```ts
// products.test.ts
import { describe, it, expect } from "vitest";
import { filterProducts, searchProducts, sortProducts } from "./products";
import type { Product } from "@/types";

const sample: Product[] = [
  {
    id: "1", slug: "a", name: "ASUS ROG Strix", brand: "asus", category: "gaming",
    price: 30_000_000, salePrice: 28_000_000, rating: 4.5, reviewCount: 10,
    stock: 5, tags: ["gaming"], description: "", specs: {
      cpu: "i7", ram: "16GB", storage: "512GB", gpu: "RTX", display: "15",
      battery: "70Wh", weight: "2kg",
    }, images: [],
  },
  {
    id: "2", slug: "b", name: "MacBook Air M3", brand: "apple", category: "ultralight",
    price: 28_000_000, rating: 5, reviewCount: 20, stock: 3, tags: [], description: "",
    specs: {
      cpu: "M3", ram: "8GB", storage: "256GB", gpu: "GPU 8", display: "13",
      battery: "50Wh", weight: "1.2kg",
    }, images: [],
  },
];

describe("filterProducts", () => {
  it("filters by brand", () => {
    expect(filterProducts(sample, { brands: ["apple"] })).toHaveLength(1);
  });
  it("filters by price range using effective price", () => {
    expect(filterProducts(sample, { minPrice: 29_000_000 })).toHaveLength(0);
    expect(filterProducts(sample, { maxPrice: 28_500_000 })).toHaveLength(2);
  });
});

describe("searchProducts", () => {
  it("matches name case-insensitively", () => {
    expect(searchProducts(sample, "macbook")).toHaveLength(1);
  });
});

describe("sortProducts", () => {
  it("sorts price-asc by effective price", () => {
    const sorted = sortProducts(sample, "price-asc");
    expect(sorted[0].id).toBe("2");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd laptop-store && npm test
```

Expected: modules not found / FAIL

- [ ] **Step 3: Implement**

```ts
// cn.ts
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(" ");
}
```

```ts
// format.ts
export function formatVnd(amount: number): string {
  const formatted = Math.round(amount).toLocaleString("vi-VN");
  return `${formatted}₫`;
}
```

```ts
// products.ts
import type { BrandId, CategoryId, Product } from "@/types";

export type ProductSort = "price-asc" | "price-desc" | "newest" | "rating";

export interface ProductFilter {
  q?: string;
  brands?: BrandId[];
  categories?: CategoryId[];
  minPrice?: number;
  maxPrice?: number;
  minRamGb?: number; // parse from specs.ram e.g. "16GB"
}

export function effectivePrice(p: Product): number {
  return p.salePrice ?? p.price;
}

export function filterProducts(list: Product[], f: ProductFilter): Product[] {
  return list.filter((p) => {
    if (f.brands?.length && !f.brands.includes(p.brand)) return false;
    if (f.categories?.length && !f.categories.includes(p.category)) return false;
    const price = effectivePrice(p);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.minRamGb != null) {
      const ram = parseInt(p.specs.ram, 10);
      if (Number.isNaN(ram) || ram < f.minRamGb) return false;
    }
    if (f.q?.trim()) {
      const q = f.q.trim().toLowerCase();
      const hay = `${p.name} ${p.brand} ${p.tags.join(" ")} ${p.specs.cpu}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function searchProducts(list: Product[], q: string): Product[] {
  return filterProducts(list, { q });
}

export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price-desc":
      return copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
    default:
      return copy; // catalog order = "newest"
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd laptop-store && npm test
```

- [ ] **Step 5: Commit**

```bash
git add laptop-store/src/lib
git commit -m "feat(laptop-store): add format and product filter helpers with tests"
```

---

### Task 4: Context providers (cart, compare, auth)

**Files:**
- Create: `laptop-store/src/context/cart-context.tsx`
- Create: `laptop-store/src/context/compare-context.tsx`
- Create: `laptop-store/src/context/auth-context.tsx`
- Create: `laptop-store/src/context/providers.tsx`
- Modify: `laptop-store/src/app/layout.tsx` — wrap with `<Providers>`

**Interfaces:**
- Produces:
  - `useCart()`: `{ items, addItem(productId, qty?), removeItem, setQty, clear, count, subtotal, hydrated }`
  - `useCompare()`: `{ ids, toggle(id), remove(id), clear, hydrated }` max 3
  - `useAuth()`: `{ user, isLoggedIn, login(email, password), register(...), logout, hydrated }`
  - Storage keys: `tz_cart`, `tz_compare`, `tz_auth`

- [ ] **Step 1: Implement cart context**

Client component (`"use client"`). On mount read `tz_cart`.  
`addItem`: if exists, increment qty.  
`subtotal`: sum `effectivePrice(product) * qty` using `getProductById`.  
`count`: sum of qtys.

- [ ] **Step 2: Implement compare context**

Max 3 IDs; `toggle` removes if present else push if length < 3 (else ignore or replace oldest — **ignore with no-op when full**, UI shows toast later).

- [ ] **Step 3: Implement auth context**

`login` / `register`: any non-empty email+password → set `isLoggedIn` true and `user = demoUser` (register may override name). Persist `{ isLoggedIn, user }`.

- [ ] **Step 4: Compose `Providers` and wire layout**

```tsx
// providers.tsx
"use client";
import { CartProvider } from "./cart-context";
import { CompareProvider } from "./compare-context";
import { AuthProvider } from "./auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CompareProvider>{children}</CompareProvider>
      </CartProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 5: Manual smoke**

Temporarily log contexts on a client test button OR wait until Header in Task 5. At minimum `npm run typecheck` passes.

- [ ] **Step 6: Commit**

```bash
git add laptop-store/src/context laptop-store/src/app/layout.tsx
git commit -m "feat(laptop-store): add cart, compare, and auth context providers"
```

---

### Task 5: UI primitives + layout chrome

**Files:**
- Create: `laptop-store/src/components/ui/button.tsx`
- Create: `laptop-store/src/components/ui/input.tsx`
- Create: `laptop-store/src/components/ui/badge.tsx`
- Create: `laptop-store/src/components/ui/card.tsx`
- Create: `laptop-store/src/components/ui/price.tsx`
- Create: `laptop-store/src/components/ui/rating.tsx`
- Create: `laptop-store/src/components/ui/empty-state.tsx`
- Create: `laptop-store/src/components/ui/section-heading.tsx`
- Create: `laptop-store/src/components/ui/index.ts`
- Create: `laptop-store/src/components/layout/header.tsx`
- Create: `laptop-store/src/components/layout/footer.tsx`
- Create: `laptop-store/src/components/layout/search-bar.tsx`
- Create: `laptop-store/src/components/layout/mobile-nav.tsx`
- Modify: `laptop-store/src/app/layout.tsx` — Header/Footer around children

**Interfaces:**
- `Button` variants: `primary` | `secondary` | `ghost` | `danger`; sizes `sm` | `md` | `lg`
- `Price` shows sale strikethrough when `salePrice` set
- Header: logo → `/`, links Products/Compare/Blog, SearchBar → `/search?q=` or `/products?q=`, cart badge from `useCart().count`, account link

- [ ] **Step 1: Build primitives with TechZone styles** (dark cards, brand primary button)

- [ ] **Step 2: Build Header/Footer/SearchBar/MobileNav**

Header sticky `bg-surface-950/80 backdrop-blur border-b border-white/5`.  
Footer columns: Sản phẩm, Hỗ trợ, Liên hệ; hotline `1900 0000` mock.

- [ ] **Step 3: Update layout**

```tsx
<body>
  <Providers>
    <Header />
    <main className="min-h-[70vh]">{children}</main>
    <Footer />
  </Providers>
</body>
```

- [ ] **Step 4: Verify in browser** — nav links work; cart badge 0

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): add UI primitives and site chrome"
```

---

### Task 6: Product components + Home page

**Files:**
- Create: `laptop-store/src/components/product/product-card.tsx`
- Create: `laptop-store/src/components/product/product-grid.tsx`
- Create: `laptop-store/src/components/home/hero.tsx`
- Create: `laptop-store/src/components/home/brand-strip.tsx`
- Create: `laptop-store/src/components/home/deal-section.tsx`
- Create: `laptop-store/src/components/home/featured-grid.tsx`
- Create: `laptop-store/src/components/home/blog-teaser.tsx`
- Modify: `laptop-store/src/app/page.tsx`

**Interfaces:**
- `ProductCard` props: `{ product: Product }` — image, name, brand, Price, Rating, links to detail; buttons add cart / compare (client subcomponent)
- Home sections use `products.filter(p => p.deal)`, `featured`, `blogPosts.slice(0,3)`

- [ ] **Step 1: ProductCard + ProductGrid**

- [ ] **Step 2: Home sections + assemble page**

Hero: headline “Laptop cao cấp cho mọi nhu cầu”, CTA “Xem sản phẩm” → `/products`, secondary “So sánh” → `/compare`. Soft brand glows.

- [ ] **Step 3: Browser check home** — 4 sections visible, cards clickable

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(laptop-store): home page and product cards"
```

---

### Task 7: Products list + product detail

**Files:**
- Create: `laptop-store/src/components/product/filter-sidebar.tsx`
- Create: `laptop-store/src/components/product/sort-select.tsx`
- Create: `laptop-store/src/components/product/product-gallery.tsx`
- Create: `laptop-store/src/components/product/spec-table.tsx`
- Create: `laptop-store/src/components/product/add-to-cart-button.tsx`
- Create: `laptop-store/src/components/product/compare-toggle.tsx`
- Create: `laptop-store/src/app/products/page.tsx`
- Create: `laptop-store/src/app/products/[slug]/page.tsx`

**Interfaces:**
- Products page is client or hybrid: read `searchParams` (`q`, `brand`, `category`, `sort`, `min`, `max`)
- Detail: `generateStaticParams` optional from product slugs; `notFound()` if missing
- Related: `getRelatedProducts`

- [ ] **Step 1: FilterSidebar + SortSelect wired to URL via `useRouter` + query string**

- [ ] **Step 2: Products page** — apply `filterProducts` + `sortProducts`, EmptyState when none

- [ ] **Step 3: Detail page** — gallery, specs, AddToCart, CompareToggle, related grid

- [ ] **Step 4: Verify** filter brand=asus; open slug; add to cart updates badge

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): product listing, filters, and detail pages"
```

---

### Task 8: Cart + Checkout

**Files:**
- Create: `laptop-store/src/components/cart/cart-item.tsx`
- Create: `laptop-store/src/components/cart/cart-summary.tsx`
- Create: `laptop-store/src/app/cart/page.tsx`
- Create: `laptop-store/src/app/checkout/page.tsx` (`"use client"`)

**Interfaces:**
- Cart: list items with qty controls, remove, summary, CTA `/checkout`
- Empty cart → EmptyState link `/products`
- Checkout form fields: `fullName`, `phone`, `email`, `address`, `note`
- On submit: validate required fields; generate code `TZ` + random 6 digits; `clear()` cart; show success panel with code; if `isLoggedIn`, optionally `sessionStorage` last order for UX (orders list remains mock data — success is local UI only)

- [ ] **Step 1: Cart page UI**

- [ ] **Step 2: Checkout form + success state**

- [ ] **Step 3: Empty cart visiting `/checkout` redirects to `/cart` or shows message + link

- [ ] **Step 4: Manual flow home → add → cart → checkout → success; refresh cart empty

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): cart and mock checkout flow"
```

---

### Task 9: Compare + Search

**Files:**
- Create: `laptop-store/src/components/product/compare-bar.tsx` (optional floating when ids.length > 0)
- Create: `laptop-store/src/app/compare/page.tsx`
- Create: `laptop-store/src/app/search/page.tsx`

**Interfaces:**
- Compare: columns for each product + rows for price and each spec key; remove button per column
- Empty compare → CTA to products
- Search page: `searchParams.q` → `searchProducts`; reuse ProductGrid

- [ ] **Step 1: Compare page table**

- [ ] **Step 2: Search page**

- [ ] **Step 3: Optional CompareBar in layout when `ids.length > 0`

- [ ] **Step 4: Verify max 3 compare slots; search “macbook”

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): compare and search pages"
```

---

### Task 10: Blog + About + Contact

**Files:**
- Create: `laptop-store/src/components/blog/blog-card.tsx`
- Create: `laptop-store/src/app/blog/page.tsx`
- Create: `laptop-store/src/app/blog/[slug]/page.tsx`
- Create: `laptop-store/src/app/about/page.tsx`
- Create: `laptop-store/src/app/contact/page.tsx`

**Interfaces:**
- Blog detail: `notFound` if bad slug; render content paragraphs
- Contact: client form; on submit set local `sent` true (no network)

- [ ] **Step 1: Blog list + detail**

- [ ] **Step 2: About** — story + 3 USP cards (Bảo hành, Giao hàng, Hỗ trợ)

- [ ] **Step 3: Contact form mock**

- [ ] **Step 4: Browser check all three areas

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): blog, about, and contact pages"
```

---

### Task 11: Auth + Account + Orders

**Files:**
- Create: `laptop-store/src/components/account/account-nav.tsx`
- Create: `laptop-store/src/components/account/order-card.tsx`
- Create: `laptop-store/src/components/account/order-timeline.tsx`
- Create: `laptop-store/src/app/login/page.tsx`
- Create: `laptop-store/src/app/register/page.tsx`
- Create: `laptop-store/src/app/account/layout.tsx`
- Create: `laptop-store/src/app/account/page.tsx`
- Create: `laptop-store/src/app/account/orders/page.tsx`
- Create: `laptop-store/src/app/account/orders/[id]/page.tsx`

**Interfaces:**
- Login/Register: client forms → `login`/`register` → redirect `/account`
- Account layout: if `hydrated && !isLoggedIn` show “Vui lòng đăng nhập” + link (do not hard-crash)
- Orders: list from `orders` mock; detail `getOrderById` + timeline by status

- [ ] **Step 1: Login + Register pages**

- [ ] **Step 2: Account hub + nav**

- [ ] **Step 3: Orders list + detail + timeline**

- [ ] **Step 4: Flow register → account → orders → detail; logout returns guest header

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(laptop-store): mock auth and account orders UI"
```

---

### Task 12: 404, polish, README, final verify

**Files:**
- Create: `laptop-store/src/app/not-found.tsx`
- Create: `laptop-store/README.md`
- Modify: any visual polish (hover, spacing, empty states consistency)

**Interfaces:**
- 404: message + buttons Home / Products
- README: `npm install`, `npm run dev` (port 3001), script list, note “mock UI only”

- [ ] **Step 1: not-found page**

- [ ] **Step 2: README**

- [ ] **Step 3: Full route walkthrough checklist**

Visit and confirm render:
`/`, `/products`, one product slug, `/compare`, `/cart`, `/checkout`, `/search?q=asus`, `/blog`, one blog slug, `/about`, `/contact`, `/login`, `/register`, `/account`, `/orders`, one order id, unknown URL 404.

- [ ] **Step 4: `npm run typecheck` && `npm test` && `npm run build`**

Expected: all pass / build success.

- [ ] **Step 5: Final commit**

```bash
git add laptop-store
git commit -m "feat(laptop-store): 404, README, and storefront polish"
```

---

## Spec coverage (self-review)

| Spec section | Tasks |
|--------------|-------|
| Standalone `laptop-store/` | 1 |
| TechZone dark tokens | 1, 5 |
| Sitemap all routes | 6–12 |
| Mock data | 2 |
| Cart/compare/auth localStorage | 4, 8, 9, 11 |
| Filters/search | 3, 7, 9 |
| Checkout mock success | 8 |
| Blog/About/Contact | 10 |
| Account orders | 11 |
| 404 | 12 |
| No cinema changes | Global constraint |
| Helper tests | 3 |

## Placeholder / consistency notes

- Storage keys fixed: `tz_cart`, `tz_compare`, `tz_auth`
- Sort keys fixed: `price-asc` | `price-desc` | `newest` | `rating`
- Product identity: `id` + `slug`; cart stores `productId`
- Port **3001** throughout

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-14-techzone-laptop-store.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session, executing-plans with batch checkpoints  

Which approach?
```
