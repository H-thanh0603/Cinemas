export type ScheduleMovie = {
  id: string;
  durationMin: number;
};

export type ScheduledMovie = {
  movieId: string;
  startsAt: Date;
  endsAt: Date;
};

export function buildRoomSchedule(
  day: Date,
  movies: ScheduleMovie[],
  options: {
    openingHour: number;
    closingHour: number;
    cleanupMinutes: number;
    rotation: number;
  }
): ScheduledMovie[] {
  if (movies.length === 0) return [];

  const cursor = new Date(day);
  cursor.setHours(options.openingHour, 0, 0, 0);
  const closing = new Date(day);
  closing.setHours(options.closingHour, 0, 0, 0);
  const schedule: ScheduledMovie[] = [];

  while (cursor < closing) {
    const movie = movies[(options.rotation + schedule.length) % movies.length];
    const endsAt = new Date(
      cursor.getTime() + (movie.durationMin + options.cleanupMinutes) * 60_000
    );
    if (endsAt > closing) break;
    schedule.push({
      movieId: movie.id,
      startsAt: new Date(cursor),
      endsAt,
    });
    cursor.setTime(endsAt.getTime());
  }

  return schedule;
}
