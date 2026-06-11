interface CreditMember {
  id: number;
  name: string;
  profileUrl: string;
}

interface MovieCredits {
  cast: CreditMember[];
  directors: CreditMember[];
}

interface MovieDetail {
  id: number;
  title: string;
  synopsis?: string;
  genre?: string;
  contentRating?: string;
  releaseDate?: string;
  duration?: number;
  posterUrl: string;
  backdropUrl: string;
  credits?: MovieCredits;
  trailerUrl?: string;
}

interface HighlightedMovie {
  bookingOpened: boolean;
  movieDetails: MovieDetail;
}

interface MovieSearchResult {
  id: number;
  title: string;
  genre?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
}

export type { CreditMember, MovieCredits, MovieDetail, HighlightedMovie, MovieSearchResult };
