import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { skipServerErrorToast } from 'cinefy-ui/http';
import type { AuthStatus } from 'cinefy-ui/types';
import type {
  LoginPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
} from '../shared/types';
import { StaffService } from './staff';

const API_PREFIX = '/management/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly staffService = inject(StaffService);

  private readonly authStatus = signal<AuthStatus | null>(null);

  readonly serverUnavailable = computed(() => this.authStatus() === 'UNAVAILABLE');

  // The in-flight /refresh, shared across all concurrent 401s.
  private refresh$: Observable<void> | null = null;

  login(data: LoginPayload): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/login`, data)
      .pipe(tap(() => this.authStatus.set('AUTHENTICATED')));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/logout`, null)
      .pipe(tap(() => this.clearAuthState()));
  }

  forgotPassword(data: ForgotPasswordPayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/forgot-password`, data);
  }

  verifyResetCode(data: VerifyResetCodePayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/verify-reset-code`, data);
  }

  resetPassword(data: ResetPasswordPayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/reset-password`, data);
  }

  getAuthStatus(): Observable<AuthStatus> {
    const known = this.authStatus();
    if (known) return of(known);

    return this.http.get<void>(`${API_PREFIX}/session`, { context: skipServerErrorToast() }).pipe(
      map((): AuthStatus => 'AUTHENTICATED'),
      catchError((error: HttpErrorResponse) => {
        const unavailable = error.status === 0 || error.status >= 500;
        return of<AuthStatus>(unavailable ? 'UNAVAILABLE' : 'UNAUTHENTICATED');
      }),
      tap((status) => this.authStatus.set(status)),
    );
  }

  refresh(): Observable<void> {
    this.refresh$ ??= this.http.post<void>(`${API_PREFIX}/refresh`, null).pipe(
      finalize(() => (this.refresh$ = null)),
      shareReplay(1),
    );
    return this.refresh$;
  }

  clearAuthState(): void {
    this.authStatus.set('UNAUTHENTICATED');
    this.staffService.clearCurrentStaffMember();
  }
}
