"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Ticket } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { PosterImage } from "@/components/ui/poster-image";

export type HeroSlide = {
  slug: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string | null;
  durationMin: number;
  ageRating: string;
  director: string;
  releaseDate: string | Date;
  genres: { genre: { name: string } }[];
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const current = slides[index];

  const next = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i + 1) % n);
  }, [n]);
  const prev = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i - 1 + n) % n);
  }, [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [paused, n, next, index]);

  if (!current) return null;

  return (
    <section
      className="relative h-[85vh] min-h-[540px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.slug}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <PosterImage
            src={current.backdropUrl ?? current.posterUrl}
            alt={current.title}
            fill
            priority
            quality={95}
            className="animate-hero-zoom"
            sizes="100vw"
          />
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 sm:px-6 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.slug + "-copy"}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Đang chiếu
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent backdrop-blur-sm">
                {current.ageRating}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
                {current.genres.map((g) => g.genre.name).join(" · ")}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl font-black leading-[1.08] tracking-tight drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl">
              {current.title}
            </h1>

            {/* Meta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
              <span>{current.durationMin} phút</span>
              <span className="text-white/20">|</span>
              <span>KC {formatDate(current.releaseDate)}</span>
              <span className="text-white/20">|</span>
              <span>{current.director}</span>
            </div>

            {/* Description */}
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 line-clamp-3">
              {current.description}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/movies/${current.slug}#showtimes`}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
              >
                <Ticket className="h-4 w-4" />
                Đặt vé ngay
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href={`/movies/${current.slug}`}
                className="inline-flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/5 px-8 py-4 text-sm font-bold text-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
              >
                <Play className="h-4 w-4 fill-current" />
                Chi tiết
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation dots + arrows */}
        {n > 1 && (
          <div className="mt-10 flex items-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:text-white"
              aria-label="Slide trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2.5">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === index
                      ? "w-9 bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/30"
                      : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:text-white"
              aria-label="Slide sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Poster thumbnails (desktop) */}
      {n > 1 && (
        <div className="absolute bottom-24 right-6 hidden gap-3 lg:flex xl:right-12">
          {slides.slice(0, 5).map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-24 w-16 overflow-hidden rounded-lg border-2 transition-all duration-400 ${
                i === index
                  ? "border-primary shadow-lg shadow-primary/25 scale-105"
                  : "border-transparent opacity-50 hover:opacity-80 hover:border-white/10"
              }`}
            >
              <PosterImage src={s.posterUrl} alt={s.title} fill sizes="64px" quality={90} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
