-- 2FA (TOTP) cho tài khoản ADMIN.
-- Lưu ý: KHÔNG chứa DROP INDEX "Movie_title_trgm_idx" — dòng đó do drift của
-- `migrate dev` với raw-SQL index trong migration fuzzy_search (xem README.md).

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
