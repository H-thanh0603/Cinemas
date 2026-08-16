"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#features", label: "Tính năng" },
  { href: "#movies", label: "Phim hot" },
  { href: "#pricing", label: "Bảng giá" },
  { href: "#faq", label: "FAQ" },
];

const features = [
  {
    icon: "🎬",
    title: "Kho phim khổng lồ",
    desc: "Hơn 10.000+ bộ phim điện ảnh, phim bộ, TV shows chất lượng 4K từ Hollywood, Hàn Quốc, Nhật Bản, Việt Nam và nhiều quốc gia khác.",
  },
  {
    icon: "⚡",
    title: "Phát mượt mà, không giật",
    desc: "Công nghệ streaming adaptive bitrate tự động điều chỉnh chất lượng theo mạng, xem phim mượt mà trên mọi thiết bị.",
  },
  {
    icon: "📱",
    title: "Xem trên mọi thiết bị",
    desc: "Trải nghiệm xem phim đồng bộ trên TV, laptop, tablet, điện thoại. Xem tiếp phần đang dở khi chuyển thiết bị.",
  },
  {
    icon: "🌐",
    title: "Phụ đề đa ngữ",
    desc: "Phụ đề tiếng Việt, tiếng Anh, tiếng Hàn, tiếng Nhật... Cùng lúc xem nhiều ngôn ngữ phụ đề và lồng tiếng chất lượng cao.",
  },
  {
    icon: "🔒",
    title: "An toàn & bảo mật",
    desc: "Thanh toán mã hoá SSL, bảo mật thông tin cá nhân theo tiêu chuẩn quốc tế. Không quảng cáo, không popup khó chịu.",
  },
  {
    icon: "⭐",
    title: "Gợi ý thông minh",
    desc: "AI phân tích sở thích xem phim của bạn để gợi ý những bộ phim phù hợp nhất. Càng xem càng hay.",
  },
];

const trendingMovies = [
  { title: "Người Nhện: Vũ Trụ Mới", genre: "Hành động · Siêu anh hùng", rating: 8.7, badge: "HOT" },
  { title: "Hóa Vàng Trên Biển", genre: "Phiêu lưu · Hài hước", rating: 8.3, badge: "MỚI" },
  { title: "Bản Giao Hưởng Đêm", genre: "Kinh dị · Bí ẩn", rating: 7.9, badge: "4K" },
  { title: "Tình Yêu Mùa Hạ", genre: "Lãng mạn · Tâm lý", rating: 8.1, badge: "HOT" },
  { title: "Vương Quốc Phương Đông", genre: "Cổ trang · Chiến tranh", rating: 9.0, badge: "EXCLUSIVE" },
  { title: "Cuộc Đua Tử Thần", genre: "Hành động · Hồi hộp", rating: 8.5, badge: "MỚI" },
];

const pricingPlans = [
  {
    name: "Cơ bản",
    price: "49.000",
    period: "/tháng",
    desc: "Hoàn hảo cho người mới bắt đầu",
    features: [
      "Xem trên 1 thiết bị cùng lúc",
      "Chất lượng HD 720p",
      "Tải xuống 5 phim/tháng",
      "Hỗ trợ qua email",
    ],
    cta: "Đăng ký ngay",
    highlight: false,
  },
  {
    name: "Tiêu chuẩn",
    price: "99.000",
    period: "/tháng",
    desc: "Phù hợp cho cá nhân và cặp đôi",
    features: [
      "Xem trên 2 thiết bị cùng lúc",
      "Chất lượng Full HD 1080p",
      "Tải xuống không giới hạn",
      "Không quảng cáo",
      "Hỗ trợ ưu tiên 24/7",
    ],
    cta: "Đăng ký ngay",
    highlight: true,
  },
  {
    name: "Cao cấp",
    price: "169.000",
    period: "/tháng",
    desc: "Trải nghiệm điện ảnh đỉnh cao",
    features: [
      "Xem trên 4 thiết bị cùng lúc",
      "Chất lượng 4K Ultra HD + HDR",
      "Tải xuống không giới hạn",
      "Âm thanh Dolby Atmos",
      "Suất chiếu sớm độc quyền",
      "Hỗ trợ VIP 24/7",
    ],
    cta: "Đăng ký ngay",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Minh Anh",
    role: "Sinh viên",
    avatar: "M",
    content: "Web xem phim mượt nhất mình từng dùng. Kho phim cực nhiều, phụ đề tiếng Việt chuẩn, không bị quảng cáo làm phiền. Rất đáng đồng tiền!",
  },
  {
    name: "Hoàng Nam",
    role: "Nhân viên văn phòng",
    avatar: "H",
    content: "Mình thường xem phim trên TV ở nhà và điện thoại khi đi làm. Tính năng đồng bộ tiếp tục xem rất tiện. Chất lượng 4K cực kỳ ấn tượng.",
  },
  {
    name: "Thu Hà",
    role: "Nội trợ",
    avatar: "T",
    content: "Cả gia đình mình cùng dùng 1 tài khoản, mỗi người xem trên 1 thiết bị mà không bị giật lag. Gói Cao cấp rất xứng đáng với Dolby Atmos.",
  },
];

