import { prisma } from "./prisma";

/**
 * Ids of movies whose title is trigram-similar to `q` (typo tolerance).
 * Requires the pg_trgm extension (migration 20260825000000_fuzzy_search).
 * Returns [] when the extension is missing so callers degrade to substring search.
 */
export async function fuzzyMovieIds(q: string): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Movie"
      WHERE "title" % ${q}
      ORDER BY similarity("title", ${q}) DESC
      LIMIT 50
    `;
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}
