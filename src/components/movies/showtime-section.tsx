"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Building2, ChevronDown, MapPin, Clock } from "lucide-react";
import { formatTime, formatVnd } from "@/lib/constants";

type ShowtimeItem = {
  id: string;
  startsAt: string | Date;
  format: string;
  basePrice: number;
  cinemaId: string;
  cinema: { name: string; city?: string };
  room: { name: string };
};

type Props = {
  showtimes: ShowtimeItem[];
  status: string;
  releaseDate: string | Date;
};

function formatDateKey(d: string | Date) {
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  let label = `${dayName}, ${day}/${month}`;
  if (dateOnly.getTime() === today.getTime()) label = `Hôm nay · ${day}/${month}`;
  else if (dateOnly.getTime() === tomorrow.getTime()) label = `Ngày mai · ${day}/${month}`;

  return {
    key: `${date.getFullYear()}-${month}-${day}`,
    label,
    fullDate: date,
  };
}

export function ShowtimeSection({ showtimes, status, releaseDate }: Props) {
  // Build date list
  const dateList = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; label: string; fullDate: Date }[] = [];
    for (const st of showtimes) {
      const d = formatDateKey(st.startsAt);
      if (!seen.has(d.key)) {
        seen.add(d.key);
        result.push(d);
      }
    }
    return result;
  }, [showtimes]);

  const [selectedDate, setSelectedDate] = useState(dateList[0]?.key ?? "");
  const [selectedCinema, setSelectedCinema] = useState<string>("all");
  const [cinemaDropdownOpen, setCinemaDropdownOpen] = useState(false);

  // Cinemas for selected date
  const cinemasForDate = useMemo(() => {
    const cinemaMap = new Map<string, string>();
    for (const st of showtimes) {
      const d = formatDateKey(st.startsAt);
      if (d.key === selectedDate) {
        cinemaMap.set(st.cinemaId, st.cinema.name);
      }
    }
    return [...cinemaMap.entries()].map(([id, name]) => ({ id, name }));
  }, [showtimes, selectedDate]);

  // Filtered showtimes
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((st) => {
      const d = formatDateKey(st.startsAt);
      if (d.key !== selectedDate) return false;
      if (selectedCinema !== "all" && st.cinemaId !== selectedCinema) return false;
      return true;
    });
  }, [showtimes, selectedDate, selectedCinema]);

  // Group by cinema
  const grouped = useMemo(() => {
    const map = new Map<string, { cinemaName: string; items: ShowtimeItem[] }>();
    for (const st of filteredShowtimes) {
      if (!map.has(st.cinemaId)) {
        map.set(st.cinemaId, { cinemaName: st.cinema.name, items: [] });
      }
      map.get(st.cinemaId)!.items.push(st);
    }
    return [...map.values()];
  }, [filteredShowtimes]);

  if (showtimes.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border/50 bg-surface/50 px-6 py-14 text-center">
        <span className="text-5xl">📅</span>
        <p className="mt-4 font-medium">
          {status === "COMING_SOON"
            ? "Phim chưa mở bán vé"
            : "Hiện chưa có suất chiếu nào"}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {status === "COMING_SOON"
            ? `Phim dự kiến khởi chiếu ngày ${new Date(releaseDate).toLocaleDateString("vi-VN")}. Hãy quay lại sau!`
            : "Vui lòng quay lại sau hoặc chọn phim khác."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Date Selector (horizontal chips) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Calendar className="h-4 w-4 shrink-0 text-primary-light" />
        <div className="flex gap-2">
          {dateList.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                setSelectedDate(d.key);
                setSelectedCinema("all");
              }}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-300 ${
                selectedDate === d.key
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20"
                  : "border border-border/50 bg-surface text-muted hover:border-primary/30 hover:bg-primary/8 hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cinema Filter ── */}
      {cinemasForDate.length > 1 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setCinemaDropdownOpen(!cinemaDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-all duration-300 hover:border-primary/30 hover:text-foreground"
          >
            <Building2 className="h-4 w-4 text-primary-light" />
            {selectedCinema === "all"
              ? `Tất cả rạp (${cinemasForDate.length})`
              : cinemasForDate.find((c) => c.id === selectedCinema)?.name}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${cinemaDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {cinemaDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setCinemaDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border/50 bg-surface-raised p-1.5 shadow-2xl shadow-black/40 animate-fade-in-up">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCinema("all");
                    setCinemaDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                    selectedCinema === "all"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Tất cả rạp
                </button>
                {cinemasForDate.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCinema(c.id);
                      setCinemaDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                      selectedCinema === c.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Showtime Grid ── */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/40 bg-surface/30 px-6 py-10 text-center">
          <p className="text-sm text-muted">Không có suất chiếu cho lựa chọn này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div
              key={group.cinemaName}
              className="rounded-2xl border border-border/40 bg-surface/60 p-5 transition-all duration-300 hover:border-border/60"
            >
              <h4 className="flex items-center gap-2 font-semibold text-sm">
                <Building2 className="h-4 w-4 text-primary-light" />
                {group.cinemaName}
              </h4>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {group.items.map((st) => (
                  <Link
                    key={st.id}
                    href={`/booking/${st.id}`}
                    className="group rounded-xl border border-border/50 bg-surface-raised/60 px-5 py-3 text-center transition-all duration-300 hover:border-primary/40 hover:bg-primary/8 hover:shadow-md hover:shadow-primary/5"
                  >
                    <span className="block text-sm font-bold transition-colors duration-300 group-hover:text-primary">
                      {formatTime(st.startsAt)}
                    </span>
                    <span className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted">
                      <Clock className="h-3 w-3" />
                      {st.format} · {st.room.name} · {formatVnd(st.basePrice)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
