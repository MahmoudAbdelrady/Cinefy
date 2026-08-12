import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, Observable, tap } from 'rxjs';
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
  private currentUserRequested = false;

  getCurrentUser(): Observable<CurrentUser> {
    if (!this.currentUserRequested) {
      this.currentUserRequested = true;
      this.http.get<CurrentUser>('/clients/me').subscribe({
        next: (user) => this.currentUser.next(user),
        error: () => (this.currentUserRequested = false),
      });
    }
    return this.currentUser.pipe(filter((user) => user !== null));
  }

  updateCurrentUser(payload: UpdateProfilePayload): Observable<CurrentUser> {
    return this.http
      .put<CurrentUser>('/clients/me', payload)
      .pipe(tap((user) => this.currentUser.next(user)));
  }

  changeCurrentUserPassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>('/clients/me/password', payload);
  }

  clearCurrentUser(): void {
    this.currentUser.next(null);
    this.currentUserRequested = false;
  }

  getPaymentMethods(): Observable<ClientPaymentMethod[]> {
    return this.http.get<ClientPaymentMethod[]>('/clients/me/payment-methods');
  }
}
