import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import type { CurrentUser } from '../shared/types';

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

  clearCurrentUser(): void {
    this.currentUser.next(null);
    this.currentUserRequested = false;
  }
}
