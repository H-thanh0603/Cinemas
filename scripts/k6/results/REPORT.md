# Load test report — CineStar

**Date:** 2026-07-21  
**Target:** `next start` (production) + Postgres Docker on localhost  
**Machine:** Windows + Docker k6 → `host.docker.internal:3000`  
**Tool:** grafana/k6:0.54.0  

## Scenarios

| Name | Mix | Duration |
|------|-----|----------|
| **browse** | 100% GET pages (`/`, `/movies`, `/cinemas`, …) | 25s |
| **mixed** | ~90% read + ~10% hold+pay via `/api/loadtest/scenario` | 35s |

## Results

### Browse only

| VUs | reqs | fail rate | p95 latency | checks OK | Verdict |
|-----|------|-----------|-------------|-----------|---------|
| **100** | 2342 (~89/s) | **0%** | **~1.1s** | 100% | Pass (acceptable for demo) |
| **500** | 2985 (~102/s) | **~9.8%** | **~7.2s** | 90% | Fail thresholds |
| **1000** | 17215* | **~87%** | **~6.3s** (successful only much worse) | 13% | Collapse / connection failures |

\*Many failed connects counted as fast failures; successful responses p95 ~19s.

### Mixed (read + book)

| VUs | reqs | HTTP fail | p95 | book_ok | book_fail | Notes |
|-----|------|-----------|-----|---------|-----------|-------|
| **100** | 3766 (~105/s) | ~9.8% | **~1.0s** | 40 | 369 | Many 409 seat conflicts expected |
| **500** | 3606 (~97/s) | ~9.5% | **~11.6s** | 36 | 343 | Latency bad |
| **1000** | 3639 (~60/s) | ~3%* | **~15.7s** | 0 | 0 | Server overload; connection refused / timeout |

\*At 1000 VU, low “HTTP fail %” is misleading: many hangs/timeouts and connection refused; throughput drops; app unstable.

## Conclusions

1. **~100 concurrent browse users:** workable on this stack (1 Next process + local Postgres).  
2. **~100 concurrent mixed:** system stays up; booking has contention (locks working); p95 ~1s.  
3. **500+ VU:** p95 multi-second, rising errors — **not production-ready**.  
4. **1000 VU:** connection refused / timeouts — **does not handle 1000 concurrent well**.  

## Reproduce

```bash
# .env: LOADTEST_SECRET=loadtest-dev-secret
npm run build && npm run start
npm run loadtest
```

See `scripts/k6/README.md`.
