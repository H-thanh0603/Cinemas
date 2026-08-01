import { useMemo, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  Heart,
  Eye,
  Info,
} from "lucide-react";
import type { SeatDto } from "./types";
import { formatVnd, SEAT_TYPE_LABELS } from "@/lib/constants";
import { seatBasePrice } from "@/lib/booking";
import { seatSound } from "@/lib/seat-sound";

type SeatMapProps = {
  seats: SeatDto[];
  bookedSeatIds: Set<string>;
  selectedSeatIds: string[];
  onToggle: (seat: SeatDto) => void;
  basePrice?: number;
};

function calculateSightline(seat: SeatDto, rowsCount: number) {
  const rowIndex = Math.max(0, seat.row.charCodeAt(0) - 65);
  const progress = Math.min(1, Math.max(0, rowIndex / Math.max(1, rowsCount - 1)));
  
  const distance = (6.5 + progress * 14.5).toFixed(1);
  const coverage = Math.round(96 - progress * 24);
  
  let qualityBadge = "Tầm nhìn góc rộng toàn cảnh 🎬";
  if (progress >= 0.25 && progress <= 0.65) {
    qualityBadge = "Góc nhìn Sweet Spot VIP 🌟";
  } else if (progress < 0.25) {
    qualityBadge = "Góc nhìn cận cảnh sống động 🍿";
  }

  return { distance, coverage, qualityBadge };
}

