import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import type {
  ChangePasswordPayload,
  ClientPaymentMethod,
  CurrentUser,
  UpdateProfilePayload,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = new BehaviorSubject<CurrentUser | null>(null);
  private currentUser$: Observable<CurrentUser> | null = null;

  getCurrentUser(): Observable<CurrentUser> {
    this.currentUser$ ??= this.http.get<CurrentUser>('/client/me').pipe(
      tap((user) => this.currentUser.next(user)),
      catchError((error) => {
        this.currentUser$ = null;
        return throwError(() => error);
      }),
      switchMap(() => this.currentUser.pipe(filter((user) => user !== null))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.currentUser$;
  }

  updateCurrentUser(payload: UpdateProfilePayload): Observable<CurrentUser> {
    return this.http
      .put<CurrentUser>('/client/me', payload)
      .pipe(tap((user) => this.currentUser.next(user)));
  }

  changeCurrentUserPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>('/client/me/password', payload).pipe(
      tap(() => {
        const user = this.currentUser.value;
        if (user && !user.hasPassword) {
          this.currentUser.next({ ...user, hasPassword: true });
        }
      }),
    );
  }

  deletePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`/client/me/payment-methods/${id}`);
  }

  clearCurrentUser(): void {
    this.currentUser.next(null);
    this.currentUser$ = null;
  }

  getPaymentMethods(): Observable<ClientPaymentMethod[]> {
    return this.http.get<ClientPaymentMethod[]>('/client/me/payment-methods');
  }
}
