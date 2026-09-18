import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
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

  // null = not yet checked this app session; true/false = known. Read by the route guards.
  private readonly authStatus = signal<boolean | null>(null);

  // The in-flight /refresh, shared across all concurrent 401s.
  private refresh$: Observable<void> | null = null;

  login(data: LoginPayload): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/login`, data)
      .pipe(tap(() => this.authStatus.set(true)));
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

  isAuthenticated(): Observable<boolean> {
    const known = this.authStatus();
    if (known !== null) return of(known);

    return this.http.get<void>(`${API_PREFIX}/session`).pipe(
      map(() => true),
      catchError(() => of(false)),
      tap((valid) => this.authStatus.set(valid)),
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
    this.authStatus.set(false);
    this.staffService.clearCurrentStaffMember();
  }
}
