import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-surface-900 via-surface-950 to-brand-950/40 px-6 py-16 sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full bg-brand-600/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
          TechZone Store
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Laptop cao cấp cho mọi nhu cầu
        </h1>
        <p className="mt-4 text-base text-surface-300 sm:text-lg">
          Gaming, văn phòng, sáng tạo — chính hãng, giá rõ ràng, tư vấn cấu hình
          miễn phí.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products">
            <Button size="lg">Xem sản phẩm</Button>
          </Link>
          <Link href="/compare">
            <Button size="lg" variant="secondary">
              So sánh laptop
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
