interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseYear: number;
  duration: number; // in minutes
  posterUrl: string;
}

export type { Movie };
