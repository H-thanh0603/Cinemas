import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-brand-400">404</p>
      <h1 className="mt-2 text-3xl font-bold text-white">
        Không tìm thấy trang
      </h1>
      <p className="mt-3 text-surface-400">
        Đường dẫn không tồn tại hoặc sản phẩm đã gỡ khỏi catalog demo.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Về trang chủ</Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary">Xem sản phẩm</Button>
        </Link>
      </div>
    </div>
  );
}
