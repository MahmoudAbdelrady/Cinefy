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

const API_PREFIX = '/booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getBookableDates(movieId: number): Observable<string[]> {
    return this.http.get<string[]>(`${API_PREFIX}/movies/${movieId}/dates`);
  }

  getBookableShowtimes(movieId: number, date: string): Observable<HallTypeShowtimes[]> {
    return this.http.get<HallTypeShowtimes[]>(`${API_PREFIX}/movies/${movieId}/showtimes`, {
      params: { date },
    });
  }

  getSeatSelection(showtimeId: string, context?: HttpContext): Observable<SeatSelection> {
    return this.http.get<SeatSelection>(`${API_PREFIX}/showtimes/${showtimeId}`, { context });
  }

  getActiveBookings(): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>(`${API_PREFIX}/active`);
  }

  getActiveBookingDetails(uuid: string, context?: HttpContext): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${API_PREFIX}/active/${uuid}`, { context });
  }

  getBookingConfirmation(uuid: string, context?: HttpContext): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`${API_PREFIX}/${uuid}/confirmation`, { context });
  }

  getPastBookings(pageable?: {
    page?: number;
    size?: number;
  }): Observable<PaginatedResponse<PastBooking>> {
    return this.http.get<PaginatedResponse<PastBooking>>(`${API_PREFIX}/past`, {
      params: { ...pageable },
    });
  }

  getPastBookingDetails(uuid: string): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`${API_PREFIX}/past/${uuid}`);
  }

  createBooking(request: BookingRequest, idempotencyKey: string): Observable<BookingDetail> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<BookingDetail>(API_PREFIX, request, { headers });
  }

  cancelBooking(uuid: string, context?: HttpContext): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${uuid}`, { context });
  }

  payBooking(uuid: string): Observable<Redirection> {
    return this.http.post<Redirection>(`${API_PREFIX}/${uuid}/pay`, null);
  }

  paySavedCard(uuid: string, paymentMethodId: string): Observable<Redirection> {
    const payload: SavedCardPaymentRequest = { paymentMethodId };
    return this.http.post<Redirection>(`${API_PREFIX}/${uuid}/pay-saved-card`, payload);
  }
}
