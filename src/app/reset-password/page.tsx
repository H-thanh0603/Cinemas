import Link from "next/link";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface-raised p-8 shadow-xl">
        <h1 className="text-center text-2xl font-extrabold">Đặt lại mật khẩu</h1>
        {token ? <ResetForm token={token} /> : <p className="mt-6 text-sm text-muted">Liên kết không hợp lệ.</p>}
        <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}
