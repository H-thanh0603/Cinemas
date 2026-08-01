"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Ticket } from "lucide-react";
import { Badge } from "@/components/ui";
import { PosterImage } from "@/components/ui/poster-image";

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
  index?: number;
};

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.06, 0.36),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface transition-all duration-400 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/8"
    >
      <Link href={`/movies/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden">
          <PosterImage
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            quality={95}
            className="transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Age rating badge */}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-sm">
              {movie.ageRating}
            </span>
          </div>

          {/* Hover overlay with CTA */}
          {movie.status === "NOW_SHOWING" && (
            <div className="card-overlay absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[3px]">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/30">
                <Ticket className="h-4 w-4" />
                Đặt vé
              </span>
            </div>
          )}

          {/* Bottom info */}
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="line-clamp-1 font-display font-bold text-white drop-shadow-lg">
              {movie.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
              {movie.genres.map((g) => g.genre.name).join(", ")}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-3.5 py-3">
        <div>
          {movie.status === "NOW_SHOWING" ? (
            <Badge color="success">Đang chiếu</Badge>
          ) : movie.status === "COMING_SOON" ? (
            <Badge color="info">Sắp chiếu</Badge>
          ) : (
            <Badge>Ngừng chiếu</Badge>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Clock className="h-3 w-3" />
          {movie.durationMin}p
        </span>
      </div>
    </motion.div>
  );
}
