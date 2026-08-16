import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { OAuthRegisterForm } from '../../../components';
import { AuthService } from '../../../services';
import { OAuthRegistration } from '../../../shared/types';
import { skipErrorToast } from '../../../app/core/interceptors';
import { ArrowRightIcon, CheckIcon, TriangleAlertIcon } from '../../../shared/icons';

type OAuthCallbackPhase = 'verifying' | 'register' | 'success' | 'failed';

const HANDOFF_MS = 900;

@Component({
  selector: 'oauth-callback-page',
  imports: [RouterLink, LucideDynamicIcon, LoadingSpinnerComponent, OAuthRegisterForm],
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
        error: () => this.phase.set('failed'),
      });
  }

  private onExchanged(registration: OAuthRegistration | null) {
    if (registration) {
      this.registration.set(registration);
      this.phase.set('register');
      return;
    }

    this.phase.set('success');
    setTimeout(() => this.goToRedirect(), HANDOFF_MS);
  }

  protected goToRedirect() {
    this.router.navigateByUrl(this.redirectUrl());
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/';
  }
}
