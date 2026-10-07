import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  BookingConfirmation,
  BookingDetail,
  BookingRequest,
  BookingSummary,
  ShowtimeSeatSelection,
  StaffPaymentRequest,
} from '../shared/types';

const API_PREFIX = '/booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getActiveBookings(context?: HttpContext): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>(`${API_PREFIX}/active`, { context });
  }

  getSeatSelection(showtimeId: string, context?: HttpContext): Observable<ShowtimeSeatSelection> {
    return this.http.get<ShowtimeSeatSelection>(`${API_PREFIX}/showtimes/${showtimeId}`, {
      context,
    });
  }

  createBooking(request: BookingRequest, idempotencyKey: string): Observable<BookingDetail> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<BookingDetail>(API_PREFIX, request, { headers });
  }

  cancelBooking(uuid: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${uuid}`);
  }

  settlePayment(uuid: string, request: StaffPaymentRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(`${API_PREFIX}/${uuid}/settle`, request);
  }

  scanTicket(bookingReference: string): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(
      `${API_PREFIX}/tickets/${bookingReference}/scan`,
      null,
    );
  }
}
