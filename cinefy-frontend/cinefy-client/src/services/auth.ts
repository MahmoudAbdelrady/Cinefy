import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import type {
  SignUpPayload,
  LoginPayload,
  OtpCodePayload,
  SendOtpPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
  Redirection,
  OAuthCallbackPayload,
  OAuthCallbackResult,
  OAuthSignUpPayload,
} from '../shared/types';
import { ClientService } from './clients';

const API_PREFIX = '/client/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly clientService = inject(ClientService);

  private readonly authStatus = signal<boolean | null>(null);

  private refresh$: Observable<void> | null = null;

  signUp(data: SignUpPayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/sign-up`, data);
  }

  verifyAccount(data: OtpCodePayload): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/verify-account`, data)
      .pipe(tap(() => this.authStatus.set(true)));
  }

  sendOtp(data: SendOtpPayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/send-otp`, data);
  }

  login(data: LoginPayload, context?: HttpContext): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/login`, data, { context })
      .pipe(tap(() => this.authStatus.set(true)));
  }

  getOAuthAuthorizationUrl(provider: string, redirectUrl?: string): Observable<string> {
    const params = redirectUrl ? new HttpParams().set('redirectUrl', redirectUrl) : undefined;

    return this.http
      .get<Redirection>(`${API_PREFIX}/oauth/${provider}/authorization-url`, { params })
      .pipe(map((response) => response.url));
  }

  handleOAuthCallback(
    data: OAuthCallbackPayload,
    context?: HttpContext,
  ): Observable<OAuthCallbackResult> {
    return this.http
      .post<OAuthCallbackResult | null>(`${API_PREFIX}/oauth/callback`, data, { context })
      .pipe(
        map((result) => result ?? {}),
        tap((result) => this.authStatus.set(!result.registration)),
      );
  }

  oAuthSignUp(data: OAuthSignUpPayload, context?: HttpContext): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/oauth/sign-up`, data, { context })
      .pipe(tap(() => this.authStatus.set(true)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${API_PREFIX}/logout`, null)
      .pipe(tap(() => this.clearAuthState()));
  }

  verifyOtp(data: VerifyOtpPayload): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/verify-otp`, data);
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
    this.clientService.clearCurrentUser();
  }
}
