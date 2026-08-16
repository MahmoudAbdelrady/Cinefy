import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { OAuthRegisterForm, OtpStep } from '../../../components';
import { AuthService } from '../../../services';
import { ApiError, OAuthRegistration } from '../../../shared/types';
import { skipErrorToast } from '../../../app/core/interceptors';
import { ArrowRightIcon, CheckIcon, TriangleAlertIcon } from '../../../shared/icons';

type OAuthCallbackPhase = 'verifying' | 'register' | 'verify-account' | 'success' | 'failed';

const DEFAULT_ERROR_MESSAGE = "We couldn't complete your sign-in. Please try again.";

@Component({
  selector: 'oauth-callback-page',
  imports: [RouterLink, LucideDynamicIcon, LoadingSpinnerComponent, OAuthRegisterForm, OtpStep],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.scss',
})
export class OAuthCallbackPage {
  protected readonly icons = {
    ArrowRightIcon,
    CheckIcon,
    TriangleAlertIcon,
  };

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly phase = signal<OAuthCallbackPhase>('verifying');
  protected readonly registration = signal<OAuthRegistration | null>(null);
  protected readonly errorMessage = signal(DEFAULT_ERROR_MESSAGE);
  protected readonly unverifiedEmail = signal('');

  protected readonly verifyAccount = (code: string) => this.authService.verifyAccount({ code });

  constructor() {
    afterNextRender(() => this.start());
  }

  private start() {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');

    if (params.get('error') || !code || !state) {
      this.phase.set('failed');
      return;
    }

    this.authService
      .handleOAuthCallback({ code, state }, skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registration) => this.onExchanged(registration),
        error: (error: HttpErrorResponse) => {
          const body = error.error as ApiError | null;
          if (body?.errorCode === 'ACCOUNT_NOT_VERIFIED') {
            const data = body.data as { email?: string } | undefined;
            this.unverifiedEmail.set(data?.email ?? '');
            this.phase.set('verify-account');
            return;
          }
          this.errorMessage.set(body?.message ?? DEFAULT_ERROR_MESSAGE);
          this.phase.set('failed');
        },
      });
  }

  private onExchanged(registration: OAuthRegistration | null) {
    if (registration) {
      this.registration.set(registration);
      this.phase.set('register');
      return;
    }

    this.phase.set('success');
    this.goToRedirect();
  }

  protected goToRedirect() {
    this.router.navigateByUrl(this.redirectUrl());
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/';
  }
}
