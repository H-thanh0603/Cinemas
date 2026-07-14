import type { BlogPost } from "@/types";

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    slug: "chon-laptop-gaming-2026",
    title: "Cách chọn laptop gaming 2026: GPU, tản nhiệt, màn hình",
    excerpt:
      "Hướng dẫn ngắn gọn để chọn cấu hình gaming phù hợp ngân sách và nhu cầu thực tế.",
    cover:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    date: "2026-06-20",
    author: "TechZone Editorial",
    content: `Laptop gaming không chỉ là “càng mạnh càng tốt”. Hãy bắt đầu từ độ phân giải màn bạn chơi (1080p hay 1440p), rồi chọn GPU tương ứng — RTX 4050/4060 đủ cho 1080p cao, 4070 trở lên thoải mái 1440p.

Tản nhiệt quan trọng không kém chip. Máy chạy êm, pin ổn khi browse, và ít throttle sau 30–60 phút game là dấu hiệu tản nhiệt tốt.

Cuối cùng, kiểm tra cổng kết nối (HDMI, USB-C PD), bàn phím, và chính sách bảo hành tại cửa hàng.`,
  },
  {
    id: "b2",
    slug: "macbook-air-vs-windows-ultrabook",
    title: "MacBook Air hay Windows ultrabook: nên mua gì?",
    excerpt:
      "So sánh nhanh hệ sinh thái, phần mềm, pin và giá trị sử dụng dài hạn.",
    cover:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    date: "2026-06-12",
    author: "Minh Khoa",
    content: `Nếu bạn đã dùng iPhone/iPad và ưu tiên pin + màn đẹp + build nhôm, MacBook Air thường “vừa tay” ngay.

Windows ultrabook (Zenbook, XPS, Swift) linh hoạt hơn phần mềm, dễ gắn GPU rời qua dock/eGPU (tùy máy), và có nhiều mức giá.

Hãy liệt kê 3 app bạn dùng mỗi ngày — đó thường quyết định platform hơn là thông số trên giấy.`,
  },
  {
    id: "b3",
    slug: "ram-16gb-co-du-khong",
    title: "RAM 16GB còn đủ trong 2026 không?",
    excerpt:
      "Chrome, Docker, AI local — khi nào cần 32GB?",
    cover:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    date: "2026-05-28",
    author: "Lan Anh",
    content: `Với văn phòng, học tập, xem phim: 16GB vẫn thoải mái nếu bạn không mở hàng chục tab và máy ảo cùng lúc.

Lập trình full-stack, Docker, Android Studio, hoặc chỉnh 4K: 32GB giúp máy “thở” hơn và giữ máy lâu hơn trước khi nâng cấp.

Mẹo: ưu tiên máy hàn RAM/SSD nếu giá chênh hợp lý — nâng cấp sau thường đắt hoặc không được.`,
  },
  {
    id: "b4",
    slug: "bao-quan-pin-laptop",
    title: "5 thói quen giúp pin laptop bền hơn",
    excerpt:
      "Sạc đúng cách, nhiệt độ, và chế độ pin nhà sản xuất.",
    cover:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    date: "2026-05-10",
    author: "TechZone Support",
    content: `Tránh để máy nóng liên tục trên giường/sofa — tắc khí tản nhiệt làm pin và CPU cùng “già” sớm.

Dùng limit sạc 80% nếu bạn cắm điện cả ngày (nhiều hãng có hãng utility).

Không để pin 0% lâu; bảo quản máy không dùng ở khoảng 40–60% nếu cất tủ vài tháng.`,
  },
  {
    id: "b5",
    slug: "man-oled-laptop-co-nen",
    title: "Màn OLED laptop: có đáng để trả thêm?",
    excerpt:
      "Đen sâu, màu đẹp — và trade-off burn-in, pin.",
    cover:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80",
    date: "2026-04-22",
    author: "Hoàng Nam",
    content: `OLED tuyệt cho xem phim, chỉnh ảnh, UI tối. Độ tương phản và màu gần như không IPS nào theo kịp ở cùng phân khúc.

Trade-off: nguy cơ burn-in nếu để taskbar/static UI sáng cao nhiều năm, và pin có thể kém IPS ở nội dung sáng.

Nếu bạn hay bật dark mode và đổi wallpaper, OLED gần như “free lunch” cho trải nghiệm hàng ngày.`,
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
