import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  BookingDetail,
  BookingRequest,
  BookingSummary,
  HallTypeShowtimes,
  SeatSelection,
} from '../shared/types';

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

  getSeatSelection(showtimeId: string, context?: HttpContext): Observable<SeatSelection> {
    return this.http.get<SeatSelection>(`/booking/showtimes/${showtimeId}`, { context });
  }

  getActiveBookings(): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>('/booking/active');
  }

  getActiveBookingDetails(uuid: string, context?: HttpContext): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`/booking/active/${uuid}`, { context });
  }

  createBooking(request: BookingRequest, idempotencyKey: string): Observable<BookingDetail> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<BookingDetail>('/booking', request, { headers });
  }

  cancelBooking(uuid: string, context?: HttpContext): Observable<void> {
    return this.http.delete<void>(`/booking/${uuid}`, { context });
  }
}
