# Load tests (k6)

Measure browse + booking under concurrent VUs. Uses Docker image `grafana/k6` (no local k6 install).

## Prerequisites

1. Docker Desktop running  
2. Postgres: `docker compose up -d db`  
3. App in **production** mode with secret:

```bash
# .env
LOADTEST_SECRET=loadtest-dev-secret

npm run build
# set LOADTEST_SECRET in env for the process
set LOADTEST_SECRET=loadtest-dev-secret   # Windows cmd
$env:LOADTEST_SECRET="loadtest-dev-secret"  # PowerShell
npm run start
```

## Scripts

| File | Purpose |
|------|---------|
| `browse.js` | 100% page GET (/, /movies, …) |
| `mixed.js` | ~90% read + ~10% book via `/api/loadtest/scenario` |
| `run-all.ps1` | Ladder 100 → 500 → 1000 |

## Run one scenario

```powershell
docker run --rm `
  -e BASE_URL=http://host.docker.internal:3000 `
  -e LOADTEST_SECRET=loadtest-dev-secret `
  -e VUS=100 -e DURATION=30s -e BOOK_RATIO=0.1 `
  -v "${PWD}/scripts/k6/mixed.js:/scripts/test.js:ro" `
  grafana/k6:0.54.0 run /scripts/test.js
```

## Full ladder

```powershell
pwsh scripts/k6/run-all.ps1
# or: npm run loadtest
```

Results: `scripts/k6/results/*.txt`

## Notes

- Book conflicts (HTTP 409 seat taken) are **expected** under contention — not counted as system errors in `errors` rate.  
- `LOADTEST_SECRET` must match app env or API returns 403.  
- Do **not** expose loadtest API in production without network lockdown.  
