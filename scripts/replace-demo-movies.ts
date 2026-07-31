import { PrismaClient } from "@prisma/client";
import { realMovieCatalogue } from "../src/lib/real-movie-catalogue";

const prisma = new PrismaClient();

async function main() {
  const legacySlugs = realMovieCatalogue.map((movie) => movie.legacySlug);
  const catalogueSlugs = realMovieCatalogue.map((movie) => movie.slug);
  const movies = await prisma.movie.findMany({
    where: { slug: { in: [...legacySlugs, ...catalogueSlugs] } },
    select: { id: true, slug: true },
  });

  if (movies.length !== realMovieCatalogue.length) {
    throw new Error("Catalogue update stopped: expected demo movies are missing.");
  }

  const genres = await prisma.genre.findMany({ select: { id: true, slug: true } });
  const genreIds = new Map(genres.map((genre) => [genre.slug, genre.id]));
  const moviesBySlug = new Map(movies.map((movie) => [movie.slug, movie]));

  await prisma.$transaction(
    realMovieCatalogue.map((movie) => {
      const ids = movie.genres.map((slug) => genreIds.get(slug));
      const existing = moviesBySlug.get(movie.legacySlug) ?? moviesBySlug.get(movie.slug);
      if (ids.some((id) => !id)) throw new Error(`Missing genre for ${movie.slug}`);
      if (!existing) throw new Error(`Missing movie for ${movie.slug}`);

      return prisma.movie.update({
        where: { id: existing.id },
        data: {
          slug: movie.slug,
          title: movie.title,
          description: movie.description,
          posterUrl: movie.posterUrl,
          backdropUrl: null,
          trailerUrl: null,
          durationMin: movie.durationMin,
          ageRating: movie.ageRating,
          director: movie.director,
          cast: movie.cast,
          releaseDate: movie.releaseDate,
          status: movie.status,
          popularity: movie.popularity,
          genres: {
            deleteMany: {},
            create: ids.map((genreId) => ({ genreId: genreId! })),
          },
        },
      });
    })
  );

  const updated = await prisma.movie.findMany({
    where: { slug: { in: catalogueSlugs } },
    select: { posterUrl: true },
  });
  if (
    updated.length !== realMovieCatalogue.length ||
    updated.some((movie) => !movie.posterUrl.startsWith("https://image.tmdb.org/"))
  ) {
    throw new Error("Catalogue verification failed: expected TMDB posters were not saved.");
  }

  console.log(`Updated ${realMovieCatalogue.length} movies with verified TMDB posters.`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
