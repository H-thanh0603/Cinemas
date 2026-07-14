import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-surface-900/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="font-bold">
            <span className="text-white">Tech</span>
            <span className="text-brand-400">Zone</span>
          </div>
          <p className="mt-3 text-sm text-surface-400">
            Laptop chính hãng, tư vấn cấu hình, bảo hành tận tâm.
          </p>
          <p className="mt-4 text-sm text-surface-300">
            Hotline:{" "}
            <span className="font-medium text-brand-400">1900 0000</span>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Sản phẩm</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-400">
            <li>
              <Link href="/products" className="hover:text-brand-400">
                Tất cả laptop
              </Link>
            </li>
            <li>
              <Link href="/products?category=gaming" className="hover:text-brand-400">
                Gaming
              </Link>
            </li>
            <li>
              <Link href="/compare" className="hover:text-brand-400">
                So sánh
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Hỗ trợ</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-400">
            <li>
              <Link href="/about" className="hover:text-brand-400">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-400">
                Liên hệ
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-brand-400">
                Blog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Tài khoản</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-400">
            <li>
              <Link href="/login" className="hover:text-brand-400">
                Đăng nhập
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-brand-400">
                Đăng ký
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-brand-400">
                Đơn hàng
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-surface-500">
        © {new Date().getFullYear()} TechZone. Giao diện demo — mock data.
      </div>
    </footer>
  );
}
