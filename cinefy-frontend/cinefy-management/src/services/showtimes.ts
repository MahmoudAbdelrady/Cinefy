import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getMoviesWithShowtimes(): Observable<MovieWithShowtimes[]> {
    return this.http.get<MovieWithShowtimes[]>(`${API_PREFIX}/movies`);
  }

  getShowtimesStatistics(): Observable<ShowtimesStatistics> {
    return this.http.get<ShowtimesStatistics>(`${API_PREFIX}/statistics`);
  }

  getMovieShowtimeDates(movieId: number): Observable<MovieShowtimeDatesResponse> {
    return this.http.get<MovieShowtimeDatesResponse>(`${API_PREFIX}/movie-dates`, {
      params: { movieId },
    });
  }

  getMovieShowtimesForDate(movieId: number, date: string): Observable<MovieShowtimesResponse> {
    return this.http.get<MovieShowtimesResponse>(`${API_PREFIX}/movie-day`, {
      params: { movieId, date },
    });
  }

  getScheduleForDate(day: string): Observable<ScheduledShowtime[]> {
    return this.http.get<ScheduledShowtime[]>(`${API_PREFIX}/schedule`, { params: { day } });
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
