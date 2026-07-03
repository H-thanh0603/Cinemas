import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function bookingCode(i: number) {
  return `CS-SEED${String(i).padStart(4, "0")}`;
}

async function main() {
  console.log("🧹 Clearing existing data...");
  await prisma.payment.deleteMany();
  await prisma.bookingCombo.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.foodCombo.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.room.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────
  console.log("👤 Seeding users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@cinestar.vn",
      name: "Quản trị viên",
      phone: "0900000001",
      role: "ADMIN",
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: "khach@example.com",
      name: "Nguyễn Văn Khách",
      phone: "0900000002",
      role: "CUSTOMER",
    },
  });

  // ── Genres ───────────────────────────────────────────────────────────
  console.log("🎭 Seeding genres...");
  const genreData = [
    { name: "Hành động", slug: "hanh-dong" },
    { name: "Khoa học viễn tưởng", slug: "khoa-hoc-vien-tuong" },
    { name: "Kinh dị", slug: "kinh-di" },
    { name: "Tình cảm", slug: "tinh-cam" },
    { name: "Hài", slug: "hai" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
    { name: "Phiêu lưu", slug: "phieu-luu" },
    { name: "Tâm lý", slug: "tam-ly" },
  ];
  const genres: Record<string, string> = {};
  for (const g of genreData) {
    const created = await prisma.genre.create({ data: g });
    genres[g.slug] = created.id;
  }

  // ── Movies (fictional) ───────────────────────────────────────────────
  console.log("🎬 Seeding movies...");
  const posterBase = "https://placehold.co/400x600";
  const backdropBase = "https://placehold.co/1280x720";

  const movieData = [
    {
      slug: "bao-tap-thanh-pho-chim",
      title: "Bão Tập: Thành Phố Chìm",
      description:
        "Khi một cơn siêu bão nhấn chìm thành phố ven biển Hải Vân, đội cứu hộ tinh nhuệ do đại úy Trần Phong dẫn đầu phải chạy đua với thời gian để giải cứu hàng nghìn người mắc kẹt, đồng thời khám phá âm mưu che giấu đằng sau thảm họa.",
      durationMin: 128,
      ageRating: "T16",
      director: "Lê Minh Quân",
      cast: "Trần Đăng Khoa, Vũ Hà My, Phạm Quốc Bảo, Ngô Thanh Trúc",
      releaseDate: daysFromNow(-20, 0),
      status: "NOW_SHOWING",
      popularity: 95,
      genres: ["hanh-dong", "phieu-luu"],
      poster: `${posterBase}/1a1a2e/e50914?text=B%C3%A3o+T%E1%BA%ADp`,
      backdrop: `${backdropBase}/16213e/e50914?text=B%C3%A3o+T%E1%BA%ADp`,
    },
    {
      slug: "ky-uc-so-0",
      title: "Ký Ức Số 0",
      description:
        "Năm 2089, công nghệ sao lưu ký ức trở thành ngành công nghiệp nghìn tỷ. Một kỹ sư trẻ phát hiện ký ức của chính mình đã bị chỉnh sửa và bắt đầu hành trình truy tìm sự thật về 'Ký Ức Số 0' — bản gốc cuối cùng chưa bị can thiệp.",
      durationMin: 142,
      ageRating: "T13",
      director: "Đỗ Hoàng Nam",
      cast: "Lý Nhật Anh, Trần Bảo Ngọc, Hoàng Gia Huy",
      releaseDate: daysFromNow(-12, 0),
      status: "NOW_SHOWING",
      popularity: 88,
      genres: ["khoa-hoc-vien-tuong", "tam-ly"],
      poster: `${posterBase}/0f3460/f5c518?text=K%C3%BD+%E1%BB%A8c+S%E1%BB%91+0`,
      backdrop: `${backdropBase}/0f3460/f5c518?text=K%C3%BD+%E1%BB%A8c+S%E1%BB%91+0`,
    },
    {
      slug: "tieng-goi-tu-tang-ham",
      title: "Tiếng Gọi Từ Tầng Hầm",
      description:
        "Một gia đình trẻ chuyển về căn biệt thự cổ ở ngoại ô Đà Lạt. Mỗi đêm, tiếng gõ vọng lên từ tầng hầm bị khóa kín suốt 40 năm. Khi cánh cửa cuối cùng được mở, quá khứ đen tối của ngôi nhà thức giấc.",
      durationMin: 105,
      ageRating: "T18",
      director: "Bùi Thanh Sơn",
      cast: "Ngô Mai Chi, Đặng Việt Dũng, Lê Khánh Vy",
      releaseDate: daysFromNow(-8, 0),
      status: "NOW_SHOWING",
      popularity: 82,
      genres: ["kinh-di", "tam-ly"],
      poster: `${posterBase}/1b1b1b/8b0000?text=Ti%E1%BA%BFng+G%E1%BB%8Di`,
      backdrop: `${backdropBase}/1b1b1b/8b0000?text=Ti%E1%BA%BFng+G%E1%BB%8Di`,
    },
    {
      slug: "mua-he-nam-ay",
      title: "Mùa Hè Năm Ấy",
      description:
        "Mười năm sau lời hứa dang dở dưới gốc phượng vĩ, Hạ Vy trở về thị trấn nhỏ ven biển và gặp lại người bạn thanh mai trúc mã nay đã là ngư dân trầm lặng. Một mùa hè nữa lại đến, liệu có kịp cho những điều chưa nói?",
      durationMin: 118,
      ageRating: "K",
      director: "Nguyễn Thu Trang",
      cast: "Phan Hải Đăng, Trịnh Tú Linh, Võ Minh Khang",
      releaseDate: daysFromNow(-15, 0),
      status: "NOW_SHOWING",
      popularity: 76,
      genres: ["tinh-cam", "tam-ly"],
      poster: `${posterBase}/2e4057/ffd93b?text=M%C3%B9a+H%C3%A8`,
      backdrop: `${backdropBase}/2e4057/ffd93b?text=M%C3%B9a+H%C3%A8`,
    },
    {
      slug: "biet-doi-cho-hoang",
      title: "Biệt Đội Chó Hoang",
      description:
        "Bốn chú chó đường phố với bốn tính cách trái ngược vô tình trở thành anh hùng khi phát hiện băng nhóm buôn lậu thú cưng. Cuộc phiêu lưu hài hước và cảm động dành cho cả gia đình.",
      durationMin: 96,
      ageRating: "P",
      director: "Trương Vĩnh Phúc",
      cast: "Lồng tiếng: Hứa Minh Đạt, Thu Trang, Tiến Luật",
      releaseDate: daysFromNow(-10, 0),
      status: "NOW_SHOWING",
      popularity: 71,
      genres: ["hoat-hinh", "hai", "phieu-luu"],
      poster: `${posterBase}/f4a261/1a1a2e?text=Bi%E1%BB%87t+%C4%90%E1%BB%99i`,
      backdrop: `${backdropBase}/f4a261/1a1a2e?text=Bi%E1%BB%87t+%C4%90%E1%BB%99i`,
    },
    {
      slug: "vo-cuc-dao",
      title: "Võ Cực Đạo",
      description:
        "Truyền nhân cuối cùng của môn phái Võ Cực bị cuốn vào giải đấu ngầm tàn khốc tại Sài Gòn. Để bảo vệ võ đường của cha, anh phải đối mặt với nhà vô địch bất bại và cả quá khứ của chính mình.",
      durationMin: 134,
      ageRating: "T16",
      director: "Trần Quang Vinh",
      cast: "Lâm Thế Thành, Đinh Ngọc Diệp, Johnny Trí Trung",
      releaseDate: daysFromNow(-5, 0),
      status: "NOW_SHOWING",
      popularity: 84,
      genres: ["hanh-dong"],
      poster: `${posterBase}/540b0e/f5f5f7?text=V%C3%B5+C%E1%BB%B1c+%C4%90%E1%BA%A1o`,
      backdrop: `${backdropBase}/540b0e/f5f5f7?text=V%C3%B5+C%E1%BB%B1c+%C4%90%E1%BA%A1o`,
    },
    {
      slug: "hanh-tinh-thu-chin",
      title: "Hành Tinh Thứ Chín",
      description:
        "Phi hành đoàn quốc tế trên tàu Lạc Hồng-1 nhận tín hiệu bí ẩn từ rìa hệ mặt trời. Chuyến thám hiểm 7 năm đến 'Hành Tinh Thứ Chín' sẽ thay đổi hiểu biết của nhân loại về vũ trụ — nếu họ còn sống để kể lại.",
      durationMin: 155,
      ageRating: "T13",
      director: "Phạm Anh Tuấn",
      cast: "Đỗ Khánh An, Mai Phương Thảo, Trần Hữu Nghĩa",
      releaseDate: daysFromNow(7, 0),
      status: "COMING_SOON",
      popularity: 90,
      genres: ["khoa-hoc-vien-tuong", "phieu-luu"],
      poster: `${posterBase}/03045e/90e0ef?text=H%C3%A0nh+Tinh+9`,
      backdrop: `${backdropBase}/03045e/90e0ef?text=H%C3%A0nh+Tinh+9`,
    },
    {
      slug: "dam-cuoi-hoang-loan",
      title: "Đám Cưới Hỗn Loạn",
      description:
        "Đám cưới thế kỷ của cặp đôi vàng showbiz biến thành thảm họa khi chú rể mất trí nhớ tạm thời ngay trước lễ đường, còn cô dâu phát hiện người yêu cũ chính là... người dẫn chương trình hôn lễ.",
      durationMin: 102,
      ageRating: "T13",
      director: "Võ Hải Yến",
      cast: "Quang Đại Lâm, Ninh Dương Lan Chi, Kiều Minh Tú",
      releaseDate: daysFromNow(14, 0),
      status: "COMING_SOON",
      popularity: 68,
      genres: ["hai", "tinh-cam"],
      poster: `${posterBase}/ff6b9d/ffffff?text=%C4%90%C3%A1m+C%C6%B0%E1%BB%9Bi`,
      backdrop: `${backdropBase}/ff6b9d/ffffff?text=%C4%90%C3%A1m+C%C6%B0%E1%BB%9Bi`,
    },
    {
      slug: "rung-thieng",
      title: "Rừng Thiêng",
      description:
        "Đoàn làm phim tài liệu tiến sâu vào khu rừng nguyên sinh chưa từng có dấu chân người ở Tây Nguyên. Những gì họ ghi lại được vượt xa mọi truyền thuyết mà người bản địa vẫn kể.",
      durationMin: 111,
      ageRating: "T18",
      director: "Hoàng Đức Thịnh",
      cast: "Lê Công Hậu, Y Nhi Êban, Trần Thái Bình",
      releaseDate: daysFromNow(21, 0),
      status: "COMING_SOON",
      popularity: 61,
      genres: ["kinh-di", "phieu-luu"],
      poster: `${posterBase}/1b4332/d8f3dc?text=R%E1%BB%ABng+Thi%C3%AAng`,
      backdrop: `${backdropBase}/1b4332/d8f3dc?text=R%E1%BB%ABng+Thi%C3%AAng`,
    },
    {
      slug: "giai-dieu-cuoi-cung",
      title: "Giai Điệu Cuối Cùng",
      description:
        "Nghệ sĩ dương cầm lừng danh mất thính lực ở đỉnh cao sự nghiệp. Hành trình tìm lại âm nhạc bằng trái tim, với sự đồng hành của cô học trò khiếm thị, đã làm nên bản giao hưởng cảm động nhất đời ông.",
      durationMin: 124,
      ageRating: "P",
      director: "Đặng Nhật Hà",
      cast: "NSƯT Thành Vinh, Phùng Khánh Linh, Bùi An Nhiên",
      releaseDate: daysFromNow(-30, 0),
      status: "NOW_SHOWING",
      popularity: 66,
      genres: ["tam-ly", "tinh-cam"],
      poster: `${posterBase}/2b2d42/edf2f4?text=Giai+%C4%90i%E1%BB%87u`,
      backdrop: `${backdropBase}/2b2d42/edf2f4?text=Giai+%C4%90i%E1%BB%87u`,
    },
  ];

  const movies: { id: string; slug: string; durationMin: number; status: string }[] = [];
  for (const m of movieData) {
    const created = await prisma.movie.create({
      data: {
        slug: m.slug,
        title: m.title,
        description: m.description,
        posterUrl: m.poster,
        backdropUrl: m.backdrop,
        trailerUrl: null,
        durationMin: m.durationMin,
        ageRating: m.ageRating,
        director: m.director,
        cast: m.cast,
        releaseDate: m.releaseDate,
        status: m.status,
        popularity: m.popularity,
        genres: {
          create: m.genres.map((slug) => ({ genreId: genres[slug] })),
        },
      },
    });
    movies.push({
      id: created.id,
      slug: m.slug,
      durationMin: m.durationMin,
      status: m.status,
    });
  }

  // ── Cinemas + Rooms + Seats ──────────────────────────────────────────
  console.log("🏢 Seeding cinemas, rooms, seats...");
  const cinemaData = [
    {
      slug: "cinestar-nguyen-hue",
      name: "CineStar Nguyễn Huệ",
      address: "135 Nguyễn Huệ, Quận 1",
      city: "TP. Hồ Chí Minh",
      phone: "028 3900 1135",
      description:
        "Rạp trung tâm với 6 phòng chiếu hiện đại, màn hình IMAX đầu tiên của hệ thống.",
      rooms: [
        { name: "Phòng 1", rows: 8, cols: 12 },
        { name: "Phòng 2", rows: 7, cols: 10 },
        { name: "Phòng IMAX", rows: 10, cols: 14 },
      ],
    },
    {
      slug: "cinestar-ha-dong",
      name: "CineStar Hà Đông",
      address: "Tầng 5 TTTM Mê Linh Plaza, Hà Đông",
      city: "Hà Nội",
      phone: "024 3355 8800",
      description:
        "Cụm rạp phía Tây Hà Nội với phòng chiếu couple seat riêng biệt.",
      rooms: [
        { name: "Phòng 1", rows: 8, cols: 10 },
        { name: "Phòng 2", rows: 6, cols: 8 },
      ],
    },
    {
      slug: "cinestar-da-nang",
      name: "CineStar Đà Nẵng",
      address: "255 Võ Nguyên Giáp, Sơn Trà",
      city: "Đà Nẵng",
      phone: "0236 3888 999",
      description: "Rạp ven biển với sảnh chờ hướng vịnh Đà Nẵng tuyệt đẹp.",
      rooms: [
        { name: "Phòng 1", rows: 7, cols: 10 },
        { name: "Phòng 2", rows: 8, cols: 12 },
      ],
    },
  ];

  const allRooms: { id: string; cinemaId: string; rows: number; cols: number }[] = [];
  for (const c of cinemaData) {
    const cinema = await prisma.cinema.create({
      data: {
        slug: c.slug,
        name: c.name,
        address: c.address,
        city: c.city,
        phone: c.phone,
        description: c.description,
      },
    });

    for (const r of c.rooms) {
      const room = await prisma.room.create({
        data: { name: r.name, cinemaId: cinema.id, rows: r.rows, cols: r.cols },
      });
      allRooms.push({ id: room.id, cinemaId: cinema.id, rows: r.rows, cols: r.cols });

      // Seat layout rules:
      // - last row: COUPLE seats (every other seat, even numbers skipped)
      // - middle third rows: VIP
      // - a few random broken seats
      const seatRows = Array.from({ length: r.rows }, (_, i) =>
        String.fromCharCode(65 + i)
      );
      const vipStart = Math.floor(r.rows / 3);
      const vipEnd = Math.floor((r.rows * 2) / 3);

      const seatsToCreate: {
        roomId: string;
        row: string;
        number: number;
        type: string;
        isActive: boolean;
      }[] = [];

      seatRows.forEach((rowLabel, rowIdx) => {
        const isCoupleRow = rowIdx === r.rows - 1;
        const isVipRow = rowIdx >= vipStart && rowIdx < vipEnd;

        if (isCoupleRow) {
          // couple seats take double width -> half as many, still numbered sequentially
          for (let n = 1; n <= Math.floor(r.cols / 2); n++) {
            seatsToCreate.push({
              roomId: room.id,
              row: rowLabel,
              number: n,
              type: "COUPLE",
              isActive: true,
            });
          }
        } else {
          for (let n = 1; n <= r.cols; n++) {
            // deterministic "broken" seats for realism
            const broken =
              (rowIdx === 1 && n === r.cols) || (rowIdx === 2 && n === 1);
            seatsToCreate.push({
              roomId: room.id,
              row: rowLabel,
              number: n,
              type: isVipRow ? "VIP" : "NORMAL",
              isActive: !broken,
            });
          }
        }
      });

      await prisma.seat.createMany({ data: seatsToCreate });
    }
  }

  // ── Ticket types ─────────────────────────────────────────────────────
  console.log("🎟️ Seeding ticket types...");
  const ticketTypes = await Promise.all([
    prisma.ticketType.create({
      data: {
        code: "ADULT",
        name: "Người lớn",
        description: "Vé tiêu chuẩn cho khách từ 18 tuổi",
        priceModifier: 0,
      },
    }),
    prisma.ticketType.create({
      data: {
        code: "STUDENT",
        name: "HSSV / U22",
        description: "Ưu đãi cho học sinh, sinh viên có thẻ (xuất trình khi vào rạp)",
        priceModifier: -15000,
      },
    }),
    prisma.ticketType.create({
      data: {
        code: "CHILD",
        name: "Trẻ em",
        description: "Dành cho trẻ dưới 12 tuổi",
        priceModifier: -25000,
      },
    }),
  ]);
  const adultTicket = ticketTypes[0];

  // ── Food combos ──────────────────────────────────────────────────────
  console.log("🍿 Seeding food combos...");
  const comboImg = "https://placehold.co/300x200";
  const combos = await Promise.all([
    prisma.foodCombo.create({
      data: {
        name: "Combo Solo",
        description: "1 bắp ngọt vừa + 1 nước ngọt lớn",
        price: 79000,
        category: "COMBO",
        imageUrl: `${comboImg}/f4a261/1a1a2e?text=Combo+Solo`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Combo Đôi",
        description: "1 bắp ngọt lớn + 2 nước ngọt lớn",
        price: 119000,
        category: "COMBO",
        imageUrl: `${comboImg}/e76f51/ffffff?text=Combo+%C4%90%C3%B4i`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Combo Gia Đình",
        description: "2 bắp ngọt lớn + 4 nước ngọt + 1 snack khoai tây",
        price: 199000,
        category: "COMBO",
        imageUrl: `${comboImg}/2a9d8f/ffffff?text=Combo+Gia+%C4%90%C3%ACnh`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Bắp phô mai lớn",
        description: "Bắp rang vị phô mai béo ngậy, size lớn",
        price: 59000,
        category: "POPCORN",
        imageUrl: `${comboImg}/e9c46a/1a1a2e?text=B%E1%BA%AFp+Ph%C3%B4+Mai`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Nước ngọt lớn",
        description: "Coca / Pepsi / 7Up size lớn 700ml",
        price: 35000,
        category: "DRINK",
        imageUrl: `${comboImg}/264653/ffffff?text=N%C6%B0%E1%BB%9Bc+Ng%E1%BB%8Dt`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Snack khoai tây",
        description: "Khoai tây chiên giòn rụm phần vừa",
        price: 45000,
        category: "SNACK",
        imageUrl: `${comboImg}/e63946/ffffff?text=Snack`,
      },
    }),
    prisma.foodCombo.create({
      data: {
        name: "Hotdog phô mai",
        description: "Hotdog xúc xích Đức phủ sốt phô mai",
        price: 55000,
        category: "SNACK",
        imageUrl: `${comboImg}/f77f00/ffffff?text=Hotdog`,
      },
    }),
  ]);

  // ── Promotions ───────────────────────────────────────────────────────
  console.log("🎁 Seeding promotions...");
  await Promise.all([
    prisma.promotion.create({
      data: {
        code: "WELCOME10",
        description: "Giảm 10% cho đơn hàng đầu tiên (tối đa 50.000đ)",
        discountType: "PERCENT",
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 0,
        usageLimit: 1000,
        startsAt: daysFromNow(-30, 0),
        expiresAt: daysFromNow(60, 23, 59),
      },
    }),
    prisma.promotion.create({
      data: {
        code: "T2VUIVE",
        description: "Giảm 30.000đ cho đơn từ 150.000đ",
        discountType: "FIXED",
        discountValue: 30000,
        minOrderValue: 150000,
        usageLimit: 500,
        startsAt: daysFromNow(-10, 0),
        expiresAt: daysFromNow(30, 23, 59),
      },
    }),
    prisma.promotion.create({
      data: {
        code: "COMBO50",
        description: "Giảm 50.000đ cho đơn từ 300.000đ",
        discountType: "FIXED",
        discountValue: 50000,
        minOrderValue: 300000,
        usageLimit: 200,
        startsAt: daysFromNow(-5, 0),
        expiresAt: daysFromNow(45, 23, 59),
      },
    }),
    prisma.promotion.create({
      data: {
        code: "HETHAN",
        description: "Mã đã hết hạn (dùng để test)",
        discountType: "PERCENT",
        discountValue: 20,
        maxDiscount: 100000,
        startsAt: daysFromNow(-60, 0),
        expiresAt: daysFromNow(-1, 23, 59),
      },
    }),
  ]);

  // ── Showtimes ────────────────────────────────────────────────────────
  console.log("🕐 Seeding showtimes...");
  const nowShowing = movies.filter((m) => m.status === "NOW_SHOWING");
  const showtimeSlots = [10, 13, 16, 19, 21];
  const basePrices: Record<string, number> = { "2D": 75000, "3D": 95000, IMAX: 130000 };

  const showtimes: { id: string; roomId: string; startsAt: Date }[] = [];

  // For each room, schedule movies across days -2..+6
  for (let day = -2; day <= 6; day++) {
    for (let roomIdx = 0; roomIdx < allRooms.length; roomIdx++) {
      const room = allRooms[roomIdx];
      // rotate movies per room per day
      for (let slotIdx = 0; slotIdx < showtimeSlots.length; slotIdx++) {
        const movie =
          nowShowing[(day + roomIdx + slotIdx + 100) % nowShowing.length];
        const startsAt = daysFromNow(day, showtimeSlots[slotIdx]);
        const endsAt = addMinutes(startsAt, movie.durationMin + 15);
        const format = roomIdx % 5 === 2 ? "IMAX" : slotIdx % 2 === 0 ? "2D" : "3D";
        const st = await prisma.showtime.create({
          data: {
            movieId: movie.id,
            cinemaId: room.cinemaId,
            roomId: room.id,
            startsAt,
            endsAt,
            basePrice: basePrices[format],
            format,
          },
        });
        showtimes.push({ id: st.id, roomId: room.id, startsAt });
      }
    }
  }

  // ── Existing bookings (make some seats unavailable) ──────────────────
  console.log("📖 Seeding sample bookings...");
  const futureShowtimes = showtimes
    .filter((s) => s.startsAt > new Date())
    .slice(0, 12);

  let bookingIdx = 1;
  for (const st of futureShowtimes) {
    const seats = await prisma.seat.findMany({
      where: { roomId: st.roomId, isActive: true },
      take: 40,
    });
    // pick 3-6 seats depending on index
    const count = 3 + (bookingIdx % 4);
    const chosen = seats.slice(bookingIdx % 5, (bookingIdx % 5) + count);
    if (chosen.length === 0) continue;

    const showtime = await prisma.showtime.findUniqueOrThrow({
      where: { id: st.id },
    });

    const seatPrice = (type: string) =>
      showtime.basePrice +
      (type === "VIP" ? 30000 : type === "COUPLE" ? 60000 : 0);

    const seatsTotal = chosen.reduce((sum, s) => sum + seatPrice(s.type), 0);
    const combo = combos[bookingIdx % combos.length];
    const combosTotal = combo.price;
    const finalTotal = seatsTotal + combosTotal;

    const booking = await prisma.booking.create({
      data: {
        code: bookingCode(bookingIdx),
        showtimeId: st.id,
        userId: bookingIdx % 3 === 0 ? customer.id : null,
        contactName: bookingIdx % 3 === 0 ? customer.name : `Khách hàng ${bookingIdx}`,
        contactEmail:
          bookingIdx % 3 === 0 ? customer.email : `khach${bookingIdx}@example.com`,
        contactPhone: `09${String(10000000 + bookingIdx * 37)}`,
        status: bookingIdx % 7 === 0 ? "CANCELLED" : "CONFIRMED",
        seatsTotal,
        combosTotal,
        finalTotal,
        seats: {
          create: chosen.map((s) => ({
            seatId: s.id,
            ticketTypeId: adultTicket.id,
            price: seatPrice(s.type),
          })),
        },
        combos: {
          create: [{ comboId: combo.id, quantity: 1, unitPrice: combo.price }],
        },
        payment: {
          create: {
            method: ["CREDIT_CARD", "E_WALLET", "BANK_TRANSFER", "AT_COUNTER"][
              bookingIdx % 4
            ],
            status: bookingIdx % 7 === 0 ? "REFUNDED" : "PAID",
            amount: finalTotal,
            paidAt: new Date(),
          },
        },
      },
    });
    console.log(`  → booking ${booking.code} (${chosen.length} ghế)`);
    bookingIdx++;
  }

  console.log("✅ Seed hoàn tất!");
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Khách: ${customer.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
