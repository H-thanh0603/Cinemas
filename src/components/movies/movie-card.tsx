"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Ticket, CalendarClock } from "lucide-react";
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
    releaseDate?: string | Date | null;
    genres: { genre: { name: string } }[];
  };
  index?: number;
};

function useReleaseCountdown(releaseDate?: string | Date | null) {
  const [now] = useState(() => Date.now());
  if (!releaseDate) return null;
  const target = new Date(releaseDate).getTime();
  const diff = target - now;
  if (diff <= 0) return null;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isComingSoon = movie.status === "COMING_SOON";
  const daysLeft = useReleaseCountdown(movie.releaseDate);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.06, 0.36),
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={
        reduce
          ? undefined
          : { transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }
      }
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface transition-[border-color,box-shadow] duration-400 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/8"
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

          {/* Shine sweep khi hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

          {/* Age rating badge */}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-sm">
              {movie.ageRating}
            </span>
          </div>

          {/* Countdown sắp chiếu */}
          {isComingSoon && daysLeft && (
            <div className="absolute right-2.5 top-2.5">
              <span className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-accent-hover backdrop-blur-sm">
                <CalendarClock className="h-3 w-3" />
                {daysLeft} ngày
              </span>
            </div>
          )}

          {/* Hover overlay with CTA */}
          {!isComingSoon && (
            <div className="card-overlay absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[3px]">
              <span className="btn-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-on-primary shadow-xl shadow-primary/30">
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
            <Badge color="success" dot>Đang chiếu</Badge>
          ) : movie.status === "COMING_SOON" ? (
            <Badge color="info" dot>Sắp chiếu</Badge>
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
