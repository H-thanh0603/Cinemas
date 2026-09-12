import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getLockedSeatIds } from "@/lib/booking-expire";
import { pickBestSeats } from "@/lib/seat-scoring";
import {
  SEAT_TYPE_SURCHARGE,
  MAX_SEATS_PER_BOOKING,
  SEAT_HOLD_MINUTES,
} from "@/lib/constants";
import { effectiveBasePrice } from "@/lib/booking-pricing";
import { createBooking } from "@/app/booking/actions";

/**
 * Lớp giao tiếp dành cho AI Agent — Model Context Protocol (MCP).
 *
 * Đây là "cánh cửa" mà agent (Claude, ChatGPT, v.v.) gọi thẳng vào
 * website KHÔNG cần cào HTML hay mô phỏng click. Đúng tinh thần
 * "web sẽ được xây cho cả người dùng lẫn AI Agent".
 *
 * Chuẩn: JSON-RPC 2.0 qua HTTP POST /api/mcp
 *   - initialize → handshake, trả protocolVersion + capabilities
 *   - tools/list → danh sách tool kèm JSON Schema input
 *   - tools/call → thực thi tool
 * Auth: header Authorization: Bearer <CINEMAS_AGENT_KEY>
 *       (không set biến này = MCP tắt hoàn toàn, trả 401)
 * Rate limit: 60 request/phút theo key (đủ cho agent, chặn spam).
 */

// ─────────────────────────────────────────────────────────────────────────
// Tool definitions (JSON Schema theo chuẩn MCP tools/list)
// ─────────────────────────────────────────────────────────────────────────

const TOOL_LIST_MOVIES = {
  name: "list_movies",
  description:
    "Liệt kê phim của rạp: đang chiếu (status=NOW_SHOWING) hoặc sắp chiếu (COMING_SOON). " +
    "Trả về slug, tiêu đề, mô tả, thể loại, độ tuổi, thời lượng, độ phổ biến.",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["NOW_SHOWING", "COMING_SOON"],
        description: "Lọc theo trạng thái. Mặc định NOW_SHOWING.",
      },
    },
  },
} as const;

const TOOL_GET_SHOWTIMES = {
  name: "get_showtimes",
  description:
    "Lịch chiếu của 1 phim theo slug. Lọc được theo rạp (cinema slug) và ngày (YYYY-MM-DD). " +
    "Mỗi suất: id, thời gian bắt đầu (ISO), rạp, phòng, định dạng (2D/3D/IMAX), giá cơ bản.",
  inputSchema: {
    type: "object",
    properties: {
      movie_slug: { type: "string", description: "Slug phim, ví dụ interstellar" },
      cinema_slug: {
        type: "string",
        description: "Tùy chọn: lọc 1 rạp (cinestar-da-nang, cinestar-ha-dong, cinestar-nguyen-hue)",
      },
      date: {
        type: "string",
        description: "Tùy chọn: lọc ngày YYYY-MM-DD (giờ Việt Nam)",
      },
    },
    required: ["movie_slug"],
  },
} as const;

const TOOL_CHECK_SEATS = {
  name: "check_seats",
  description:
    "Ghế trống của 1 suất chiếu. Trả về sơ đồ (hàng A-J × cột), ghế đã bị giữ/đặt, " +
    "tổng ghế trống và ĐỀ XUẤT cụm ghế kề nhau tốt nhất (theo vị trí giữa màn hình).",
  inputSchema: {
    type: "object",
    properties: {
      showtime_id: { type: "string", description: "ID suất chiếu từ get_showtimes" },
      want_count: {
        type: "number",
        description: "Số ghế cần ngồi kề nhau — để tool đề xuất cụm tốt nhất (1-8)",
      },
    },
    required: ["showtime_id"],
  },
} as const;

