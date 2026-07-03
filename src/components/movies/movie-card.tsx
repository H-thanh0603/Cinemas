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
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-border-light hover:shadow-xl hover:shadow-primary/5">
      <Link href={`/movies/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-accent backdrop-blur">
            {movie.ageRating}
          </span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
            {movie.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted">
            {movie.genres.map((g) => g.genre.name).join(", ")} · {movie.durationMin} phút
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-4 pb-4">
        {movie.status === "NOW_SHOWING" ? (
          <Badge color="success">Đang chiếu</Badge>
        ) : movie.status === "COMING_SOON" ? (
          <Badge color="info">Sắp chiếu</Badge>
        ) : (
          <Badge>Ngừng chiếu</Badge>
        )}
        {movie.status === "NOW_SHOWING" && (
          <Link
            href={`/movies/${movie.slug}#showtimes`}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Đặt vé
          </Link>
        )}
      </div>
    </div>
  );
}
