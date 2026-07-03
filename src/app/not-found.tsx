import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="text-6xl">🎞️</span>
      <h1 className="mt-6 text-3xl font-bold">Không tìm thấy trang</h1>
      <p className="mt-3 max-w-md text-muted">
        Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển. Hãy quay lại
        trang chủ để tiếp tục khám phá phim.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
