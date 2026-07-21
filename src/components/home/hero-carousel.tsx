"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Ticket } from "lucide-react";
import { formatDate } from "@/lib/constants";

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
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [paused, n, next, index]);

  if (!current) return null;

  return (
    <section
      className="relative h-[88vh] min-h-[560px] max-h-[920px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.slug}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Image
            src={current.backdropUrl ?? current.posterUrl}
            alt=""
            fill
            priority
            className="animate-hero-zoom object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(229,9,20,0.18),transparent_55%)] animate-spotlight" />
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 sm:px-6 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.slug + "-copy"}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/35">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Now showing
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent backdrop-blur">
                {current.ageRating}
              </span>
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                {current.genres.map((g) => g.genre.name).join(" · ")}
              </span>
            </div>

            <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl">
              {current.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
              <span>{current.durationMin} phút</span>
              <span className="text-border-light">|</span>
              <span>KC {formatDate(current.releaseDate)}</span>
              <span className="text-border-light">|</span>
              <span>{current.director}</span>
            </div>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 line-clamp-3">
              {current.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/movies/${current.slug}#showtimes`}
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/35 transition hover:bg-primary-hover hover:shadow-primary/45"
              >
                <Ticket className="h-4 w-4" />
                Đặt vé ngay
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href={`/movies/${current.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
              >
                <Play className="h-4 w-4 fill-current" />
                Chi tiết
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots + arrows */}
        {n > 1 && (
          <div className="mt-10 flex items-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur transition hover:border-primary hover:bg-primary/20"
              aria-label="Slide trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-8 bg-primary shadow-lg shadow-primary/40"
                      : "w-3 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur transition hover:border-primary hover:bg-primary/20"
              aria-label="Slide sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Poster thumbnails desktop */}
      {n > 1 && (
        <div className="absolute bottom-24 right-6 hidden gap-2 lg:flex xl:right-12">
          {slides.slice(0, 5).map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-24 w-16 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? "border-primary shadow-lg shadow-primary/30 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={s.posterUrl} alt={s.title} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
