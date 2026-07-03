"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="text-6xl">⚠️</span>
      <h1 className="mt-6 text-3xl font-bold">Đã xảy ra lỗi</h1>
      <p className="mt-3 max-w-md text-muted">
        Có lỗi không mong muốn xảy ra khi tải trang. Vui lòng thử lại.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-dark">Mã lỗi: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Thử lại
      </button>
    </div>
  );
}