export function SeatMap({
  seats,
  bookedSeatIds,
  selectedSeatIds,
  onToggle,
  basePrice = 90000,
}: SeatMapProps) {
  const seatMapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightSweetSpot, setHighlightSweetSpot] = useState(false);
  const [coupleMode, setCoupleMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hoveredSeat, setHoveredSeat] = useState<SeatDto | null>(null);
  const [hoveredSeatPos, setHoveredSeatPos] = useState<{ x: number; y: number } | null>(null);
  const [povSeat, setPovSeat] = useState<SeatDto | null>(null);
  const [showGoldenTicket, setShowGoldenTicket] = useState(false);

  function handleSeatMouseEnter(seat: SeatDto, e: React.MouseEvent<HTMLButtonElement>) {
    setHoveredSeat(seat);
    if (seatMapRef.current) {
      const parentRect = seatMapRef.current.getBoundingClientRect();
      const seatRect = e.currentTarget.getBoundingClientRect();
      setHoveredSeatPos({
        x: seatRect.left - parentRect.left + seatRect.width / 2,
        y: seatRect.top - parentRect.top + seatRect.height / 2,
      });
    }
  }

  function handleSeatMouseLeave() {
    setHoveredSeat(null);
    setHoveredSeatPos(null);
  }



  // Group seats by row
  const rows = useMemo(() => {
    const rMap = new Map<string, SeatDto[]>();
    for (const seat of seats) {
      if (!rMap.has(seat.row)) rMap.set(seat.row, []);
      rMap.get(seat.row)!.push(seat);
    }
    const sorted = [...rMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [, rowSeats] of sorted) {
      rowSeats.sort((a, b) => a.number - b.number);
    }
    return sorted;
  }, [seats]);

  // Identify central sweet spot rows and seats (middle rows, middle seats)
  const sweetSpotSeatIds = useMemo(() => {
    if (rows.length === 0) return new Set<string>();
    const sweetSet = new Set<string>();
    const midRowStartIndex = Math.floor(rows.length * 0.35);
    const midRowEndIndex = Math.ceil(rows.length * 0.75);

    rows.forEach(([_, rowSeats], index) => {
      if (index >= midRowStartIndex && index <= midRowEndIndex) {
        const midStart = Math.floor(rowSeats.length * 0.25);
        const midEnd = Math.ceil(rowSeats.length * 0.75);
        rowSeats.slice(midStart, midEnd).forEach((s) => sweetSet.add(s.id));
      }
    });
    return sweetSet;
  }, [rows]);

  // Seat stats
  const totalSeatsCount = seats.length;
  const bookedCount = bookedSeatIds.size;
  const selectedCount = selectedSeatIds.length;
  const availableCount = totalSeatsCount - bookedCount;

  function handleZoom(delta: number) {
    setZoomLevel((prev) => Math.min(Math.max(0.8, prev + delta), 1.3));
  }

  function resetZoom() {
    setZoomLevel(1);
  }

  function toggleSound() {
    const nextState = seatSound.toggleSound();
    setSoundEnabled(nextState);
  }

  const [animatingSeatId, setAnimatingSeatId] = useState<string | null>(null);

  function handleSeatClick(seat: SeatDto, state: string) {
    if (state !== "available" && state !== "selected") return;

    setAnimatingSeatId(seat.id);
    setTimeout(() => setAnimatingSeatId(null), 450);

    if (state === "selected") {
      seatSound.playDeselectSound();
    } else {
      seatSound.playSelectSound();
      // Trigger Golden Ticket surprise on first selection
      if (selectedSeatIds.length === 0 && !showGoldenTicket) {
        setShowGoldenTicket(true);
      }
    }
    onToggle(seat);
  }

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      {/* 🌟 Golden Ticket Surprise Banner */}
      {showGoldenTicket && (
        <div className="mb-6 w-full flex items-center justify-between rounded-2xl border border-amber-400/60 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 p-4 shadow-xl shadow-amber-500/10 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black text-xl font-bold shadow-md">
              👑
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-amber-300">BẠN ĐÃ MỞ KHÓA VÉ VÀNG MAY MẮN!</h4>
              <p className="text-xs text-muted">Nhận ngay ưu đãi miễn phí Nâng cấp size Bắp Rang khi mua kèm Combo dịch vụ.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGoldenTicket(false)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg border border-amber-400/40 hover:bg-amber-400/20 transition"
          >
            Đóng ✕
          </button>
        </div>
      )}

      {/* Interactive Controls & Stats Toolbar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 w-full px-2">
        {/* Seat statistics counter */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-2 rounded-full border border-border-light bg-surface-raised px-4 py-1.5 text-muted shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Trống: <strong className="text-foreground">{availableCount}</strong>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-primary shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Đã chọn: <strong>{selectedCount}</strong>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-accent shadow-sm">
            <Star className="h-3.5 w-3.5 fill-accent" />
            Sweet Spot VIP
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 bg-surface-raised/90 backdrop-blur rounded-2xl border border-border-light p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => setHighlightSweetSpot(!highlightSweetSpot)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
              highlightSweetSpot
                ? "bg-accent text-black shadow-lg shadow-accent/30 font-bold"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
            title="Bật/Tắt gợi ý vị trí xem phim đỉnh nhất"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Vị trí VIP đẹp nhất</span>
          </button>

          <button
            type="button"
            onClick={() => setCoupleMode(!coupleMode)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
              coupleMode
                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30 font-bold"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
            title="Bật chế độ chọn ghế Hẹn hò Couple"
          >
            <Heart className="h-4 w-4 fill-current" />
            <span className="hidden sm:inline">Chế độ Hẹn hò</span>
          </button>


          <div className="h-5 w-px bg-border mx-0.5" />

          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            disabled={zoomLevel <= 0.8}
            className="p-2 text-muted hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-surface-hover"
            title="Thu nhỏ sơ đồ"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-bold text-muted w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            disabled={zoomLevel >= 1.4}
            className="p-2 text-muted hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-surface-hover"
            title="Phóng to sơ đồ"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {zoomLevel !== 1 && (
            <button
              type="button"
              onClick={resetZoom}
              className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover"
              title="Khôi phục kích thước ban đầu"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <div className="h-5 w-px bg-border mx-0.5" />

          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-lg transition ${
              soundEnabled
                ? "text-accent hover:bg-accent/10"
                : "text-muted-dark hover:bg-surface-hover"
            }`}
            title={soundEnabled ? "Tắt âm thanh chọn ghế" : "Bật âm thanh chọn ghế"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Seat Map Area */}
      <div className="w-full overflow-x-auto py-6 px-1 flex justify-center">
        <div
          ref={seatMapRef}
          className="transition-transform duration-300 ease-out origin-top flex flex-col items-center min-w-max w-full relative"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* ⚡ Dynamic 2D Laser Sightline Projection Beam originating directly from hovered seat (x, y) */}
          {hoveredSeat && hoveredSeatPos && (
            <div className="absolute inset-0 pointer-events-none z-30 transition-all duration-150">
              <svg className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="dynamicLaserGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#e8637a" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#f5c518" stopOpacity="1" />
                    <stop offset="100%" stopColor="#e8637a" stopOpacity="0.85" />
                  </linearGradient>
                  <filter id="dynamicLaserGlow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Laser Cone to Screen Edges */}
                <polygon
                  points={`${hoveredSeatPos.x},${hoveredSeatPos.y} ${seatMapRef.current ? seatMapRef.current.clientWidth * 0.05 : 50},35 ${seatMapRef.current ? seatMapRef.current.clientWidth * 0.95 : 950},35`}
                  fill="url(#dynamicLaserGrad)"
                  fillOpacity="0.08"
                />

                {/* Left Dashed Ray */}
                <line
                  x1={hoveredSeatPos.x}
                  y1={hoveredSeatPos.y}
                  x2={seatMapRef.current ? seatMapRef.current.clientWidth * 0.05 : 50}
                  y2="35"
                  stroke="url(#dynamicLaserGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  className="animate-laser-dash"
                  filter="url(#dynamicLaserGlow)"
                />

                {/* Center Dashed Ray */}
                <line
                  x1={hoveredSeatPos.x}
                  y1={hoveredSeatPos.y}
                  x2={seatMapRef.current ? seatMapRef.current.clientWidth * 0.5 : 500}
                  y2="35"
                  stroke="url(#dynamicLaserGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                  className="animate-laser-dash"
                  filter="url(#dynamicLaserGlow)"
                />

                {/* Right Dashed Ray */}
                <line
                  x1={hoveredSeatPos.x}
                  y1={hoveredSeatPos.y}
                  x2={seatMapRef.current ? seatMapRef.current.clientWidth * 0.95 : 950}
                  y2="35"
                  stroke="url(#dynamicLaserGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  className="animate-laser-dash"
                  filter="url(#dynamicLaserGlow)"
                />

                {/* Target Pulsing Point on Hovered Seat */}
                <circle
                  cx={hoveredSeatPos.x}
                  cy={hoveredSeatPos.y}
                  r="8"
                  fill="none"
                  stroke="#f5c518"
                  strokeWidth="2"
                  className="animate-ping"
                />
              </svg>

              {/* 🎈 Cursor-Following Mini HUD Tooltip attached directly near seat (x, y) */}
              {(() => {
                const metrics = calculateSightline(hoveredSeat, rows.length);
                const price = seatBasePrice(basePrice, hoveredSeat.type);
                return (
                  <div
                    className="absolute z-40 pointer-events-none transition-all duration-100 ease-out"
                    style={{
                      left: `${hoveredSeatPos.x}px`,
                      top: `${Math.max(10, hoveredSeatPos.y - 85)}px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="rounded-2xl border border-amber-400/70 bg-black/95 px-4 py-2.5 text-xs shadow-2xl backdrop-blur flex flex-col gap-1.5 min-w-[220px]">
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
                        <span className="font-black text-sm text-foreground">
                          Ghế {hoveredSeat.row}{hoveredSeat.number} <span className="text-[11px] text-muted font-normal">({SEAT_TYPE_LABELS[hoveredSeat.type]})</span>
                        </span>
                        <strong className="text-accent text-sm font-mono">{formatVnd(price)}</strong>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="font-semibold text-foreground">📏 {metrics.distance}m</span>
                        <span className="text-emerald-400 font-extrabold">📐 {metrics.coverage}% FOV</span>
                      </div>

                      {/* Visual Sightline Gauge Progress Bar */}
                      <div className="w-full bg-surface-raised h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 via-amber-400 to-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${metrics.coverage}%` }}
                        />
                      </div>

                      <div className="text-[10px] font-bold text-accent tracking-tight">
                        {metrics.qualityBadge}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Cinema Screen Presentation */}
          <div ref={screenRef} className="cinema-screen-container relative mb-14 w-full max-w-4xl text-center">
            {/* Ambient Light Cone from Screen */}
            <div className="cinema-light-beam absolute -top-6 left-1/2 -translate-x-1/2 w-[120%] h-60 pointer-events-none" />

            {/* Curved Cinema Screen Bar */}
            <div className="cinema-screen-curve relative h-5 w-full flex items-center justify-center">
              <span className="text-xs font-black uppercase tracking-[0.5em] text-black/90 drop-shadow">
                MÀN HÌNH CHÍNH (SCREEN)
              </span>
            </div>

            {/* Screen Technology Badges */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs font-bold tracking-widest text-muted">
              <span className="rounded-md border border-white/10 bg-black/50 px-3 py-1 backdrop-blur shadow-sm">
                IMAX 4K LASER
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="rounded-md border border-white/10 bg-black/50 px-3 py-1 backdrop-blur shadow-sm">
                DOLBY ATMOS 7.1
              </span>
            </div>
          </div>

          {/* Seating Grid Rows */}
          <div className="space-y-4 sm:space-y-5 px-2">
            {rows.map(([rowLabel, rowSeats]) => (
              <div key={rowLabel} className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
                {/* Left Row Indicator */}
                <span className="w-7 text-center text-sm font-black text-muted-dark hover:text-foreground">
                  {rowLabel}
                </span>

                {/* Seats list */}
                <div className="flex gap-2.5 sm:gap-3 md:gap-3.5">
                  {rowSeats.map((seat) => {
                    const isBooked = bookedSeatIds.has(seat.id);
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isDisabled = !seat.isActive;
                    const isSweetSpot = sweetSpotSeatIds.has(seat.id);

                    let state = "available";
                    if (isDisabled) state = "disabled";
                    else if (isBooked) state = "booked";
                    else if (isSelected) state = "selected";

                    const clickable = state === "available" || state === "selected";
                    const isCouple = seat.type === "COUPLE";
                    const isVip = seat.type === "VIP";

                    // Dynamic CSS classes for seats - Larger seats!
                    let styleClass =
                      "seat-base text-xs sm:text-sm font-black h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 transition-all duration-200";

                    if (isCouple) {
                      styleClass += " w-22 sm:w-26 md:w-28 rounded-2xl";
                    }

                    if (state === "selected") {
                      styleClass +=
                        " bg-gradient-to-t from-primary-dark via-primary to-primary-hover text-white shadow-lg shadow-primary/60 scale-110 border-2 border-white z-10 animate-pulse-glow";
                    } else if (state === "booked") {
                      styleClass +=
                        " cursor-not-allowed bg-surface/50 border border-border/40 text-muted-dark opacity-40 line-through";
                    } else if (state === "disabled") {
                      styleClass +=
                        " cursor-not-allowed border border-dashed border-border/50 text-muted-dark opacity-30";
                    } else {
                      // Available state styles by category
                      if (isVip) {
                        styleClass +=
                          " bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-400/60 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 hover:scale-105 hover:shadow-md hover:shadow-amber-500/20";
                      } else if (isCouple) {
                        styleClass +=
                          " bg-gradient-to-b from-pink-500/20 to-rose-600/10 border border-pink-400/60 text-pink-300 hover:bg-pink-500/30 hover:border-pink-400 hover:scale-105 hover:shadow-md hover:shadow-pink-500/20";
                      } else {
                        styleClass +=
                          " bg-surface-raised border border-border-light text-muted hover:border-primary/60 hover:bg-surface-hover hover:text-foreground hover:scale-105";
                      }

                      // Sweet Spot Spotlight glow
                      if (highlightSweetSpot && isSweetSpot) {
                        styleClass += " seat-sweet-spot border-accent ring-2 ring-accent/40";
                      }
                    }

                    if (animatingSeatId === seat.id) {
                      styleClass += " animate-seat-bump z-30 relative";
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!clickable}
                        onClick={() => handleSeatClick(seat, state)}
                        onMouseEnter={(e) => handleSeatMouseEnter(seat, e)}
                        onMouseLeave={handleSeatMouseLeave}
                        className={styleClass}
                        aria-label={`Ghế ${rowLabel}${seat.number} (${seat.type})`}
                      >
                        {animatingSeatId === seat.id && (
                          <span className="absolute inset-0 rounded-2xl border-2 border-accent/90 bg-accent/40 animate-seat-ripple pointer-events-none" />
                        )}
                        <span className="flex items-center justify-center gap-0.5">
                          {isCouple && <Heart className="h-3 w-3 fill-current opacity-80 mr-0.5" />}
                          {isVip && !isSelected && (
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 absolute top-1 right-1 opacity-75" />
                          )}
                          {rowLabel}
                          {seat.number}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Row Indicator */}
                <span className="w-6 text-center text-xs font-black text-muted-dark hover:text-foreground">
                  {rowLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Seat Legend Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-surface/80 p-4 text-xs backdrop-blur text-muted">
            <span className="flex items-center gap-2">
              <span className="seat-base h-6 w-6 border border-border-light bg-surface-raised text-[10px]" />
              Ghế Thường
            </span>
            <span className="flex items-center gap-2">
              <span className="seat-base h-6 w-6 border border-amber-400/60 bg-amber-500/20 text-amber-300 text-[10px]" />
              Ghế VIP
            </span>
            <span className="flex items-center gap-2">
              <span className="seat-base h-6 w-11 border border-pink-400/60 bg-pink-500/20 text-pink-300 text-[10px]" />
              Ghế Đôi Couple
            </span>
            <span className="flex items-center gap-2">
              <span className="seat-base h-6 w-6 bg-primary text-white text-[10px] shadow-sm shadow-primary" />
              Đang chọn
            </span>
            <span className="flex items-center gap-2">
              <span className="seat-base h-6 w-6 bg-surface/50 border border-border/40 text-muted-dark opacity-50 line-through text-[10px]" />
              Đã bán
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Tooltip / Detail Card */}
      {hoveredSeat && (() => {
        const metrics = calculateSightline(hoveredSeat, rows.length);
        return (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-surface-raised/90 p-4 shadow-2xl animate-fade-in-up text-xs w-full max-w-3xl backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary font-black text-sm">
                {hoveredSeat.row}{hoveredSeat.number}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground text-sm">
                    Ghế {hoveredSeat.row}{hoveredSeat.number} ({SEAT_TYPE_LABELS[hoveredSeat.type]})
                  </span>
                  <strong className="text-accent text-sm">
                    {formatVnd(seatBasePrice(basePrice, hoveredSeat.type))}
                  </strong>
                </div>
                
                {/* Realtime Distance & Coverage Metrics */}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-muted">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    📏 Khoảng cách: <strong className="text-accent">{metrics.distance}m</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    📐 Độ phủ màn hình: <strong className="text-emerald-400">{metrics.coverage}%</strong>
                  </span>
                  <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-bold text-accent">
                    {metrics.qualityBadge}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPovSeat(hoveredSeat)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-extrabold text-primary hover:bg-primary hover:text-white transition shadow-md"
            >
              <Eye className="h-4 w-4" />
              Xem góc nhìn 3D (POV)
            </button>
          </div>
        );
      })()}

      {/* 👁️ POV Simulated Screen View Modal */}
      {povSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">
                  Góc nhìn thực tế (POV) — Ghế {povSeat.row}{povSeat.number}
                </h3>
                <p className="text-xs text-muted">
                  Mô phỏng tầm mắt và độ phủ màn hình chiếu 4K Laser từ vị trí ghế {povSeat.row}{povSeat.number} ({SEAT_TYPE_LABELS[povSeat.type]})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPovSeat(null)}
                className="h-8 w-8 rounded-full border border-border text-muted hover:text-foreground hover:bg-surface-raised font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="my-6 relative flex flex-col items-center justify-center rounded-2xl bg-black p-8 overflow-hidden min-h-[220px] border border-border-light">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,99,122,0.12),transparent_70%)]" />
              
              {/* Simulated Screen Arc */}
              <div
                className="cinema-screen-curve w-full flex items-center justify-center transition-all duration-500"
                style={{
                  height: povSeat.row <= "C" ? "120px" : povSeat.row <= "G" ? "95px" : "75px",
                  maxWidth: povSeat.row <= "C" ? "100%" : povSeat.row <= "G" ? "85%" : "70%",
                }}
              >
                <span className="text-xs font-black uppercase tracking-[0.4em] text-black">
                  TẦM MẮT TỪ GHẾ {povSeat.row}{povSeat.number}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-6 text-xs text-muted">
                <span>Khoảng cách: <strong>{povSeat.row <= "C" ? "8.5m (Cận cảnh)" : povSeat.row <= "G" ? "14.2m (Hoàn hảo)" : "21.0m (Toàn cảnh)"}</strong></span>
                <span>Tỷ lệ phủ mắt: <strong>{povSeat.row <= "C" ? "98%" : povSeat.row <= "G" ? "88%" : "72%"}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPovSeat(null)}
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition"
              >
                Đồng ý chọn ghế này →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

