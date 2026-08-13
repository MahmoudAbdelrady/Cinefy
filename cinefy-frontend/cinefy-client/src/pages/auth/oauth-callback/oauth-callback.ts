import { Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ArrowRightIcon, CheckIcon, TriangleAlertIcon } from '../../../shared/icons';

type OAuthCallbackPhase = 'verifying' | 'success' | 'failed';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
};

const HANDOFF_MS = 900;

@Component({
  selector: 'oauth-callback-page',
  imports: [RouterLink, LucideDynamicIcon, LoadingSpinnerComponent],
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

  protected readonly phase = signal<OAuthCallbackPhase>('verifying');
  protected readonly provider = signal('your provider');

  constructor() {
    afterNextRender(() => this.start());
  }

  private start() {
    const params = this.route.snapshot.queryParamMap;

    this.provider.set(PROVIDER_LABELS[params.get('provider') ?? ''] ?? 'your provider');

    if (params.get('error')) {
      this.phase.set('failed');
      return;
    }

    const code = params.get('code');
    if (!code) {
      this.phase.set('failed');
      return;
    }

    this.exchange(code, params.get('state'));
  }

  private exchange(_code: string, _state: string | null) {
    // OAuth exchange wired later.
  }

  private onExchanged() {
    this.phase.set('success');
    setTimeout(() => this.router.navigateByUrl(this.redirectUrl()), HANDOFF_MS);
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/';
  }
}
