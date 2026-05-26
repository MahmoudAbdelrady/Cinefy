import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import type {
  LoginPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // null = not yet checked this app session; true/false = known. Read by the route guards.
  private readonly authStatus = signal<boolean | null>(null);

  // The in-flight /refresh, shared across all concurrent 401s.
  private refresh$: Observable<void> | null = null;

  login(data: LoginPayload): Observable<void> {
    return this.http
      .post<void>('/management/auth/login', data)
      .pipe(tap(() => this.authStatus.set(true)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/management/auth/logout', null)
      .pipe(tap(() => this.authStatus.set(false)));
  }

  forgotPassword(data: ForgotPasswordPayload): Observable<void> {
    return this.http.post<void>('/management/auth/forgot-password', data);
  }

  verifyResetCode(data: VerifyResetCodePayload): Observable<void> {
    return this.http.post<void>('/management/auth/verify-reset-code', data);
  }

  resetPassword(data: ResetPasswordPayload): Observable<void> {
    return this.http.post<void>('/management/auth/reset-password', data);
  }

  isAuthenticated(): Observable<boolean> {
    const known = this.authStatus();
    if (known !== null) return of(known);

    return this.http.get<void>('/management/auth/session').pipe(
      map(() => true),
      catchError(() => of(false)),
      tap((valid) => this.authStatus.set(valid)),
    );
  }

  // Single-flight: concurrent 401s share ONE /refresh execution.
  refresh(): Observable<void> {
    this.refresh$ ??= this.http.post<void>('/management/auth/refresh', null).pipe(
      // Clear the slot once it settles so the next expiry starts a fresh refresh.
      finalize(() => (this.refresh$ = null)),
      // Default refCount (false) + finalize keeps the single execution alive across subscribers.
      shareReplay(1),
    );
    return this.refresh$;
  }

  clearAuthState(): void {
    this.authStatus.set(false);
  }
}
