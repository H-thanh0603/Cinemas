/**
 * Browse-heavy load: homepage, movies list, seats API.
 * Usage:
 *   docker run --rm -i -e BASE_URL=http://host.docker.internal:3000 \
 *     grafana/k6 run - < scripts/k6/browse.js
 *
 * Env: BASE_URL, VUS, DURATION
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE = __ENV.BASE_URL || "http://host.docker.internal:3000";
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || "30s";

const errorRate = new Rate("errors");
const pageMs = new Trend("page_duration", true);

export const options = {
  scenarios: {
    browse: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
    errors: ["rate<0.05"],
  },
};

export default function () {
  const pages = ["/", "/movies", "/movies?status=NOW_SHOWING", "/cinemas", "/promotions"];
  const path = pages[Math.floor(Math.random() * pages.length)];
  const res = http.get(`${BASE}${path}`, {
    tags: { name: "page" },
    timeout: "30s",
  });
  const ok = check(res, {
    "status 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);
  pageMs.add(res.timings.duration);
  sleep(0.3 + Math.random() * 0.7);
}
