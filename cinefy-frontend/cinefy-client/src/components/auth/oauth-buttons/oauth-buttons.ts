import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CinefyLoadingSpinner } from 'cinefy-ui/components';
import { OAuthProvider } from '../../../shared/types';
import { AuthService } from '../../../services';

@Component({
  selector: 'oauth-buttons',
  imports: [CinefyLoadingSpinner],
  templateUrl: './oauth-buttons.html',
  styleUrl: './oauth-buttons.scss',
})
export class OAuthButtonsComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingProvider = signal<string | null>(null);

  protected readonly providers: OAuthProvider[] = [
    {
      label: 'Google',
      code: 'GOOGLE',
      iconSrc: '/Assets/google-icon-logo.svg',
    },
    {
      label: 'Microsoft',
      code: 'MICROSOFT',
      iconSrc: '/Assets/microsoft-icon-logo.svg',
    },
  ];

  protected authenticateWith(code: string) {
    if (this.pendingProvider()) return;

    this.pendingProvider.set(code);
    this.authService
      .getOAuthAuthorizationUrl(code, this.redirectUrl())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (authorizationUrl) => window.location.assign(authorizationUrl),
        error: () => this.pendingProvider.set(null),
      });
  }

  private redirectUrl(): string | undefined {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? undefined;
  }
}
