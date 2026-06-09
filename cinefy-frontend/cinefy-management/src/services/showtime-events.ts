import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { Showtime } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class ShowtimeEventsService {
  private readonly _created = new Subject<Showtime>();
  private readonly _updated = new Subject<Showtime>();
  private readonly _published = new Subject<{ movieId: number; count: number }>();
  private readonly _deleted = new Subject<number>();
  private readonly _singleDeleted = new Subject<{ movieId: number; wasDraft: boolean }>();
  private readonly _committedChanged = new Subject<{
    movieId: number;
    hasCommittedShowtimes: boolean;
  }>();
  private readonly _highlightChanged = new Subject<{
    movieId: number;
    isHighlighted: boolean;
  }>();

  readonly created$ = this._created.asObservable();
  readonly updated$ = this._updated.asObservable();
  readonly published$ = this._published.asObservable();
  readonly deleted$ = this._deleted.asObservable();
  readonly singleDeleted$ = this._singleDeleted.asObservable();
  readonly committedChanged$ = this._committedChanged.asObservable();
  readonly highlightChanged$ = this._highlightChanged.asObservable();

  notifyCreated(showtime: Showtime): void {
    this._created.next(showtime);
  }

  notifyUpdated(showtime: Showtime): void {
    this._updated.next(showtime);
  }

  notifyPublished(movieId: number, count: number): void {
    this._published.next({ movieId, count });
  }

  notifyDeleted(movieId: number): void {
    this._deleted.next(movieId);
  }

  notifySingleDeleted(movieId: number, wasDraft: boolean): void {
    this._singleDeleted.next({ movieId, wasDraft });
  }

  notifyCommittedChanged(movieId: number, hasCommittedShowtimes: boolean): void {
    this._committedChanged.next({ movieId, hasCommittedShowtimes });
  }

  notifyHighlightChanged(movieId: number, isHighlighted: boolean): void {
    this._highlightChanged.next({ movieId, isHighlighted });
  }
}
