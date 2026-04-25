import type { HallRef } from './halls';
import type { Movie, MovieDetail } from './movies';

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
  status: 'Published' | 'Draft';
}

interface PublishShowtimesInput {
  showtimeId?: string;
  movieId?: number;
  date?: string; // ISO 8601 LocalDate, e.g. '2026-04-25'
}

interface ShowtimeSummary {
  id: string;
  movie: Movie;
  totalShowtimes: number;
  totalDraftShowtimes: number;
}

interface MovieShowtimes {
  dates: string[];
  totalDraftShowtimes: number;
}

interface MovieShowtimeDetail {
  id: string;
  hall: HallRef;
  status: 'Published' | 'Draft';
  time: string; // e.g. '19:30'
  specialNotes: string;
  occupiedSeats: number;
  totalSeats: number;
}

interface EditableShowtime {
  id: string;
  date: Date;
  time: string;
  hall: HallRef;
  specialNotes: string;
}

export type {
  ShowtimeDraft,
  Showtime,
  PublishShowtimesInput,
  ShowtimeSummary,
  MovieShowtimes,
  MovieShowtimeDetail,
  EditableShowtime,
};
