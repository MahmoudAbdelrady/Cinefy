interface MovieSearchResult {
  id: number;
  title: string;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
}

interface UpcomingMovie {
  id: number;
  title: string;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  isAnnounced: boolean;
  hasCommittedShowtimes: boolean;
}

interface MovieDetail {
  id: number;
  title: string;
  synopsis?: string;
  genre?: string;
  contentRating?: string;
  releaseDate?: string;
  duration?: number;
  posterUrl?: string;
}

interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: string; // e.g. 'PG-13'
  releaseDate: string; // ISO date, e.g. '2026-03-30'
  duration: number; // in minutes
  posterUrl: string;
}

export type { Movie, MovieSearchResult, UpcomingMovie, MovieDetail };
