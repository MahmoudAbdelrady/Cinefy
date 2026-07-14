import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ShowtimeSeatSelection } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getSeatSelection(showtimeId: string): Observable<ShowtimeSeatSelection> {
    return this.http.get<ShowtimeSeatSelection>(`/booking/showtimes/${showtimeId}`);
  }
}
