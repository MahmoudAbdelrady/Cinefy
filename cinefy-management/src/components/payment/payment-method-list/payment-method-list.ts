import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CircleCheck,
  EllipsisVertical,
  Info,
  LucideAngularModule,
  Power,
  PowerOff,
  Rocket,
  Sparkles,
  Webhook,
  Zap,
} from 'lucide-angular';
import {
  AlertIcon,
  CreditCardIcon,
  DeleteIcon,
  EditIcon,
} from '../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpMenuTrigger, NgpMenu, NgpMenuItem } from 'ng-primitives/menu';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ModalComponent } from '../../modal/modal';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { ManagePaymentModalComponent } from '../manage-payment-modal/manage-payment-modal';
import { RelativeTimePipe } from '../../../shared/pipes';
import { PaymentMethodService, ToastService } from '../../../services';
import {
  PAYMENT_METHOD_STATUS_LABELS,
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethodStatus,
  type PaymentMethodSummary,
  type PaymentMethodType,
} from '../../../shared/types';

@Component({
  selector: 'payment-method-list',
  imports: [
    LucideAngularModule,
    NgpMenu,
    NgpMenuTrigger,
    NgpMenuItem,
    NgpDialogTrigger,
    NgpPopover,
    NgpPopoverTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    ManagePaymentModalComponent,
    NgpButton,
    DatePipe,
    RelativeTimePipe,
  ],
  templateUrl: './payment-method-list.html',
  styleUrl: './payment-method-list.scss',
})
export class PaymentMethodListComponent {
  protected readonly icons = {
    AlertIcon,
    CreditCardIcon,
    DeleteIcon,
    EditIcon,
    WalletIcon: Webhook,
    InstallmentIcon: Sparkles,
    MenuIcon: EllipsisVertical,
    PowerIcon: Power,
    PowerOffIcon: PowerOff,
    ZapIcon: Zap,
    CheckIcon: CircleCheck,
    InfoIcon: Info,
    RocketIcon: Rocket,
  };

  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly typeLabels = PAYMENT_METHOD_TYPE_LABELS;
  protected readonly statusLabels = PAYMENT_METHOD_STATUS_LABELS;

  protected readonly loading = signal(true);
  protected readonly paymentMethods = signal<PaymentMethodSummary[]>([]);
  protected readonly deletingMethodIds = signal<ReadonlySet<string>>(new Set());
  protected readonly testingMethodIds = signal<ReadonlySet<string>>(new Set());
  protected readonly updatingStatusMethodIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    afterNextRender(() => {
      this.paymentMethodService
        .getPaymentMethods()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (methods) => {
            this.paymentMethods.set(methods);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to load payment methods');
          },
        });
    });
  }

  addPaymentMethod(method: PaymentMethodSummary): void {
    this.paymentMethods.update((methods) => [method, ...methods]);
  }

  updatePaymentMethod(method: PaymentMethodSummary): void {
    this.paymentMethods.update((methods) => methods.map((m) => (m.id === method.id ? method : m)));
  }

  protected updateStatus(id: string, status: PaymentMethodStatus): void {
    if (this.updatingStatusMethodIds().has(id)) return;
    this.markInFlight(this.updatingStatusMethodIds, id);
    this.paymentMethodService
      .updatePaymentMethodStatus(id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.paymentMethods.update((methods) =>
            methods.map((m) => (m.id === id ? { ...m, status } : m)),
          );
          this.clearInFlight(this.updatingStatusMethodIds, id);
          this.toastService.success('Status updated');
        },
        error: (err: HttpErrorResponse) => {
          this.clearInFlight(this.updatingStatusMethodIds, id);
          this.toastService.error(err.error?.message ?? 'Failed to update status');
        },
      });
  }

  protected runTestConnection(id: string): void {
    if (this.testingMethodIds().has(id)) return;
    this.markInFlight(this.testingMethodIds, id);
    this.paymentMethodService
      .testPaymentMethodConnection(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.paymentMethods.update((methods) =>
            methods.map((m) =>
              m.id === id
                ? {
                    ...m,
                    testStatus: result.testStatus,
                    testFailureReason: result.testFailureReason,
                    testedAt: new Date().toISOString(),
                  }
                : m,
            ),
          );
          this.clearInFlight(this.testingMethodIds, id);
          if (result.testStatus === 'SUCCESS') {
            this.toastService.success('Connection test passed');
          } else {
            this.toastService.error(result.testFailureReason ?? 'Connection test failed');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.clearInFlight(this.testingMethodIds, id);
          this.toastService.error(err.error?.message ?? 'Failed to run test connection');
        },
      });
  }

  protected deletePaymentMethod(id: string, close: () => void): void {
    if (this.deletingMethodIds().has(id)) return;
    this.markInFlight(this.deletingMethodIds, id);
    this.paymentMethodService
      .deletePaymentMethod(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.paymentMethods.update((methods) => methods.filter((m) => m.id !== id));
          this.clearInFlight(this.deletingMethodIds, id);
          this.toastService.success('Payment method deleted');
          close();
        },
        error: (err: HttpErrorResponse) => {
          this.clearInFlight(this.deletingMethodIds, id);
          this.toastService.error(err.error?.message ?? 'Failed to delete payment method');
        },
      });
  }

  private markInFlight(set: WritableSignal<ReadonlySet<string>>, id: string): void {
    set.update((current) => new Set(current).add(id));
  }

  private clearInFlight(set: WritableSignal<ReadonlySet<string>>, id: string): void {
    set.update((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  protected getPaymentTypeIcon(type: PaymentMethodType) {
    switch (type) {
      case 'CARD':
        return this.icons.CreditCardIcon;
      case 'WALLET':
        return this.icons.WalletIcon;
      case 'INSTALLMENT':
        return this.icons.InstallmentIcon;
    }
  }

  protected getRotationStatus(method: PaymentMethodSummary): 'recent' | 'due' | 'overdue' {
    const now = new Date();
    const rotatedAt = new Date(method.credentialsRotatedAt);
    const daysSinceRotation = (now.getTime() - rotatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceRotation < 30) {
      return 'recent';
    } else if (daysSinceRotation < 90) {
      return 'due';
    } else {
      return 'overdue';
    }
  }

  protected getSuccessRateTone(rate?: string): 'healthy' | 'watch' | 'degraded' | 'empty' {
    if (!rate) return 'empty';
    const match = /^(-?\d+(\.\d+)?)\s*%?$/.exec(rate.trim());
    if (!match) return 'empty';
    const value = parseFloat(match[1]);
    if (isNaN(value) || value === 0) return 'empty';
    if (value >= 95) return 'healthy';
    if (value >= 80) return 'watch';
    return 'degraded';
  }

  protected getSuccessRateLabel(tone: 'healthy' | 'watch' | 'degraded' | 'empty'): string {
    switch (tone) {
      case 'healthy':
        return 'Healthy';
      case 'watch':
        return 'Watch';
      case 'degraded':
        return 'Degraded';
      case 'empty':
        return 'No data yet';
    }
  }
}