const faqs = [
  {
    q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
    a: "Có. Bạn có thể hủy gói đăng ký bất cứ lúc nào trong phần quản lý tài khoản. Sau khi hủy, bạn vẫn xem phim được đến khi hết chu kỳ thanh toán hiện tại. Không phí hủy, không ràng buộc.",
  },
  {
    q: "Tôi có thể xem phim trên những thiết bị nào?",
    a: "Bạn có thể xem phim trên Smart TV, laptop, máy tính để bàn, tablet, điện thoại thông minh (iOS và Android), và các thiết bị Chromecast/Apple TV. Tải app hoặc truy cập qua trình duyệt.",
  },
  {
    q: "Có dùng thử miễn phí không?",
    a: "Có. Chúng tôi cung cấp 7 ngày dùng thử miễn phí cho tất cả các gói. Bạn không cần nhập thông tin thanh toán để đăng ký dùng thử. Hủy bất cứ lúc nào trong 7 ngày mà không mất phí.",
  },
  {
    q: "Chất lượng phim tối đa là bao nhiêu?",
    a: "Gói Cao cấp hỗ trợ chất lượng 4K Ultra HD với HDR và âm thanh Dolby Atmos. Gói Tiêu chuẩn hỗ trợ Full HD 1080p. Gói Cơ bản hỗ trợ HD 720p. Chất lượng thực tế phụ thuộc vào thiết bị và tốc độ mạng.",
  },
  {
    q: "Tôi có thể tải phim để xem offline không?",
    a: "Có. Tất cả các gói đều hỗ trợ tải phim xuống thiết bị để xem offline. Gói Cơ bản giới hạn 5 phim/tháng, gói Tiêu chuẩn và Cao cấp không giới hạn số lượng tải xuống.",
  },
  {
    q: "Phim có phụ đề tiếng Việt không?",
    a: "Hầu hết các bộ phim đều có phụ đề tiếng Việt. Nhiều phim còn có lồng tiếng tiếng Việt chất lượng cao. Bạn cũng có thể chọn phụ đề tiếng Anh, tiếng Hàn, tiếng Nhật và nhiều ngôn ngữ khác.",
  },
];

