/**
 * Per-context TMDB image sizing.
 *
 * Catalogue/DB stores a full w1280 URL (from the initial sync). Render sites
 * choose the right CDN size tier for their real viewport instead of reusing
 * that heavy w1280 everywhere. The helper rewrites the size segment on the
 * stored URL — no DB migration needed. ponytail: swap to storing a raw
 * posterPath when the schema is next touched; the size map below won't change.
 */
export type TmdbImageContext = "hero" | "card" | "thumbnail";

const CDN = "https://image.tmdb.org/t/p";
const SIZES: Record<TmdbImageContext, string> = {
  hero: "w1280",
  card: "w500",
  thumbnail: "w342",
};

export function getTmdbImageUrl(url: string, ctx: TmdbImageContext): string {
  // Accepts either a full CDN URL or a bare path like "/abc.jpg".
  const clean = url.startsWith(CDN) ? url : `${CDN}${url.startsWith("/") ? "" : "/"}${url}`;
  const matches = /\/t\/p\/[^/]+\/(.+)$/.exec(clean);
  if (!matches) return url;
  return `${CDN}/${SIZES[ctx]}/${matches[1]}`;
}