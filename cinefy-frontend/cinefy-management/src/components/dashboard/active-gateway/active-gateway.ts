import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { CinefyEmptyState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { skipErrorToast } from '../../../app/core/interceptors';
import { PaymentGatewaysService } from '../../../services';
import { AlertIcon, CreditCardIcon, SettingsIcon } from '../../../shared/icons';
import { GATEWAY_PROVIDER_LABELS } from '../../../shared/types';
import type { PaymentGateway } from '../../../shared/types';
import { PAYMENT_PROVIDERS } from '../../payment/provider-spec';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

@Component({
  selector: 'active-gateway',
  imports: [
    DashboardWidgetComponent,
    RouterLink,
    LucideDynamicIcon,
    CinefyEmptyState,
    CinefyLoadingSpinner,
  ],
  templateUrl: './active-gateway.html',
  styleUrl: './active-gateway.scss',
})
export class ActiveGatewayComponent {
  protected readonly icons = { AlertIcon, CreditCardIcon, SettingsIcon };

  private readonly paymentGatewaysService = inject(PaymentGatewaysService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly gateway = signal<PaymentGateway | null>(null);
  protected readonly loading = signal(true);

  protected readonly providerLabel = computed(() => {
    const provider = this.gateway()?.provider;
    return provider ? GATEWAY_PROVIDER_LABELS[provider] : '';
  });

  private readonly providerSpec = computed(() => {
    const provider = this.gateway()?.provider;
    return PAYMENT_PROVIDERS.find((spec) => spec.provider === provider) ?? null;
  });

  protected readonly supportsChannels = computed(
    () => this.providerSpec()?.supportsChannels ?? false,
  );

  protected readonly channels = computed(() => this.gateway()?.paymentChannels ?? []);

  protected readonly noChannelActive = computed(() => {
    if (!this.providerSpec()?.channelsRequired) return false;
    return !this.channels().some((channel) => channel.active);
  });

  constructor() {
    afterNextRender(() => this.load());
  }

  private load(): void {
    this.paymentGatewaysService
      .getActivePaymentGateway(skipErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (gateway) => {
          this.gateway.set(gateway);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
