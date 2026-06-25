import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import type {
  SignUpPayload,
  LoginPayload,
  OtpCodePayload,
  SendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../shared/types';
import { ClientService } from './clients';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly clientService = inject(ClientService);

  private readonly authStatus = signal<boolean | null>(null);

  private refresh$: Observable<void> | null = null;

  signUp(data: SignUpPayload): Observable<void> {
    return this.http.post<void>('/clients/auth/sign-up', data);
  }

  verifyAccount(data: OtpCodePayload): Observable<void> {
    return this.http
      .post<void>('/clients/auth/verify-account', data)
      .pipe(tap(() => this.authStatus.set(true)));
  }

  sendOtp(data: SendOtpPayload): Observable<void> {
    return this.http.post<void>('/clients/auth/send-otp', data);
  }

  login(data: LoginPayload, context?: HttpContext): Observable<void> {
    return this.http
      .post<void>('/clients/auth/login', data, { context })
      .pipe(tap(() => this.authStatus.set(true)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/clients/auth/logout', null)
      .pipe(tap(() => this.clearAuthState()));
  }

  forgotPassword(data: ForgotPasswordPayload): Observable<void> {
    return this.http.post<void>('/clients/auth/forgot-password', data);
  }

  verifyResetCode(data: OtpCodePayload): Observable<void> {
    return this.http.post<void>('/clients/auth/verify-reset-code', data);
  }

  resetPassword(data: ResetPasswordPayload): Observable<void> {
    return this.http.post<void>('/clients/auth/reset-password', data);
  }

  isAuthenticated(): Observable<boolean> {
    const known = this.authStatus();
    if (known !== null) return of(known);

    return this.http.get<void>('/clients/auth/session').pipe(
      map(() => true),
      catchError(() => of(false)),
      tap((valid) => this.authStatus.set(valid)),
    );
  }

  // Single-flight: concurrent 401s share ONE /refresh execution.
  refresh(): Observable<void> {
    this.refresh$ ??= this.http.post<void>('/clients/auth/refresh', null).pipe(
      // Clear the slot once it settles so the next expiry starts a fresh refresh.
      finalize(() => (this.refresh$ = null)),
      // Default refCount (false) + finalize keeps the single execution alive across subscribers.
      shareReplay(1),
    );
    return this.refresh$;
  }

  clearAuthState(): void {
    this.authStatus.set(false);
    this.clientService.clearCurrentUser();
  }
}
