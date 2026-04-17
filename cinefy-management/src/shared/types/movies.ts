interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseYear: number;
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
