/**
 * Mixed load ~90% read / ~10% book (hold+pay via loadtest API).
 *
 * Env:
 *   BASE_URL=http://host.docker.internal:3000
 *   LOADTEST_SECRET=...
 *   VUS=100
 *   DURATION=30s
 *   BOOK_RATIO=0.1
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter, Trend } from "k6/metrics";
const BASE = __ENV.BASE_URL || "http://host.docker.internal:3000";
const SECRET = __ENV.LOADTEST_SECRET || "loadtest-dev-secret";
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || "30s";
const BOOK_RATIO = Number(__ENV.BOOK_RATIO || 0.1);

const errorRate = new Rate("errors");
const bookOk = new Counter("book_ok");
const bookFail = new Counter("book_fail");
const bookMs = new Trend("book_duration", true);
const pageMs = new Trend("page_duration", true);

export const options = {
  scenarios: {
    mixed: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.15"], // book conflicts expected under contention
    http_req_duration: ["p(95)<5000"],
  },
};

// Fetch scenario once per VU at start via setup
export function setup() {
  const res = http.get(`${BASE}/api/loadtest/scenario`, {
    headers: { "x-loadtest-secret": SECRET },
    timeout: "30s",
  });
  if (res.status !== 200) {
    console.error("setup failed", res.status, res.body);
    return null;
  }
  return res.json();
}

export default function (data) {
  if (!data || !data.showtimeId) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const roll = Math.random();

  if (roll < BOOK_RATIO && data.freeSeatIds && data.freeSeatIds.length > 0) {
    // Prefer different seats per VU to reduce artificial conflict
    const idx =
      (__VU * 7 + __ITER * 3) % Math.max(1, data.freeSeatIds.length);
    const seatId = data.freeSeatIds[idx];
    const payload = JSON.stringify({
      showtimeId: data.showtimeId,
      seatId,
      ticketTypeId: data.ticketTypeId,
      pay: true,
    });
    const res = http.post(`${BASE}/api/loadtest/scenario`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-loadtest-secret": SECRET,
        "x-vu": String(__VU) + "-" + String(__ITER),
      },
      tags: { name: "book" },
      timeout: "45s",
    });
    bookMs.add(res.timings.duration);
    // 409 seat taken is expected under load — count separately
    if (res.status === 200) {
      bookOk.add(1);
      errorRate.add(0);
    } else if (res.status === 409) {
      bookFail.add(1);
      errorRate.add(0); // business conflict, not system error
    } else {
      bookFail.add(1);
      errorRate.add(1);
    }
  } else {
    const paths = [
      "/",
      "/movies",
      "/movies?status=NOW_SHOWING",
      `/movies/${data.movieSlug || ""}`,
      `/api/showtimes/${data.showtimeId}/seats`,
      "/cinemas",
    ].filter((p) => p.length > 1);

    const path = paths[Math.floor(Math.random() * paths.length)];
    const res = http.get(`${BASE}${path}`, {
      tags: { name: path.startsWith("/api") ? "api_seats" : "page" },
      timeout: "30s",
    });
    pageMs.add(res.timings.duration);
    const ok = check(res, { "read ok": (r) => r.status === 200 });
    errorRate.add(!ok);
  }

  sleep(0.2 + Math.random() * 0.5);
}

export function handleSummary(data) {
  const m = data.metrics;
  const line = (name) => {
    const x = m[name];
    if (!x) return null;
    return x.values;
  };
  const summary = {
    vus: VUS,
    duration: DURATION,
    book_ratio: BOOK_RATIO,
    http_reqs: line("http_reqs"),
    http_req_failed: line("http_req_failed"),
    http_req_duration: line("http_req_duration"),
    errors: line("errors"),
    book_ok: line("book_ok"),
    book_fail: line("book_fail"),
    book_duration: line("book_duration"),
    page_duration: line("page_duration"),
  };
  return {
    stdout: textReport(summary),
    "scripts/k6/results-last.json": JSON.stringify(summary, null, 2),
  };
}

function textReport(s) {
  const d = s.http_req_duration || {};
  const fail = s.http_req_failed || {};
  const reqs = s.http_reqs || {};
  const bok = s.book_ok || {};
  const bfail = s.book_fail || {};
  const bd = s.book_duration || {};
  const pd = s.page_duration || {};
  return `
========== LOAD TEST SUMMARY ==========
VUs=${s.vus}  duration=${s.duration}  book_ratio=${s.book_ratio}
http_reqs=${reqs.count ?? "n/a"}  rate=${reqs.rate?.toFixed?.(1) ?? "n/a"}/s
http_req_failed=${((fail.rate ?? 0) * 100).toFixed(2)}%
http_req_duration p50=${fmt(d["p(50)"])}  p95=${fmt(d["p(95)"])}  p99=${fmt(d["p(99)"])}  avg=${fmt(d.avg)}
page_duration p95=${fmt(pd["p(95)"])}  avg=${fmt(pd.avg)}
book_duration p95=${fmt(bd["p(95)"])}  avg=${fmt(bd.avg)}
book_ok=${bok.count ?? 0}  book_fail=${bfail.count ?? 0}
=======================================
`;
}

function fmt(ms) {
  if (ms == null || Number.isNaN(ms)) return "n/a";
  return `${ms.toFixed(0)}ms`;
}
