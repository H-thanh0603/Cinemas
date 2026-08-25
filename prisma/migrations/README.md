# Lưu ý khi tạo migration với `prisma migrate dev`

## Bẫy drift: `Movie_title_trgm_idx`

Index full-text/trigram trên `Movie.title` được tạo **chủ đích bằng raw SQL**
trong migration `20260825000000_fuzzy_search`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Movie_title_trgm_idx" ON "Movie" USING gin ("title" gin_trgm_ops);
```

Prisma schema **không diễn đạt được** GIN expression index (operator class),
nên mỗi lần chạy `prisma migrate dev` Prisma sẽ coi index này là "drift" và
chèn sẵn vào migration mới dòng:

```sql
DROP INDEX "Movie_title_trgm_idx";
```

Quy tắc bắt buộc trước khi apply migration vừa tạo:

1. Mở file `migration.sql` mới sinh ra.
2. **Xóa mọi dòng liên quan đến `Movie_title_trgm_idx`** (và extension pg_trgm).
3. Nếu lỡ apply rồi, khôi phục bằng đúng 2 câu lệnh CREATE ở trên.

CI (`migrate deploy`) không bao giờ tự sinh thêm SQL nên an toàn; bước
"Detect schema drift" trong workflow cũng đã allow-list index này.

## Quy trình khi lỡ chạy `migrate dev` và nó xóa index

```bash
node -e "/* chạy CREATE EXTENSION + CREATE INDEX ở trên qua PrismaClient \$executeRawUnsafe */"
# sửa file migration.sql như mục 1–2, sau đó đồng bộ sổ sách migration:
psql "$DATABASE_URL" -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '<tên_mới>';"
npx prisma migrate resolve --applied <tên_mới>
```
