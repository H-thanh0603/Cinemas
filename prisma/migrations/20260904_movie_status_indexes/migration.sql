-- Homepage sorts: WHERE status ORDER BY popularity DESC / releaseDate ASC
CREATE INDEX "Movie_status_popularity_idx" ON "Movie"("status", "popularity");
CREATE INDEX "Movie_status_releaseDate_idx" ON "Movie"("status", "releaseDate");
