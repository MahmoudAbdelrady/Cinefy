import { Injectable, signal } from '@angular/core';
import type { Showtime } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class ShowtimeEventsService {
  private readonly _created = signal<Showtime | null>(null);
  private readonly _deleted = signal<number | null>(null);

  readonly created = this._created.asReadonly();
  readonly deleted = this._deleted.asReadonly();

  notifyCreated(showtime: Showtime): void {
    this._created.set(showtime);
  }

  notifyDeleted(movieId: number): void {
    this._deleted.set(movieId);
  }
}
