import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";

type MovieCardProps = {
  movie: {
    slug: string;
    title: string;
    posterUrl: string;
    durationMin: number;
    ageRating: string;
    status: string;
    genres: { genre: { name: string } }[];
  };
};

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
      <Link href={`/movies/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute left-2 top-2 flex gap-1.5">
            <span className="rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-accent backdrop-blur">
              {movie.ageRating}
            </span>
          </div>

          {/* Hover overlay with quick book */}
          {movie.status === "NOW_SHOWING" && (
            <div className="card-overlay absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <span className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30">
                🎫 Đặt vé
              </span>
            </div>
          )}

          {/* Bottom info on poster */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="line-clamp-1 font-bold text-white drop-shadow-lg">
              {movie.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/70">
              {movie.genres.map((g) => g.genre.name).join(", ")}
            </p>
          </div>
        </div>
      </Link>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {movie.status === "NOW_SHOWING" ? (
            <Badge color="success">Đang chiếu</Badge>
          ) : movie.status === "COMING_SOON" ? (
            <Badge color="info">Sắp chiếu</Badge>
          ) : (
            <Badge>Ngừng chiếu</Badge>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted">
          <span>⏱</span> {movie.durationMin}p
        </span>
      </div>
    </div>
  );
}
