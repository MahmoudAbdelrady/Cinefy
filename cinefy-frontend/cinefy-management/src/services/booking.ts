import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  BookingConfirmation,
  BookingDetail,
  BookingRequest,
  BookingSummary,
  ShowtimeSeatSelection,
  StaffPaymentRequest,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getActiveBookings(): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>('/booking/active');
  }

  getSeatSelection(showtimeId: string): Observable<ShowtimeSeatSelection> {
    return this.http.get<ShowtimeSeatSelection>(`/booking/showtimes/${showtimeId}`);
  }

  createBooking(request: BookingRequest, idempotencyKey: string): Observable<BookingDetail> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<BookingDetail>('/booking', request, { headers });
  }

  cancelBooking(uuid: string): Observable<void> {
    return this.http.delete<void>(`/booking/${uuid}`);
  }

  settlePayment(uuid: string, request: StaffPaymentRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(`/booking/${uuid}/settle`, request);
  }
}
