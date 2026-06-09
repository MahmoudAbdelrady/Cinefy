import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { MovieSearchResult, UpcomingMovie, MovieDetail } from '../shared/types';
import type { PaginatedResponse } from 'cinefy-ui/types';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  searchMovies(
    query: string,
    pageable?: { page?: number; size?: number },
  ): Observable<PaginatedResponse<MovieSearchResult>> {
    const params = {
      query,
      ...pageable,
    };
    return this.http.get<PaginatedResponse<MovieSearchResult>>('/movies/search', { params });
  }

  getUpcomingMovies(limit?: number): Observable<UpcomingMovie[]> {
    const params = { ...(limit !== undefined && { limit }) };
    return this.http.get<UpcomingMovie[]>('/movies/upcoming', { params });
  }

  getMovieDetails(id: number): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`/movies/${id}`);
  }

  setAnnouncement(id: number, announced: boolean): Observable<void> {
    return this.http.post<void>(`/movies/${id}/announcement`, { announced });
  }

  setHighlight(id: number, highlighted: boolean): Observable<void> {
    return this.http.post<void>(`/movies/${id}/highlight`, { highlighted });
  }
}
