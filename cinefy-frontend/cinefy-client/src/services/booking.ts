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

  getBookableDates(movieId: number, context?: HttpContext): Observable<string[]> {
    return this.http.get<string[]>(`${API_PREFIX}/movies/${movieId}/dates`, { context });
  }

  getBookableShowtimes(
    movieId: number,
    date: string,
    context?: HttpContext,
  ): Observable<HallTypeShowtimes[]> {
    return this.http.get<HallTypeShowtimes[]>(`${API_PREFIX}/movies/${movieId}/showtimes`, {
      params: { date },
      context,
    });
  }

  getSeatSelection(showtimeId: string, context?: HttpContext): Observable<SeatSelection> {
    return this.http.get<SeatSelection>(`${API_PREFIX}/showtimes/${showtimeId}`, { context });
  }

  getActiveBookings(context?: HttpContext): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>(`${API_PREFIX}/active`, { context });
  }

  getActiveBookingDetails(uuid: string, context?: HttpContext): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${API_PREFIX}/active/${uuid}`, { context });
  }

  getBookingConfirmation(uuid: string, context?: HttpContext): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`${API_PREFIX}/${uuid}/confirmation`, { context });
  }

  getPastBookings(
    pageable?: { page?: number; size?: number },
    context?: HttpContext,
  ): Observable<PaginatedResponse<PastBooking>> {
    return this.http.get<PaginatedResponse<PastBooking>>(`${API_PREFIX}/past`, {
      params: { ...pageable },
      context,
    });
  }

  getPastBookingDetails(uuid: string, context?: HttpContext): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`${API_PREFIX}/past/${uuid}`, { context });
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
