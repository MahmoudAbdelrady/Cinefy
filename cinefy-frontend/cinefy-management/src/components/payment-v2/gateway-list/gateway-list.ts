import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  ModalComponent,
  Switch,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
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
import { PAYMENT_PROVIDERS } from '../provider-spec';

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
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly providerLabels = GATEWAY_PROVIDER_LABELS;

  protected readonly loading = signal(true);

  protected readonly togglingGateway = signal(false);

  protected readonly activeGateway = signal<PaymentGateway | null>(null);

  protected readonly standbyGateways = signal<PaymentGateway[]>([]);

  protected readonly activeGatewayHasNoLiveChannel = computed(() => {
    const gateway = this.activeGateway();
    if (!gateway) return false;

    const spec = PAYMENT_PROVIDERS.find(({ provider }) => provider === gateway.provider);
    if (!spec?.supportsChannels || !spec.channelsRequired) return false;

    return !gateway.paymentChannels?.some((channel) => channel.active);
  });

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

  protected toggleGateway(id: string, active: boolean, close: () => void): void {
    if (this.togglingGateway()) return;
    this.togglingGateway.set(true);

    this.paymentGatewaysService
      .updatePaymentGatewayStatus(id, active)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.applyStatusChange(id, active);
          this.togglingGateway.set(false);
          this.toastService.success(
            active ? 'Payment gateway activated' : 'Payment gateway deactivated',
          );
          close();
        },
        error: () => this.togglingGateway.set(false),
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

  private applyStatusChange(id: string, active: boolean): void {
    const demoted = this.activeGateway();

    if (!active) {
      this.activeGateway.set(null);
      if (demoted) {
        this.standbyGateways.update((gateways) => this.addStandbyGateway(gateways, demoted));
      }
      return;
    }

    const promoted = this.standbyGateways().find((gateway) => gateway.id === id);
    if (!promoted) return;

    this.activeGateway.set({ ...promoted, active });
    this.standbyGateways.update((gateways) => {
      const remaining = gateways.filter((gateway) => gateway.id !== id);
      return demoted ? this.addStandbyGateway(remaining, demoted) : remaining;
    });
  }

  private addStandbyGateway(gateways: PaymentGateway[], gateway: PaymentGateway): PaymentGateway[] {
    return [...gateways, { ...gateway, active: false }].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}