const TOOL_HOLD_SEATS = {
  name: "hold_seats",
  description:
    "Giữ ghế giúp người dùng (tạo booking PENDING). Trả về mã đơn + link thanh toán " +
    "để NGƯỜI DÙNG tự hoàn tất (human-in-the-loop — agent KHÔNG thanh toán thay). " +
    `Ghế được giữ ${SEAT_HOLD_MINUTES} phút rồi tự giải phóng nếu không thanh toán. ` +
    "Idempotent: truyền cùng idempotency_key sẽ trả về đơn cũ, không đặt trùng.",
  inputSchema: {
    type: "object",
    properties: {
      showtime_id: { type: "string", description: "ID suất chiếu" },
      seat_ids: {
        type: "array",
        items: { type: "string" },
        description: "Danh sách seat_id từ check_seats (1-8 ghế)",
      },
      contact_name: { type: "string", description: "Tên người đặt vé" },
      contact_email: { type: "string", description: "Email nhận thông tin đơn" },
      contact_phone: { type: "string", description: "SĐT Việt Nam, ví dụ 0912345678" },
      idempotency_key: {
        type: "string",
        description: "Khóa chống trùng lặp — dùng cùng key khi retry",
      },
    },
    required: ["showtime_id", "seat_ids", "contact_name", "contact_email", "contact_phone", "idempotency_key"],
  },
} as const;

export const MCP_TOOLS = [TOOL_LIST_MOVIES, TOOL_GET_SHOWTIMES, TOOL_CHECK_SEATS, TOOL_HOLD_SEATS];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function vnDay(iso: string): string {
  // YYYY-MM-DD theo giờ Việt Nam (UTC+7)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// ─────────────────────────────────────────────────────────────────────────
// Tool implementations
// ─────────────────────────────────────────────────────────────────────────

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function toolListMovies(args: { status?: string }): Promise<ToolResult> {
  const status = args.status === "COMING_SOON" ? "COMING_SOON" : "NOW_SHOWING";
  const movies = await prisma.movie.findMany({
    where: { status },
    include: { genres: { include: { genre: true } } },
    orderBy: { popularity: "desc" },
    take: 20,
  });
  return ok({
    status,
    count: movies.length,
    movies: movies.map((m) => ({
      slug: m.slug,
      title: m.title,
      description: m.description.slice(0, 200),
      genres: m.genres.map((g) => g.genre.name),
      age_rating: m.ageRating,
      duration_min: m.durationMin,
      popularity: m.popularity,
      detail_page: `/movies/${m.slug}`,
    })),
  });
}

async function toolGetShowtimes(args: {
  movie_slug: string;
  cinema_slug?: string;
  date?: string;
}): Promise<ToolResult> {
  const movie = await prisma.movie.findUnique({
    where: { slug: args.movie_slug },
  });
  if (!movie) return err(`Không tìm thấy phim slug="${args.movie_slug}". Gọi list_movies để xem slug đúng.`);

  let where: Record<string, unknown> = {
    movieId: movie.id,
    startsAt: { gt: new Date() },
    status: "SCHEDULED",
  };

  if (args.cinema_slug) {
    const cinema = await prisma.cinema.findUnique({
      where: { slug: args.cinema_slug },
    });
    if (!cinema) return err(`Không tìm thấy rạp slug="${args.cinema_slug}". Các rạp: cinestar-da-nang, cinestar-ha-dong, cinestar-nguyen-hue.`);
    where = { ...where, cinemaId: cinema.id };
  }

  const showtimes = await prisma.showtime.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { cinema: true, room: true },
    take: 100,
  });

  const filtered = args.date
    ? showtimes.filter((st) => vnDay(st.startsAt.toISOString()) === args.date)
    : showtimes;

  return ok({
    movie: movie.title,
    filters: { cinema: args.cinema_slug ?? "all", date: args.date ?? "all" },
    count: filtered.length,
    showtimes: filtered.map((st) => ({
      id: st.id,
      starts_at_vn: new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(st.startsAt),
      starts_at_iso: st.startsAt.toISOString(),
      cinema: st.cinema.name,
      cinema_slug: st.cinema.slug,
      city: st.cinema.city,
      room: st.room.name,
      format: st.format,
      base_price_vnd: st.basePrice,
      booking_page: `/booking/${st.id}`,
    })),
  });
}

