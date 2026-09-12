#!/usr/bin/env bash
# Backup Supabase database (Cinemas production) → file .sql.gz
#
# Cách chạy:
#   SUPABASE_DB_URL="postgresql://..." ./scripts/backup-db.sh
#
# Lấy URL: Supabase Dashboard → Connect (Session pooler, port 5432).
# Ví dụ cron GitHub Actions / server: chạy mỗi ngày, giữ N bản gần nhất.
#
# Restore-test (quan trọng — backup chưa test restore = chưa có backup):
#   gunzip -c backup-YYYYMMDD.sql.gz | psql "$SUPABASE_DB_URL"   # vào DB trống
#
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:?Phải set SUPABASE_DB_URL (session pooler URL từ Supabase Connect)}"
OUT_DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP:-14}" # số bản giữ lại
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/backup-$STAMP.sql.gz"

mkdir -p "$OUT_DIR"

echo "→ Dumping schema + data..."
# --no-owner --no-privileges: khôi phục vào project Supabase mới không vướng role
pg_dump "$DB_URL" \
  --format=plain \
  --no-owner --no-privileges \
  --clean --if-exists \
  | gzip -9 > "$OUT_FILE"

SIZE=$(du -h "$OUT_FILE" | cut -f1)
echo "✅ Backup OK: $OUT_FILE ($SIZE)"

# Verify nhanh: file dump có chứa lệnh CREATE TABLE của bảng chính không?
# (zgrep tránh SIGPIPE của pipeline "gunzip | grep -q" dưới pipefail)
if ! zgrep -qE 'CREATE TABLE (public\.)?"Booking"' "$OUT_FILE"; then
  echo "❌ Verify fail: không tìm thấy CREATE TABLE \"Booking\" trong dump" >&2
  exit 1
fi
echo "✅ Verify pass: dump chứa schema đầy đủ"

# Xoá các bản cũ hơn KEEP
ls -1t "$OUT_DIR"/backup-*.sql.gz 2>/dev/null | tail -n "+$((KEEP + 1))" | while read -r old; do
  echo "→ Dọn bản cũ: $old"
  rm -f "$old"
done

echo "Hoàn tất. Nhớ restore-test định kỳ:"
echo "  gunzip -c $OUT_FILE | psql \"\$RESTORE_DB_URL\""
