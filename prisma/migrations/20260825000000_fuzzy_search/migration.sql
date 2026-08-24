-- Fuzzy movie search: pg_trgm similarity on Movie.title
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Movie_title_trgm_idx" ON "Movie" USING gin ("title" gin_trgm_ops);
