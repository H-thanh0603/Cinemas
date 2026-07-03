import { CinemaForm } from "./cinema-form";

export const dynamic = "force-dynamic";

export default async function NewCinemaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm rạp mới</h1>
      <CinemaForm />
    </div>
  );
}
