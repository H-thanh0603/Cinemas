# Backup & Restore — Cinemas production (Supabase)

## Chiến lược

| Lớp | Gì | Chu kỳ | Phạm vi |
|---|---|---|---|
| 1. PITR Supabase | Supabase tự giữ WAL 7 ngày (free tier) | Liên tục | Tự động |
| 2. Logical dump | `scripts/backup-db.sh` → `backups/*.sql.gz` | Mỗi ngày | Schema + data |
| 3. Restore-test | Khôi phục vào DB trống, đếm bảng/dòng | Sau mỗi lần backup | Xác minh |

> Backup chưa test restore = chưa có backup. Lớp 3 là bắt buộc.

## Backup hằng ngày

```bash
# URL lấy từ Supabase Dashboard → Connect (session pooler, port 5432)
export SUPABASE_DB_URL="postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"

./scripts/backup-db.sh
# → backups/backup-YYYYMMDD-HHMMSS.sql.gz (giữ 14 bản gần nhất, tuỳ BACKUP_KEEP)
```

Script tự verify: dump phải chứa `CREATE TABLE public."Booking"` — nếu thiếu thì fail exit 1.

## Restore-test (chạy ít nhất mỗi tuần hoặc sau backup lớn)

```bash
# 1. DB trống để test (local hoặc Supabase project tạm)
createdb restore_test

# 2. Restore
gunzip -c backups/backup-<STAMP>.sql.gz | psql -d restore_test

# 3. Verify đủ bảng + dữ liệu
psql -d restore_test -c 'SELECT count(*) FROM pg_tables WHERE schemaname=$$public$$;'  # kỳ vọng 21
psql -d restore_test -c 'SELECT count(*) FROM "Movie";'                                # > 0
psql -d restore_test -c 'SELECT count(*) FROM "Showtime";'                              # > 0

# 4. Dọn
dropdb restore_test
```

Kết quả tham chiếu (2026-09-12, restore từ backup production): 21 bảng, 10 Movie, 779 Showtime, 12 Booking, 562 Seat — khớp 100% nguồn.

## Restore THẬT khi sự cố

```bash
# Vào project Supabase MỚI (không restore đè lên DB đang chạy trừ khi chắc chắn)
gunzip -c backups/backup-<STAMP>.sql.gz | psql "$NEW_SUPABASE_URL"
# Rồi update DATABASE_URL trên Vercel → project mới
```

Dump dùng `--no-owner --no-privileges` nên không vướng role khi khôi phục chéo project.

## Tự động hoá (GitHub Actions cron — tuỳ chọn)

```yaml
# .github/workflows/backup.yml
on:
  schedule:
    - cron: "30 17 * * *" # 00:30 VN (UTC+7) hằng ngày
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install postgres client
        run: sudo apt-get install -y postgresql-client
      - run: ./scripts/backup-db.sh
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
      # Artifact upload: dùng actions/upload-artifact, giữ theo policy
```

Lưu ý secret: `SUPABASE_DB_URL` chứa password DB — chỉ lưu trong GitHub Secrets, không commit.
