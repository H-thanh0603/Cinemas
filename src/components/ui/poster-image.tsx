"use client";

import { useState } from "react";
import Image from "next/image";
import { Film } from "lucide-react";

type PosterImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  quality?: number;
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill";
};

export function PosterImage({
  src,
  alt,
  fill = false,
  width,
  height,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
  quality = 95,
  objectFit = "cover",
}: PosterImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check valid src URL
  const isValidSrc = Boolean(src && typeof src === "string" && src.trim().length > 0 && !hasError);

  if (!isValidSrc) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-surface-raised via-surface to-background p-4 text-center select-none ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,95,106,0.12),transparent_70%)]" />
        <Film className="h-10 w-10 text-muted-dark opacity-60 transition-transform duration-300 group-hover:scale-110" />
        <span className="mt-2 line-clamp-2 text-xs font-semibold text-muted">
          {alt || "Phim CineStar"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-surface-raised ${fill ? "h-full w-full" : ""} ${
        !isLoaded ? "animate-pulse" : ""
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={quality}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-all duration-500 ease-out ${
          objectFit === "cover" ? "object-cover" : "object-contain"
        } ${
          isLoaded
            ? "scale-100 opacity-100 blur-0 contrast-[1.03] saturate-[1.05]"
            : "scale-105 opacity-0 blur-sm"
        } ${className}`}
      />
    </div>
  );
}
