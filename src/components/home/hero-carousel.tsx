"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Ticket } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { getTmdbImageUrl } from "@/lib/tmdb-image";
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

const SLIDE_MS = 7000;

/** Thanh progress autoplay — remount mỗi slide (key=index) nên state tự reset. */
function SlideProgress({ paused, onDone }: { paused: boolean; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / SLIDE_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduce, onDone]);

  return (
    <motion.span
      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
      style={{ width: `${progress * 100}%` }}
    />
  );
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = slides.length;
  const current = slides[index];
  // Parallax theo chuột (nhẹ, desktop)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i + 1) % n);
  }, [n]);
  const prev = useCallback(() => {
    if (n <= 1) return;
    setIndex((i) => (i - 1 + n) % n);
  }, [n]);

  // Autoplay: chỉ set interval; progress tự chạy trong SlideProgress (remount theo key)
  useEffect(() => {
    if (paused || n <= 1 || reduce) return;
    const timer = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, n, next, reduce]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduce) return;
    const rect = parallaxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  }, [reduce]);

  if (!current) return null;

  const px = (mouse?.x ?? 0) * 14;
  const py = (mouse?.y ?? 0) * 10;

  return (
    <section
      ref={parallaxRef}
      className="relative h-[85vh] min-h-[540px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setMouse(null);
      }}
      onMouseMove={onMouseMove}
    >
      {/* Background Image (parallax nhẹ) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.slug}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute inset-[-2.5%]"
            animate={mouse ? { x: px, y: py } : { x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          >
            <PosterImage
              src={getTmdbImageUrl(current.backdropUrl ?? current.posterUrl, "hero")}
              alt={current.title}
              fill
              priority
              quality={95}
              className="animate-hero-zoom"
              sizes="100vw"
            />
          </motion.div>
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
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-on-primary shadow-lg shadow-primary/30">
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

            {/* Title (wave: từng chữ bay lên) */}
            <h1 className="font-display text-4xl font-black leading-[1.08] tracking-tight drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              {current.title.split(" ").map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-1 align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%" }}
                    animate={reduce ? {} : { y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.12 + wi * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {word}
                  </motion.span>
                  {wi < current.title.split(" ").length - 1 ? "\u00A0" : ""}
                </span>
              ))}
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
                className="btn-sheen group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-sm font-bold text-on-primary shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
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

        {/* Navigation dots + arrows + progress */}
        {n > 1 && (
          <div className="mt-10 flex items-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:text-on-primary"
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
                  className={`group relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
                    i === index
                      ? "w-12 bg-white/15"
                      : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                >
                  {i === index && !paused && (
                    <SlideProgress paused={paused} onDone={() => {}} key={`${current.slug}-${index}`} />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:text-on-primary"
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
              <PosterImage
                src={getTmdbImageUrl(s.posterUrl, "thumbnail")}
                alt={s.title}
                fill
                sizes="64px"
                quality={90}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
