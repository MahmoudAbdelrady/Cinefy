import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { Tooltip } from 'primeng/tooltip';
import {
  CinefyEmptyState,
  CinefyLoadingSpinner,
  CinefyDialog,
  CinefyDialogFooter,
  CinefySwitch,
} from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
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
import { GATEWAY_PROVIDER_LABELS, type PaymentGateway } from '../../../shared/types';
import { PaymentGatewaysService } from '../../../services';
import { ManageGatewayModalComponent } from '../manage-gateway-modal/manage-gateway-modal';
import { PAYMENT_PROVIDERS } from '../provider-spec';

@Component({
  selector: 'gateway-list',
  imports: [
    LucideDynamicIcon,
    Tooltip,
    DatePipe,
    NgTemplateOutlet,
    CinefySwitch,
    CinefyEmptyState,
    CinefyLoadingSpinner,
    CinefyDialog,
    CinefyDialogFooter,
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
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly providerLabels = GATEWAY_PROVIDER_LABELS;

  protected readonly loading = signal(true);

  protected readonly togglingGateway = signal(false);
  protected readonly deletingGatewayIds = signal<Set<string>>(new Set());

  protected readonly activeGateway = signal<PaymentGateway | null>(null);

  protected readonly standbyGateways = signal<PaymentGateway[]>([]);

  protected readonly gatewayToToggle = signal<PaymentGateway | null>(null);
  protected readonly gatewayToViewChannels = signal<PaymentGateway | null>(null);
  protected readonly gatewayToEdit = signal<PaymentGateway | null>(null);
  protected readonly gatewayToDelete = signal<PaymentGateway | null>(null);

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

  addGateway(gateway: PaymentGateway): void {
    this.standbyGateways.update((gateways) => this.addStandbyGateway(gateways, gateway));
  }

  protected isDeleting(id: string): boolean {
    return this.deletingGatewayIds().has(id);
  }

  protected toggleGateway(id: string, active: boolean): void {
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
          this.gatewayToToggle.set(null);
        },
        error: () => this.togglingGateway.set(false),
      });
  }

  protected deleteGateway(id: string): void {
    if (this.isDeleting(id)) return;
    this.markDeleting(id, true);

    this.paymentGatewaysService
      .deletePaymentGateway(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.standbyGateways.update((gateways) =>
            gateways.filter((gateway) => gateway.id !== id),
          );
          this.markDeleting(id, false);
          this.toastService.success('Payment gateway deleted');
          this.gatewayToDelete.set(null);
        },
        error: () => this.markDeleting(id, false),
      });
  }

  protected updateGateway(updated: PaymentGateway): void {
    if (this.activeGateway()?.id === updated.id) {
      this.activeGateway.set(updated);
      return;
    }

    this.standbyGateways.update((gateways) =>
      gateways.map((gateway) => (gateway.id === updated.id ? updated : gateway)),
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

  private markDeleting(id: string, isDeleting: boolean): void {
    this.deletingGatewayIds.update((current) => {
      const next = new Set(current);
      if (isDeleting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private addStandbyGateway(gateways: PaymentGateway[], gateway: PaymentGateway): PaymentGateway[] {
    return [...gateways, { ...gateway, active: false }].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}
