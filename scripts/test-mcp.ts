/**
 * Integration test MCP endpoint — chạy theo đúng giao thức JSON-RPC 2.0
 * mà agent (Claude/ChatGPT) sẽ gọi.
 *
 * Cần server dev/prod đang chạy + CINEMAS_AGENT_KEY set ở server.
 * Chạy: BASE_URL=http://localhost:3000 AGENT_KEY=xxx npx tsx scripts/test-mcp.ts
 * (Nếu BASE_URL trỏ production — dùng key production.)
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const KEY = process.env.AGENT_KEY ?? process.env.CINEMAS_AGENT_KEY ?? "";
const API = `${BASE}/api/mcp`;

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function rpc(method: string, params?: Record<string, unknown>, key = KEY) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  key = KEY
) {
  return rpc("tools/call", { name, arguments: args }, key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper parse JSON động
function content(result: Record<string, unknown>): any {
  const r = result.result as { content?: { text: string }[] } | undefined;
  return r?.content?.[0]?.text ? JSON.parse(r.content[0].text) : null;
}

async function main() {
  if (!KEY) throw new Error("Set AGENT_KEY (phải khớp CINEMAS_AGENT_KEY của server)");

  console.log(`[MCP integration test] → ${API}\n`);

  // ── 0. Auth fail-closed ─────────────────────────────────────────────
  console.log("[0] Auth");
  const noAuth = await rpc("initialize", undefined, "");
  check("no key → 401", noAuth.status === 401);
  const errMsg = (noAuth.body.error as { message?: string })?.message ?? "";
  check("error tự chẩn đoán (phân biệt chưa-set vs sai-key)", errMsg.length > 0);
  const badKey = await rpc("initialize", undefined, "wrong-key");
  check("sai key → 401 + message khác (không tiết lộ key)", badKey.status === 401);

  // ── 1. Initialize handshake ─────────────────────────────────────────
  console.log("\n[1] Initialize");
  const init = await rpc("initialize");
  check("status 200", init.status === 200);
  const initResult = init.body.result as { protocolVersion?: string; serverInfo?: { name?: string } } | undefined;
  check("protocolVersion", Boolean(initResult?.protocolVersion));
  check("serverInfo.name = cinemas-mcp", initResult?.serverInfo?.name === "cinemas-mcp");

  // ── 2. tools/list ───────────────────────────────────────────────────
  console.log("\n[2] tools/list");
  const tools = await rpc("tools/list");
  const toolList = (tools.body.result as { tools?: { name: string }[] })?.tools ?? [];
  check("4 tools", toolList.length === 4, `got ${toolList.length}`);
  check(
    "đủ tên tool",
    ["list_movies", "get_showtimes", "check_seats", "hold_seats"].every((n) =>
      toolList.some((t) => t.name === n)
    )
  );

  // ── 3. list_movies ──────────────────────────────────────────────────
  console.log("\n[3] list_movies");
  const nowShowing = await callTool("list_movies", { status: "NOW_SHOWING" });
  const movies = content(nowShowing.body);
  check("NOW_SHOWING trả về phim", (movies?.count ?? 0) > 0, `count=${movies?.count}`);
  check("có slug interstellar", movies?.movies?.some((m: { slug: string }) => m.slug === "interstellar"));

  // ── 4. get_showtimes ────────────────────────────────────────────────
  console.log("\n[4] get_showtimes");
  const sts = await callTool("get_showtimes", { movie_slug: "interstellar" });
  const showtimes = content(sts.body);
  check("có suất chiếu tương lai", (showtimes?.count ?? 0) > 0);
  const st = showtimes?.showtimes?.[0];
  check("suất có id + starts_at_iso", Boolean(st?.id && st?.starts_at_iso));
  // Filter theo rạp
  const stDn = await callTool("get_showtimes", {
    movie_slug: "interstellar",
    cinema_slug: "cinestar-da-nang",
  });
  const dnList = content(stDn.body);
  check(
    "lọc rạp đà nẵng đúng",
    (dnList?.count ?? 0) > 0 &&
      dnList.showtimes.every((s: { cinema_slug: string }) => s.cinema_slug === "cinestar-da-nang")
  );
  // Phim không tồn tại
  const st404 = await callTool("get_showtimes", { movie_slug: "khong-ton-tai" });
  check("phim sai slug → isError", Boolean((st404.body.result as { isError?: boolean })?.isError));

  // ── 5. check_seats + suggestion ─────────────────────────────────────
  console.log("\n[5] check_seats");
  const seats = await callTool("check_seats", { showtime_id: st.id, want_count: 2 });
  const seatData = content(seats.body);
  check("seat_map có ghế", Object.keys(seatData?.seat_map ?? {}).length > 0);
  check("suggestion 2 ghế kề nhau", seatData?.suggestion?.count === 2, `count=${seatData?.suggestion?.count}`);
  check(
    "suggestion ghế thật cùng hàng",
    seatData?.suggestion?.seats?.length === 2 &&
      seatData.suggestion.seats[0].charAt(0) === seatData.suggestion.seats[1].charAt(0)
  );
  check("estimated_total_vnd > 0", (seatData?.suggestion?.estimated_total_vnd ?? 0) > 0);

  // ── 6. hold_seats + idempotency ─────────────────────────────────────
  console.log("\n[6] hold_seats");
  const holdArgs = {
    showtime_id: st.id,
    seat_ids: seatData.suggestion.seat_ids,
    contact_name: "MCP Test Agent",
    contact_email: "mcp-test@example.com",
    contact_phone: "0912345678",
    idempotency_key: `mcp-test-${Date.now()}`,
  };
  const hold = await callTool("hold_seats", holdArgs);
  const holdData = content(hold.body);
  check("giữ ghế thành công", Boolean(holdData?.success), JSON.stringify(holdData).slice(0, 120));
  check("trả mã đơn CS-", /^CS-/.test(holdData?.booking_code ?? ""));
  check("trả link thanh toán", (holdData?.payment_page ?? "").includes("/booking/pay/"));
  check(
    "hold_expires có giờ VN",
    /\d{1,2}:\d{2}:\d{2}/.test(holdData?.hold_expires_vn ?? ""),
    `got: ${holdData?.hold_expires_vn}`
  );

  // Idempotent: gọi lại cùng key → cùng mã đơn, KHÔNG tạo đơn mới
  const hold2 = await callTool("hold_seats", holdArgs);
  const holdData2 = content(hold2.body);
  check("idempotent — cùng mã đơn", holdData2?.booking_code === holdData?.booking_code);

  // Ghế vừa giữ phải bây giờ là "taken" trong check_seats
  const seats2 = await callTool("check_seats", { showtime_id: st.id });
  const seatData2 = content(seats2.body);
  const heldLabel = seatData.suggestion.seats[0];
  check(
    "ghế vừa giữ → taken",
    seatData2.seat_map[heldLabel]?.status === "taken",
    `status=${seatData2.seat_map[heldLabel]?.status}`
  );

  // Giữ ghế đã bị giữ (bởi đơn ở trên) → phải fail
  const steal = await callTool("hold_seats", {
    showtime_id: st.id,
    seat_ids: seatData.suggestion.seat_ids,
    contact_name: "MCP Test Agent",
    contact_email: "mcp-test2@example.com",
    contact_phone: "0912345678",
    idempotency_key: `mcp-steal-${Date.now()}`,
  });
  check("giữ ghế bị chiếm → isError", Boolean((steal.body.result as { isError?: boolean })?.isError));

  // ── 7. Cleanup: hủy booking test (nhả ghế) ─────────────────────────
  console.log("\n[7] Cleanup");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const code = holdData?.booking_code as string;
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { seatLocks: true },
  });
  if (booking) {
    await prisma.showtimeSeatLock.deleteMany({ where: { bookingId: booking.id } });
    await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    console.log(`  → đã dọn booking test ${code} + nhả ghế`);
  }
  await prisma.$disconnect();

  console.log(`\nKết quả: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
