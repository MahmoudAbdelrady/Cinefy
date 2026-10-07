import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  MovieShowtimeDatesResponse,
  MovieShowtimesResponse,
  MovieWithShowtimes,
  PublishShowtimesInput,
  ScheduledShowtime,
  Showtime,
  ShowtimeDraft,
  ShowtimesStatistics,
} from '../shared/types';

const API_PREFIX = '/showtimes';

@Injectable({ providedIn: 'root' })
export class ShowtimesService {
  private readonly http = inject(HttpClient);

  getMoviesWithShowtimes(context?: HttpContext): Observable<MovieWithShowtimes[]> {
    return this.http.get<MovieWithShowtimes[]>(`${API_PREFIX}/movies`, { context });
  }

  getShowtimesStatistics(context?: HttpContext): Observable<ShowtimesStatistics> {
    return this.http.get<ShowtimesStatistics>(`${API_PREFIX}/statistics`, { context });
  }

  getMovieShowtimeDates(
    movieId: number,
    context?: HttpContext,
  ): Observable<MovieShowtimeDatesResponse> {
    return this.http.get<MovieShowtimeDatesResponse>(`${API_PREFIX}/movie-dates`, {
      params: { movieId },
      context,
    });
  }

  getMovieShowtimesForDate(
    movieId: number,
    date: string,
    context?: HttpContext,
  ): Observable<MovieShowtimesResponse> {
    return this.http.get<MovieShowtimesResponse>(`${API_PREFIX}/movie-day`, {
      params: { movieId, date },
      context,
    });
  }

  getScheduleForDate(day: string, context?: HttpContext): Observable<ScheduledShowtime[]> {
    return this.http.get<ScheduledShowtime[]>(`${API_PREFIX}/schedule`, {
      params: { day },
      context,
    });
  }

  createShowtime(data: ShowtimeDraft): Observable<Showtime> {
    return this.http.post<Showtime>(API_PREFIX, data);
  }

  updateShowtime(id: string, data: ShowtimeDraft): Observable<Showtime> {
    return this.http.put<Showtime>(`${API_PREFIX}/${id}`, data);
  }

  deleteShowtime(id: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${id}`);
  }

  deleteMovieShowtimes(movieId: number): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/movies/${movieId}`);
  }

  publishShowtimes(data: PublishShowtimesInput): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/publish`, data);
  }
}
