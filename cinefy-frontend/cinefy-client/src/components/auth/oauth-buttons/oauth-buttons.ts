import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { OAuthProvider } from '../../../shared/types';
import { AuthService } from '../../../services';

@Component({
  selector: 'oauth-buttons',
  imports: [LoadingSpinnerComponent],
  templateUrl: './oauth-buttons.html',
  styleUrl: './oauth-buttons.scss',
})
export class OAuthButtonsComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingProvider = signal<string | null>(null);

  protected readonly providers: OAuthProvider[] = [
    {
      label: 'Google',
      code: 'GOOGLE',
      iconSrc: '/Assets/google-icon-logo.svg',
    },
    {
      label: 'Apple',
      code: 'APPLE',
      iconSrc: '/Assets/apple-icon-logo.png',
    },
  ];

  protected authenticateWith(code: string) {
    if (this.pendingProvider()) return;

    this.pendingProvider.set(code);
    this.authService
      .getOAuthAuthorizationUrl(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (authorizationUrl) => window.location.assign(authorizationUrl),
        error: () => this.pendingProvider.set(null),
      });
  }
}
