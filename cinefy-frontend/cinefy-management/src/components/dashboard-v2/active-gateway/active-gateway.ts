import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { EmptyStateComponent } from 'cinefy-ui/components';
import { AlertIcon, CreditCardIcon } from '../../../shared/icons';
import { GATEWAY_PROVIDER_LABELS } from '../../../shared/types';
import type { PaymentGateway } from '../../../shared/types';
import { PAYMENT_PROVIDERS } from '../../payment/provider-spec';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

const ACTIVE_GATEWAY: PaymentGateway | null = {
  id: 'pg_01',
  name: 'Primary Paymob',
  provider: 'PAYMOB',
  active: true,
  createdAt: '2026-01-14T09:00:00',
  paymentChannels: [
    { name: 'Card', currency: 'EGP', active: true, providerConfig: {} },
    { name: 'Mobile wallet', currency: 'EGP', active: true, providerConfig: {} },
    { name: 'Card', currency: 'USD', active: false, providerConfig: {} },
  ],
};

@Component({
  selector: 'active-gateway',
  imports: [DashboardWidgetComponent, RouterLink, LucideDynamicIcon, EmptyStateComponent],
  templateUrl: './active-gateway.html',
  styleUrl: './active-gateway.scss',
})
export class ActiveGatewayComponent {
  protected readonly icons = { AlertIcon, CreditCardIcon };

  protected readonly gateway = signal<PaymentGateway | null>(ACTIVE_GATEWAY);

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
}
