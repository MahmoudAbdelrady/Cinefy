import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { BookingDetail, BookingRequest, ShowtimeSeatSelection } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

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
}
