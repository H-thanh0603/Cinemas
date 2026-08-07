import { PrismaClient } from "@prisma/client";
import { realMovieCatalogue } from "../src/lib/real-movie-catalogue";

/**
 * In-place catalogue sync for production DB.
 * - Idioms update each movie row matched by slug/legacySlug (no delete → bookings/showtimes intact).
 * - Replaced films (e.g. Deadpool & Wolverine -> Interstellar) are remapped by their OLD slug,
 *   updating the row in place so showtimes keep pointing at a live movie.
 * - Bumps posterUrl to the w1280 URL from the catalogue.
 * Does NOT clear bookings/promotions/showtimes — safe to run on prod.
 */
const prisma = new PrismaClient();

async function main() {
  const genreRows = await prisma.genre.findMany({ select: { id: true, slug: true } });
  const genreIds = new Map(genreRows.map((g) => [g.slug, g.id]));

  // New slug -> old slug still present in the DB, whose row we repurpose for the
  // replacement film (keeps showtime FK pointing at a live movie).
  const SLUG_REMAP: Record<string, string> = { interstellar: "deadpool-wolverine" };

  let updated = 0;
  for (const movie of realMovieCatalogue) {
    const ids = movie.genres.map((slug) => genreIds.get(slug));
    if (ids.some((id) => !id)) throw new Error(`Missing genre for ${movie.slug}`);

    const targetSlug = SLUG_REMAP[movie.slug] ?? movie.slug;
    const existing = await prisma.movie.findUnique({ where: { slug: movie.slug } });
    // If the new slug isn't in DB (film was swapped), find the old-sentence row.
    const row = existing ?? (targetSlug !== movie.slug
      ? await prisma.movie.findUnique({ where: { slug: targetSlug } })
      : null);
    if (!row) throw new Error(`Missing movie row for ${movie.slug} (or old slug ${targetSlug})`);

    await prisma.movie.update({
      where: { id: row.id },
      data: {
        slug: movie.slug,
        title: movie.title,
        description: movie.description,
        posterUrl: movie.posterUrl,
        backdropUrl: null,
        durationMin: movie.durationMin,
        ageRating: movie.ageRating,
        director: movie.director,
        cast: movie.cast,
        releaseDate: movie.releaseDate,
        status: movie.status,
        popularity: movie.popularity,
        genres: { deleteMany: {}, create: ids.map((genreId) => ({ genreId: genreId! })) },
      },
    });
    updated++;
  }

  if (updated !== realMovieCatalogue.length) {
    throw new Error(`Expected ${realMovieCatalogue.length} updates, did ${updated}.`);
  }
  console.log(`Synced ${updated} movies in place (bookings/showtimes preserved).`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });