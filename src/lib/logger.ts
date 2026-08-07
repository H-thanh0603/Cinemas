import { randomUUID } from "node:crypto";

type Meta = Record<string, unknown>;
type Level = "info" | "warn" | "error";

function render(level: Level, msg: string, meta?: Meta): string {
  const parts = [
    `ts=${new Date().toISOString()}`,
    `lvl=${level}`,
    `rid=${meta?.rid ?? randomUUID()}`,
  ];
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      if (v == null || k === "rid") continue;
      if (typeof v === "object") parts.push(`${k}=${JSON.stringify(v)}`);
      else parts.push(`${k}=${String(v)}`);
    }
  }
  parts.push(msg);
  return parts.join(" ");
}

/**
 * Structured logger: 1 dòng/event, parse được bằng eye/koi, có request-id.
 * Truyền rid qua meta khi có (từ req.headers x-request-id) để nối request→error.
 * Không log secret — không nhận giá trị nhạy cảm.
 */
export const logger = {
  info(msg: string, meta?: Meta) {
    console.info(render("info", msg, meta));
  },
  warn(msg: string, meta?: Meta) {
    console.warn(render("warn", msg, meta));
  },
  error(msg: string, err?: unknown, meta?: Meta) {
    const m = { ...(meta ?? {}) };
    if (err instanceof Error) {
      m.error = err.message;
      m.stack = err.stack;
    } else if (err !== undefined) {
      m.error = String(err);
    }
    console.error(render("error", msg, m));
  },
};