const stats = [
  { value: "10K+", label: "Bộ phim" },
  { value: "2M+", label: "Người dùng" },
  { value: "4K", label: "Chất lượng tối đa" },
  { value: "24/7", label: "Hỗ trợ" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">
              C
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Cine<span className="text-primary">Stream</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Đăng nhập
            </Link>
            <Link
              href="#pricing"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Dùng thử miễn phí
            </Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-muted hover:bg-surface-raised hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Dùng thử miễn phí
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              7 ngày dùng thử miễn phí
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Xem phim không giới hạn.
              <br />
              <span className="text-gradient">Mọi lúc, mọi nơi.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Hơn 10.000 bộ phim điện ảnh, phim bộ và TV shows chất lượng 4K.
              Phát mượt mà trên mọi thiết bị, phụ đề tiếng Việt, không quảng cáo.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#pricing"
                className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-primary/40"
              >
                Bắt đầu dùng thử
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#movies"
                className="flex items-center gap-2 rounded-xl border border-border-light bg-surface/60 px-8 py-4 text-base font-semibold backdrop-blur transition-colors hover:bg-surface-hover"
              >
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Xem trailer
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-extrabold text-gradient sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            Tính năng nổi bật
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Trải nghiệm xem phim đỉnh cao
          </h2>
          <p className="mt-4 text-lg text-muted">
            Mọi thứ bạn cần cho những giờ phút giải trí tuyệt vời nhất
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-surface p-8 transition-all hover:border-primary/40 hover:bg-surface-raised hover:shadow-xl hover:shadow-primary/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                {feature.icon}
              </span>
              <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Movies */}
      <section id="movies" className="border-y border-border bg-surface/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-primary">
                Đang thịnh hành
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Phim hot tuần này
              </h2>
            </div>
            <Link
              href="#"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {trendingMovies.map((movie) => (
              <div
                key={movie.title}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-surface-raised to-surface">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-20 transition-opacity group-hover:opacity-40">
                      🎬
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    {movie.badge}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-accent">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.rating}
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-tight">
                      {movie.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                      {movie.genre}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            Đơn giản & nhanh chóng
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Bắt đầu xem phim trong 3 bước
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Đăng ký tài khoản", desc: "Tạo tài khoản miễn phí trong 30 giây. Chỉ cần email và mật khẩu." },
            { step: "02", title: "Chọn gói phù hợp", desc: "Lựa chọn gói đăng ký phù hợp nhu cầu. Dùng thử 7 ngày miễn phí." },
            { step: "03", title: "Bắt đầu xem phim", desc: "Kho phim 10.000+ bộ phim đã sẵn sàng. Xem ngay trên mọi thiết bị." },
          ].map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 text-3xl font-extrabold text-primary">
                {item.step}
              </div>
              <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-surface/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">
              Bảng giá
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Chọn gói phù hợp với bạn
            </h2>
            <p className="mt-4 text-lg text-muted">
              Tất cả gói đều bao gồm 7 ngày dùng thử miễn phí. Hủy bất cứ lúc nào.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-8 transition-all ${
                  plan.highlight
                    ? "border-primary bg-gradient-to-b from-primary/10 to-surface shadow-2xl shadow-primary/10 lg:scale-105"
                    : "border-border bg-surface hover:border-border-light"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Phổ biến nhất
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-lg text-muted">đ{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="#"
                  className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "border border-border-light bg-surface-raised text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            Người dùng nói gì
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Hàng triệu người dùng tin tưởng
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-surface p-8"
            >
              <div className="flex gap-1 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">&ldquo;{t.content}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                  {t.avatar}
                </span>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-border bg-surface/40 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">
              Câu hỏi thường gặp
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Bạn có thắc mắc?
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold">{faq.q}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-muted transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface to-accent/10 px-6 py-16 text-center sm:px-12 md:py-24">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Sẵn sàng bắt đầu xem phim?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
              Tham gia cùng hơn 2 triệu người dùng. Dùng thử miễn phí 7 ngày,
              không cần nhập thông tin thanh toán.
            </p>
            <Link
              href="#pricing"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-primary/40"
            >
              Dùng thử miễn phí ngay
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-black text-white">
                  C
                </span>
                <span className="text-lg font-extrabold">
                  Cine<span className="text-primary">Stream</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Nền tảng xem phim trực tuyến hàng đầu Việt Nam. Kho phim khổng lồ,
                chất lượng 4K, phát mượt mà trên mọi thiết bị.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Khám phá
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#features" className="text-muted hover:text-foreground">Tính năng</a></li>
                <li><a href="#movies" className="text-muted hover:text-foreground">Phim hot</a></li>
                <li><a href="#pricing" className="text-muted hover:text-foreground">Bảng giá</a></li>
                <li><a href="#faq" className="text-muted hover:text-foreground">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Công ty
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#" className="text-muted hover:text-foreground">Về chúng tôi</a></li>
                <li><a href="#" className="text-muted hover:text-foreground">Tuyển dụng</a></li>
                <li><a href="#" className="text-muted hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-muted hover:text-foreground">Liên hệ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Hỗ trợ
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>Hotline: 1900 1234</li>
                <li>Email: hotro@cinestream.vn</li>
                <li>Hỗ trợ 24/7</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-dark sm:flex-row">
            <p>© {new Date().getFullYear()} CineStream. Dự án minh hoạ.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground">Điều khoản</a>
              <a href="#" className="hover:text-foreground">Bảo mật</a>
              <a href="#" className="hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
