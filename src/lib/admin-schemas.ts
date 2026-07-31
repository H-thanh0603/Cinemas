import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const id = z.string().trim().min(1).max(64);
const dateText = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Ngày không hợp lệ");
const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "URL không hợp lệ");
const safeImageUrl = safeUrl.refine((value) => {
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return ["placehold.co", "images.unsplash.com", "image.tmdb.org"].includes(host);
}, "Domain ảnh chưa được tin cậy");

export const cinemaSchema = z.object({
  name: text(160),
  slug: text(160).optional(),
  address: text(300),
  city: text(100),
  phone: z.string().trim().max(30).optional(),
  openingHours: z.string().trim().max(100).optional(),
  description: optionalText(2000),
  isActive: z.boolean().optional(),
});

export const movieSchema = z.object({
  title: text(200),
  slug: text(200).optional(),
  description: z.string().trim().max(10000).optional(),
  posterUrl: safeImageUrl.optional(),
  backdropUrl: safeImageUrl.optional().nullable(),
  trailerUrl: safeUrl.optional().nullable(),
  durationMin: z.coerce.number().int().min(1).max(600),
  releaseDate: dateText,
  ageRating: z.enum(["P", "K", "T13", "T16", "T18"]).optional(),
  status: z.enum(["NOW_SHOWING", "COMING_SOON", "ARCHIVED"]).optional(),
  director: z.string().trim().max(200).optional(),
  cast: z.string().trim().max(5000).optional(),
  genreIds: z.array(id).max(20).optional(),
});

export const roomSchema = z.object({
  name: text(100),
  cinemaId: id,
  rows: z.coerce.number().int().min(3).max(20),
  cols: z.coerce.number().int().min(5).max(25),
});

export const showtimeSchema = z.object({
  movieId: id,
  roomId: id,
  startTime: dateText,
  format: z.enum(["2D", "3D", "IMAX"]),
  basePrice: z.coerce.number().int().min(1000).max(10_000_000),
});

export const promotionSchema = z.object({
  code: text(40).transform((value) => value.toUpperCase()),
  description: text(500),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().int().min(1).max(100_000_000),
  startsAt: dateText,
  expiresAt: dateText,
  maxUses: z.coerce.number().int().min(1).max(10_000_000).optional().nullable(),
  minOrderValue: z.coerce.number().int().min(0).max(100_000_000).optional(),
  isActive: z.boolean().optional(),
});

export function parseAdminBody<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: "Dữ liệu không hợp lệ" };
}
