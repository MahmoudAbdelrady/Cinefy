import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  HighlightedMovie,
  MovieDetail,
  MovieSearchResult,
  NowShowingMovie,
} from '../shared/types';

const API_PREFIX = '/movies';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  getHighlighted(): Observable<HighlightedMovie[]> {
    return this.http.get<HighlightedMovie[]>(`${API_PREFIX}/highlighted`);
  }

  getNowShowing(limit?: number): Observable<NowShowingMovie[]> {
    const params = { ...(limit !== undefined && { limit }) };
    return this.http.get<NowShowingMovie[]>(`${API_PREFIX}/now-showing`, { params });
  }

  getAnnouncedUpcoming(): Observable<MovieSearchResult[]> {
    return this.http.get<MovieSearchResult[]>(`${API_PREFIX}/announced-upcoming`);
  }

  getMovieDetails(id: number, context?: HttpContext): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`${API_PREFIX}/${id}`, { context });
  }
}
