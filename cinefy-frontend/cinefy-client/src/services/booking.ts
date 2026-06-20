import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HallTypeShowtimes, SeatSelection } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getBookableDates(movieId: number): Observable<string[]> {
    return this.http.get<string[]>(`/booking/movies/${movieId}/dates`);
  }

  getBookableShowtimes(movieId: number, date: string): Observable<HallTypeShowtimes[]> {
    return this.http.get<HallTypeShowtimes[]>(`/booking/movies/${movieId}/showtimes`, {
      params: { date },
    });
  }

  getSeatSelection(showtimeId: string): Observable<SeatSelection> {
    return this.http.get<SeatSelection>(`/booking/showtimes/${showtimeId}`);
  }
}
