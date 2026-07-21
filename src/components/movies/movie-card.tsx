"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Ticket } from "lucide-react";
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
  index?: number;
};

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.06, 0.36),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/15"
    >
      <Link href={`/movies/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

          <div className="absolute left-2 top-2 flex gap-1.5">
            <span className="rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-accent backdrop-blur">
              {movie.ageRating}
            </span>
          </div>

          {movie.status === "NOW_SHOWING" && (
            <div className="card-overlay absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/40">
                <Ticket className="h-4 w-4" />
                Đặt vé
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="line-clamp-1 font-display font-bold text-white drop-shadow-lg">
              {movie.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/65">
              {movie.genres.map((g) => g.genre.name).join(", ")}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          {movie.status === "NOW_SHOWING" ? (
            <Badge color="success">Đang chiếu</Badge>
          ) : movie.status === "COMING_SOON" ? (
            <Badge color="info">Sắp chiếu</Badge>
          ) : (
            <Badge>Ngừng chiếu</Badge>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3 w-3" />
          {movie.durationMin}p
        </span>
      </div>
    </motion.div>
  );
}
