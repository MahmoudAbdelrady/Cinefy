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

export type { Movie, ShowtimeDraft };
