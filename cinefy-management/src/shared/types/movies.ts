interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseDate: string; // ISO date, e.g. '2026-03-30'
  duration: number; // in minutes
  posterUrl: string;
}

interface ShowtimeDraft {
  movieId: number;
  date: Date;
  time: string;
  hallId: string;
  specialNotes: string;
}

interface ShowtimeSummary {
  id: string;
  movie: Movie;
  totalShowtimes: number;
  totalDraftShowtimes: number;
}

interface MovieShowtimes {
  dates: string[]; // e.g. ['2026-03-30', '2026-03-31']
  totalDraftShowtimes: number;
}

import type { HallRef } from './halls';

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
  Movie,
  ShowtimeDraft,
  ShowtimeSummary,
  MovieShowtimes,
  MovieShowtimeDetail,
  EditableShowtime,
};
