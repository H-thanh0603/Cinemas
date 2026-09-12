import { NextRequest } from "next/server";
import { handleMcp } from "@/lib/mcp/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/mcp — MCP server endpoint (Model Context Protocol).
 * Xem src/lib/mcp/handler.ts cho protocol details.
 *
 * Không tắt khi thiếu CINEMAS_AGENT_KEY — handler fail-closed 401,
 * để client nhận lỗi rõ ràng thay vì 404 bí ẩn.
 */
export async function POST(req: NextRequest) {
  return handleMcp(req);
}

// MCP streamable HTTP client có thể GET để khởi tạo session — trả 405
// vì server này stateless (mỗi request tự auth qua Bearer key).
export function GET() {
  return Response.json(
    { error: "MCP endpoint này stateless — dùng POST với JSON-RPC body." },
    { status: 405 }
  );
}
