import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  ModalComponent,
  Switch,
} from 'cinefy-ui/components';
import {
  AlertIcon,
  CreditCardIcon,
  DeleteIcon,
  EditIcon,
  EyeIcon,
  InfoIcon,
  PowerIcon,
  PowerOffIcon,
  WebhookIcon,
} from '../../../shared/icons';
import {
  GATEWAY_PROVIDER_LABELS,
  type PaymentGateway,
  type PaymentGatewayRequest,
} from '../../../shared/types';
import { PaymentGatewaysService } from '../../../services';
import { ManageGatewayModalComponent } from '../manage-gateway-modal/manage-gateway-modal';

@Component({
  selector: 'gateway-list',
  imports: [
    LucideDynamicIcon,
    DatePipe,
    NgTemplateOutlet,
    NgpDialogTrigger,
    Switch,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    ManageGatewayModalComponent,
  ],
  templateUrl: './gateway-list.html',
  styleUrl: './gateway-list.scss',
})
export class GatewayListComponent {
  protected readonly icons = {
    AlertIcon,
    CreditCardIcon,
    DeleteIcon,
    EditIcon,
    EyeIcon,
    InfoIcon,
    PowerIcon,
    PowerOffIcon,
    WebhookIcon,
  };

  private readonly paymentGatewaysService = inject(PaymentGatewaysService);

  protected readonly providerLabels = GATEWAY_PROVIDER_LABELS;

  protected readonly loading = signal(true);

  protected readonly activeGateway = signal<PaymentGateway | null>(null);

  protected readonly standbyGateways = signal<PaymentGateway[]>([]);

  protected readonly liveChannelCount = computed(
    () => this.activeGateway()?.paymentChannels?.filter((channel) => channel.active).length ?? 0,
  );

  constructor() {
    afterNextRender(() => {
      this.paymentGatewaysService.getPaymentGateways().subscribe({
        next: ({ active, standBy }) => {
          this.activeGateway.set(active ?? null);
          this.standbyGateways.set(standBy);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected toggleGateway(id: string, active: boolean): void {
    const demoted = this.activeGateway();

    if (!active) {
      this.activeGateway.set(null);
      if (demoted) this.standbyGateways.update((gateways) => [{ ...demoted, active }, ...gateways]);
      return;
    }

    const promoted = this.standbyGateways().find((gateway) => gateway.id === id);
    if (!promoted) return;

    this.activeGateway.set({ ...promoted, active });
    this.standbyGateways.update((gateways) => {
      const remaining = gateways.filter((gateway) => gateway.id !== id);
      return demoted ? [{ ...demoted, active: false }, ...remaining] : remaining;
    });
  }

  protected deleteGateway(id: string): void {
    this.standbyGateways.update((gateways) => gateways.filter((gateway) => gateway.id !== id));
  }

  protected updateGateway(id: string, request: PaymentGatewayRequest): void {
    if (this.activeGateway()?.id === id) {
      this.activeGateway.update((gateway) => (gateway ? { ...gateway, ...request } : gateway));
      return;
    }

    this.standbyGateways.update((gateways) =>
      gateways.map((gateway) => (gateway.id === id ? { ...gateway, ...request } : gateway)),
    );
  }
}
