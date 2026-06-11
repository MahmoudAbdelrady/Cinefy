import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HighlightedMovie, MovieSearchResult } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  getHighlighted(): Observable<HighlightedMovie[]> {
    return this.http.get<HighlightedMovie[]>('/movies/highlighted');
  }

  getNowShowing(limit?: number): Observable<MovieSearchResult[]> {
    const params = { ...(limit !== undefined && { limit }) };
    return this.http.get<MovieSearchResult[]>('/movies/now-showing', { params });
  }

  getAnnouncedUpcoming(): Observable<MovieSearchResult[]> {
    return this.http.get<MovieSearchResult[]>('/movies/announced-upcoming');
  }
}
