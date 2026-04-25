import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaginatedResponse, MovieSearchResult, MovieDetail } from '../shared/types';

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

  getMovieDetails(id: number): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`/movies/${id}`);
  }
}
