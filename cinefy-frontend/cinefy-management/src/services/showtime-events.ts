import { Injectable, signal } from '@angular/core';
import type { Showtime } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class ShowtimeEventsService {
  private readonly _created = signal<Showtime | null>(null);
  private readonly _updated = signal<Showtime | null>(null);
  private readonly _published = signal<{ movieId: number; count: number } | null>(null);
  private readonly _deleted = signal<number | null>(null);
  private readonly _committedChanged = signal<{
    movieId: number;
    hasCommittedShowtimes: boolean;
  } | null>(null);

  readonly created = this._created.asReadonly();
  readonly updated = this._updated.asReadonly();
  readonly published = this._published.asReadonly();
  readonly deleted = this._deleted.asReadonly();
  readonly committedChanged = this._committedChanged.asReadonly();

  notifyCreated(showtime: Showtime): void {
    this._created.set(showtime);
  }

  notifyUpdated(showtime: Showtime): void {
    this._updated.set(showtime);
  }

  notifyPublished(movieId: number, count: number): void {
    this._published.set({ movieId, count });
  }

  notifyDeleted(movieId: number): void {
    this._deleted.set(movieId);
  }

  notifyCommittedChanged(movieId: number, hasCommittedShowtimes: boolean): void {
    this._committedChanged.set({ movieId, hasCommittedShowtimes });
  }
}
