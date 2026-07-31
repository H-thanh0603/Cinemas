import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const routes = [
  "src/app/api/admin/bookings/[id]/route.ts",
  "src/app/api/admin/cinemas/[id]/route.ts",
  "src/app/api/admin/cinemas/route.ts",
  "src/app/api/admin/movies/[id]/route.ts",
  "src/app/api/admin/movies/route.ts",
  "src/app/api/admin/promotions/[id]/route.ts",
  "src/app/api/admin/promotions/route.ts",
  "src/app/api/admin/rooms/[id]/route.ts",
  "src/app/api/admin/rooms/[id]/seats/route.ts",
  "src/app/api/admin/rooms/route.ts",
  "src/app/api/admin/showtimes/[id]/route.ts",
  "src/app/api/admin/showtimes/route.ts",
];

for (const route of routes) {
  const source = readFileSync(join(root, route), "utf8");
  if (!source.includes('from "@/lib/admin-auth"') || !source.includes("requireAdmin")) {
    throw new Error(`Missing direct requireAdmin guard: ${route}`);
  }
}

if (!existsSync(join(root, "src/lib/admin-schemas.ts"))) {
  throw new Error("Missing admin Zod schemas");
}

console.log("admin route hardening checks passed");
