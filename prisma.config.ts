import { defineConfig } from "@prisma/config";

/**
 * Prisma config file (thay package.json#prisma — deprecated, sẽ bị gỡ
 * ở Prisma 7). Chỉ giữ seed command; mọi thứ khác vẫn từ schema.prisma
 * + env DATABASE_URL như cũ.
 *
 * Lưu ý: prisma.config.ts KHÔNG load .env — CI/dev cần export
 * DATABASE_URL trước khi chạy lệnh prisma (như trước đây).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