async function toolCheckSeats(args: {
  showtime_id: string;
  want_count?: number;
}): Promise<ToolResult> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: args.showtime_id },
    include: {
      room: { include: { seats: { orderBy: [{ row: "asc" }, { number: "asc" }] } } },
      cinema: true,
      movie: true,
    },
  });
  if (!showtime) return err("Không tìm thấy suất chiếu. Dùng get_showtimes để lấy id.");

  const locked = new Set(await getLockedSeatIds(showtime.id));
  const seats = showtime.room.seats;
  const free = seats.filter((s) => s.isActive && !locked.has(s.id));

  // Đề xuất cụm ghế kề nhau tốt nhất (dùng cùng scoring engine với web)
  const want = Math.max(1, Math.min(MAX_SEATS_PER_BOOKING, Math.floor(args.want_count ?? 2)));
  const suggestion = pickBestSeats(
    seats.map((s) => ({
      id: s.id,
      row: s.row,
      number: s.number,
      type: s.type,
      isActive: s.isActive,
    })),
    want,
    locked
  );

  const effBase = effectiveBasePrice(showtime.basePrice, showtime.startsAt);

  return ok({
    showtime: {
      id: showtime.id,
      movie: showtime.movie.title,
      cinema: showtime.cinema.name,
      starts_at_vn: new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(showtime.startsAt),
    },
    room: { name: showtime.room.name, rows: showtime.room.rows, cols: showtime.room.cols },
    seat_map: seats.reduce<Record<string, unknown>>((acc, s) => {
      const status = !s.isActive ? "broken" : locked.has(s.id) ? "taken" : "free";
      acc[`${s.row}${s.number}`] = { seat_id: s.id, type: s.type, status };
      return acc;
    }, {}),
    summary: {
      total: seats.length,
      free: free.length,
      taken: locked.size,
    },
    suggestion:
      suggestion.length > 0
        ? {
            count: suggestion.length,
            seats: suggestion.map((s) => `${s.row}${s.number}`),
            seat_ids: suggestion.map((s) => s.id),
            estimated_total_vnd: suggestion.reduce(
              (sum, s) => sum + effBase + (SEAT_TYPE_SURCHARGE[s.type] ?? 0),
              0
            ),
            note: "Cụm ghế kề nhau tốt nhất theo vị trí màn hình. Ưu tiên giữa hàng, giữa cột.",
          }
        : { count: 0, note: `Không còn ${want} ghế kề nhau. Thử want_count nhỏ hơn hoặc suất khác.` },
    pricing_note: `Giá mỗi ghế = ${new Intl.NumberFormat("vi-VN").format(effBase)}đ (đã gồm hệ số khung giờ) + phụ thu VIP/COUPLE.`,
  });
}

