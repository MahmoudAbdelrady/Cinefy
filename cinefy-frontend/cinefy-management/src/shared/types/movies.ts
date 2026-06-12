interface MovieSearchResult {
  id: number;
  title: string;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
}

interface UpcomingMovie {
  id: number;
  title: string;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  announced: boolean;
  highlighted: boolean;
  hasCommittedShowtimes: boolean;
}

interface MovieSummary {
  id: number;
  title: string;
  genre?: string;
  contentRating?: string;
  releaseDate?: string;
  duration?: number;
  posterUrl?: string;
  backdropUrl?: string;
  highlighted: boolean;
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

export type { MovieSearchResult, UpcomingMovie, MovieSummary, MovieDetail };
