import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PublishShowtimesInput, Showtime, ShowtimeDraft } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class ShowtimesService {
  private readonly http = inject(HttpClient);

  createShowtime(data: ShowtimeDraft): Observable<Showtime> {
    return this.http.post<Showtime>('/showtimes', data);
  }

  updateShowtime(id: string, data: ShowtimeDraft): Observable<Showtime> {
    return this.http.put<Showtime>(`/showtimes/${id}`, data);
  }

  deleteShowtime(id: string): Observable<void> {
    return this.http.delete<void>(`/showtimes/${id}`);
  }

  publishShowtimes(data: PublishShowtimesInput): Observable<void> {
    return this.http.post<void>('/showtimes/publish', data);
  }
}
