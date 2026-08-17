import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaginatedResponse } from 'cinefy-ui/types';
import type {
  BookingConfirmation,
  BookingDetail,
  BookingRequest,
  BookingSummary,
  HallTypeShowtimes,
  PastBooking,
  Redirection,
  SavedCardPaymentRequest,
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

  getBookingConfirmation(uuid: string, context?: HttpContext): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`/booking/${uuid}/confirmation`, { context });
  }

  getPastBookings(pageable?: {
    page?: number;
    size?: number;
  }): Observable<PaginatedResponse<PastBooking>> {
    return this.http.get<PaginatedResponse<PastBooking>>('/booking/past', {
      params: { ...pageable },
    });
  }

  getPastBookingDetails(uuid: string): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`/booking/past/${uuid}`);
  }

  createBooking(request: BookingRequest, idempotencyKey: string): Observable<BookingDetail> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<BookingDetail>('/booking', request, { headers });
  }

  cancelBooking(uuid: string, context?: HttpContext): Observable<void> {
    return this.http.delete<void>(`/booking/${uuid}`, { context });
  }

  payBooking(uuid: string): Observable<Redirection> {
    return this.http.post<Redirection>(`/booking/${uuid}/pay`, null);
  }

  paySavedCard(uuid: string, paymentMethodId: string): Observable<Redirection> {
    const payload: SavedCardPaymentRequest = { paymentMethodId };
    return this.http.post<Redirection>(`/booking/${uuid}/pay-saved-card`, payload);
  }
}
