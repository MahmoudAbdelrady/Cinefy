import type { HallRef } from './halls';
import type { MovieDetail } from './movies';

const SHOWTIME_STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  RUNNING: 'Running',
  FINISHED: 'Finished',
  CANCELLED: 'Cancelled',
} as const;

type ShowtimeStatus = keyof typeof SHOWTIME_STATUS_LABELS;

interface ShowtimeDraft {
  movieId: number | null;
  dateTime: string; // ISO 8601 LocalDateTime, e.g. '2026-04-25T19:30:00'
  hallId: string;
  is3D: boolean;
  specialNotes: string;
}

interface Showtime {
  id: string;
  movie: MovieDetail;
  hall: HallRef;
  startDateTime: string;
  status: ShowtimeStatus;
}

interface PublishShowtimesInput {
  showtimeId?: string;
  movieId?: number;
  date?: string; // ISO 8601 LocalDate, e.g. '2026-04-25'
}

interface MovieWithShowtimes {
  totalShowtimes: number;
  totalDraftShowtimes: number;
  movieDetails: MovieDetail;
}

interface ShowtimesStatistics {
  totalMovies: number;
  totalShowtimes: number;
  todayShowtimes: number;
}

interface MovieShowtimeListItem {
  id: string;
  time: string; // e.g. '19:30'
  hall: HallRef;
  status: ShowtimeStatus;
  specialNotes: string;
  is3D: boolean;
  reservedSeats: number;
  totalSeats: number;
}

interface MovieShowtimeDatesResponse {
  numberOfDrafts: number;
  dates: string[];
}

interface MovieShowtimesResponse {
  numberOfDrafts: number;
  showtimes: MovieShowtimeListItem[];
}

interface EditableShowtime {
  id: string;
  date: Date;
  time: string;
  hall: HallRef;
  specialNotes: string;
}

export { SHOWTIME_STATUS_LABELS };
export type {
  ShowtimeStatus,
  ShowtimeDraft,
  Showtime,
  PublishShowtimesInput,
  MovieWithShowtimes,
  ShowtimesStatistics,
  MovieShowtimeListItem,
  MovieShowtimeDatesResponse,
  MovieShowtimesResponse,
  EditableShowtime,
};
