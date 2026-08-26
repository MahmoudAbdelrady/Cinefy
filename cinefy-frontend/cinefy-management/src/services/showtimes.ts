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

@Injectable({ providedIn: 'root' })
export class ShowtimesService {
  private readonly http = inject(HttpClient);

  getMoviesWithShowtimes(): Observable<MovieWithShowtimes[]> {
    return this.http.get<MovieWithShowtimes[]>('/showtimes/movies');
  }

  getShowtimesStatistics(): Observable<ShowtimesStatistics> {
    return this.http.get<ShowtimesStatistics>('/showtimes/statistics');
  }

  getMovieShowtimeDates(movieId: number): Observable<MovieShowtimeDatesResponse> {
    return this.http.get<MovieShowtimeDatesResponse>('/showtimes/movie-dates', {
      params: { movieId },
    });
  }

  getMovieShowtimesForDate(movieId: number, date: string): Observable<MovieShowtimesResponse> {
    return this.http.get<MovieShowtimesResponse>('/showtimes/movie-day', {
      params: { movieId, date },
    });
  }

  getScheduleForDate(day: string): Observable<ScheduledShowtime[]> {
    return this.http.get<ScheduledShowtime[]>('/showtimes/schedule', { params: { day } });
  }

  createShowtime(data: ShowtimeDraft): Observable<Showtime> {
    return this.http.post<Showtime>('/showtimes', data);
  }

  updateShowtime(id: string, data: ShowtimeDraft): Observable<Showtime> {
    return this.http.put<Showtime>(`/showtimes/${id}`, data);
  }

  deleteShowtime(id: string): Observable<void> {
    return this.http.delete<void>(`/showtimes/${id}`);
  }

  deleteMovieShowtimes(movieId: number): Observable<void> {
    return this.http.delete<void>(`/showtimes/movies/${movieId}`);
  }

  publishShowtimes(data: PublishShowtimesInput): Observable<void> {
    return this.http.post<void>('/showtimes/publish', data);
  }
}
