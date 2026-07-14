import { Card, SectionHeading } from "@/components/ui";

export const metadata = { title: "Giới thiệu" };

const usps = [
  {
    title: "Bảo hành chính hãng",
    desc: "Đổi mới theo chính sách hãng, hỗ trợ bảo hành tại điểm ủy quyền.",
  },
  {
    title: "Giao hàng nhanh",
    desc: "Nội thành 2h với đơn có sẵn (demo) — toàn quốc qua đối tác vận chuyển.",
  },
  {
    title: "Tư vấn cấu hình",
    desc: "Đội ngũ TechZone giúp chọn máy đúng nhu cầu, không upsell vô tội vạ.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Về TechZone"
        subtitle="Cửa hàng laptop premium — bản demo UI"
      />
      <div className="max-w-3xl space-y-4 text-surface-300 leading-relaxed">
        <p>
          TechZone ra đời với mục tiêu đơn giản: giúp bạn chọn đúng laptop —
          đủ mạnh, đủ nhẹ, đủ bền — mà không bị ngợp bởi thông số.
        </p>
        <p>
          Catalog demo này minh họa trải nghiệm mua sắm full flow: lọc máy, so
          sánh, giỏ hàng, checkout mock và khu vực tài khoản.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {usps.map((u) => (
          <Card key={u.title} className="p-6">
            <h3 className="text-lg font-semibold text-white">{u.title}</h3>
            <p className="mt-2 text-sm text-surface-400">{u.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
