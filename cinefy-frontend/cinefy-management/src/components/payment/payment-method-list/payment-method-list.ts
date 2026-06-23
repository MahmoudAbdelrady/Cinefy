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
import { LucideDynamicIcon } from '@lucide/angular';
import {
  AlertIcon,
  CircleCheckIcon,
  CreditCardIcon,
  DeleteIcon,
  EditIcon,
  EllipsisIcon,
  InfoIcon,
  PowerIcon,
  PowerOffIcon,
  RocketIcon,
  SparklesIcon,
  WebhookIcon,
  ZapIcon,
} from '../../../shared/icons';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpMenuTrigger, NgpMenu, NgpMenuItem } from 'ng-primitives/menu';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ModalComponent, LoadingSpinnerComponent, EmptyStateComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { RelativeTimePipe } from 'cinefy-ui/pipes';
import { ManagePaymentModalComponent } from '../manage-payment-modal/manage-payment-modal';
import { PaymentMethodService } from '../../../services';
import { differenceInCalendarDays } from 'date-fns';
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
    LucideDynamicIcon,
    NgpMenu,
    NgpMenuTrigger,
    NgpMenuItem,
    NgpDialogTrigger,
    NgpPopover,
    NgpPopoverTrigger,
    ModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ManagePaymentModalComponent,
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
    WebhookIcon,
    SparklesIcon,
    EllipsisIcon,
    PowerIcon,
    PowerOffIcon,
    ZapIcon,
    CircleCheckIcon,
    InfoIcon,
    RocketIcon,
  };

  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly CREDENTIALS_RECENT_DAYS = 30;
  private static readonly CREDENTIALS_DUE_DAYS = 90;
  private static readonly HEALTHY_SUCCESS_RATE = 95;
  private static readonly WATCH_SUCCESS_RATE = 80;

  protected readonly typeLabels = PAYMENT_METHOD_TYPE_LABELS;
  protected readonly statusLabels = PAYMENT_METHOD_STATUS_LABELS;

  protected readonly loading = signal(true);
  protected readonly paymentMethods = signal<PaymentMethodSummary[]>([]);
  protected readonly deletingMethodIds = signal<ReadonlySet<string>>(new Set());
  protected readonly testingMethodIds = signal<ReadonlySet<string>>(new Set());
  protected readonly updatingStatusMethodIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    afterNextRender(() => {
      this.paymentMethodService.getPaymentMethods().subscribe({
        next: (methods) => {
          this.paymentMethods.set(methods);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  addPaymentMethod(method: PaymentMethodSummary): void {
    this.paymentMethods.update((methods) => [method, ...methods]);
  }

  protected updatePaymentMethod(method: PaymentMethodSummary): void {
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
        error: () => this.clearInFlight(this.updatingStatusMethodIds, id),
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
        error: () => this.clearInFlight(this.testingMethodIds, id),
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
        error: () => this.clearInFlight(this.deletingMethodIds, id),
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
        return this.icons.WebhookIcon;
      case 'INSTALLMENT':
        return this.icons.SparklesIcon;
    }
  }

  protected getRotationStatus(method: PaymentMethodSummary): 'recent' | 'due' | 'overdue' {
    const rotatedAt = new Date(method.credentialsRotatedAt);
    const daysSinceRotation = differenceInCalendarDays(new Date(), rotatedAt);

    if (daysSinceRotation < PaymentMethodListComponent.CREDENTIALS_RECENT_DAYS) {
      return 'recent';
    } else if (daysSinceRotation < PaymentMethodListComponent.CREDENTIALS_DUE_DAYS) {
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
    if (value >= PaymentMethodListComponent.HEALTHY_SUCCESS_RATE) return 'healthy';
    if (value >= PaymentMethodListComponent.WATCH_SUCCESS_RATE) return 'watch';
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