async function toolHoldSeats(args: {
  showtime_id: string;
  seat_ids: string[];
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  idempotency_key: string;
}): Promise<ToolResult> {
  // Validate sớm trước khi gọi createBooking
  if (!Array.isArray(args.seat_ids) || args.seat_ids.length < 1) {
    return err("seat_ids phải là mảng ít nhất 1 ghế.");
  }
  if (args.seat_ids.length > MAX_SEATS_PER_BOOKING) {
    return err(`Tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi đơn.`);
  }

  const showtime = await prisma.showtime.findUnique({
    where: { id: args.showtime_id },
    include: { movie: true, cinema: true },
  });
  if (!showtime) return err("Không tìm thấy suất chiếu. Dùng get_showtimes để lấy id.");

  // Loại vé mặc định ADULT cho mỗi ghế (đơn giản hoá cho agent;
  // người dùng có thể đổi khi thanh toán ở web)
  const adult = await prisma.ticketType.findUnique({ where: { code: "ADULT" } });
  if (!adult) return err("Hệ thống thiếu loại vé ADULT — liên hệ quản trị.");

  const result = await createBooking({
    showtimeId: args.showtime_id,
    seats: args.seat_ids.map((seatId) => ({ seatId, ticketTypeId: adult.id })),
    combos: [],
    contact: {
      name: args.contact_name,
      email: args.contact_email,
      phone: args.contact_phone,
    },
    paymentMethod: "AT_COUNTER", // giữ ghế, người dùng chọn cách trả khi vào trang
    idempotencyKey: args.idempotency_key,
  });

  if (!result.ok) {
    return err(`Không giữ được ghế: ${result.error}`);
  }

  const appUrl = process.env.APP_URL ?? "https://cinemas-khaki.vercel.app";
  const expires = result.data.expiresAt
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(result.data.expiresAt))
    : "n/a";

  return ok({
    success: true,
    booking_code: result.data.code,
    status: result.data.status,
    hold_expires_vn: expires,
    payment_page: `${appUrl}/booking/pay/${result.data.code}`,
    booking_page: `${appUrl}/booking/confirmation/${result.data.code}`,
    message:
      `Đã giữ ghế thành công. Mã đơn ${result.data.code}. ` +
      `Ghế tự giải phóng lúc ${expires} nếu không hoàn tất. ` +
      `Trả link payment_page cho NGƯỜI DÙNG tự thanh toán — agent không thanh toán thay.`,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// JSON-RPC dispatcher
// ─────────────────────────────────────────────────────────────────────────

export async function handleMcp(req: NextRequest): Promise<NextResponse> {
  const key = process.env.CINEMAS_AGENT_KEY?.trim();
  const auth = req.headers.get("authorization") ?? "";

  // Fail closed: không cấu hình key = MCP tắt hoàn toàn.
  // Error message tự chẩn đoán để phân biệt 2 tình huống hay gặp:
  //   (a) env var chưa set / redeploy chưa chạy → "chưa cấu hình"
  //   (b) key không khớp → "không khớp" (không tiết lộ key thật)
  if (!key) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "MCP chưa bật: biến môi trường CINEMAS_AGENT_KEY chưa được cấu hình " +
            "trên deployment này. Nếu vừa set trên Vercel, cần Redeploy (Vercel " +
            "KHÔNG tự redeploy khi thêm env var).",
        },
        id: null,
      },
      { status: 401 }
    );
  }
  if (auth !== `Bearer ${key}`) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "Unauthorized: Authorization header không khớp CINEMAS_AGENT_KEY. " +
            'Định dạng đúng: Authorization: Bearer <key> (không có dấy nháy, ' +
            "không có khoảng trắng thừa).",
        },
        id: null,
      },
      { status: 401 }
    );
  }

  // Rate limit theo key (không IP — agent có thể chạy từ nhiều nơi)
  const limit = await consumeRateLimit(rateLimitKey("mcp", "agent"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32002, message: "Rate limit — thử lại sau" }, id: null },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 }
    );
  }

  const id = body.id ?? null;
  const rpcError = (code: number, message: string) =>
    NextResponse.json({ jsonrpc: "2.0", error: { code, message }, id });

  switch (body.method) {
    case "initialize":
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: {
            name: "cinemas-mcp",
            version: "1.1.0",
            title: "CineStar Cinemas — Movie Booking",
          },
        },
      });

    case "notifications/initialized":
      return new NextResponse(null, { status: 202 });

    case "tools/list":
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      });

    case "tools/call": {
      const name = (body.params as { name?: string })?.name;
      const args = ((body.params as { arguments?: Record<string, unknown> })?.arguments ?? {}) as never;
      try {
        let result: ToolResult;
        if (name === "list_movies") result = await toolListMovies(args);
        else if (name === "get_showtimes") result = await toolGetShowtimes(args);
        else if (name === "check_seats") result = await toolCheckSeats(args);
        else if (name === "hold_seats") result = await toolHoldSeats(args);
        else return rpcError(-32602, `Tool không tồn tại: ${name}`);
        return NextResponse.json({ jsonrpc: "2.0", id, result });
      } catch (e) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: `Lỗi server: ${String(e)}` }], isError: true },
        });
      }
    }

    case "ping":
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} });

    default:
      return rpcError(-32601, `Method không hỗ trợ: ${body.method}`);
  }
}
