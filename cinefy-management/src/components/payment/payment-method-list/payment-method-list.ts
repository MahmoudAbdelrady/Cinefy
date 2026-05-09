import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CircleAlert,
  CircleCheck,
  CreditCard,
  EllipsisVertical,
  Info,
  LucideAngularModule,
  Power,
  PowerOff,
  Rocket,
  Sparkles,
  SquarePen,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpMenuTrigger, NgpMenu, NgpMenuItem } from 'ng-primitives/menu';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ModalComponent } from '../../modal/modal';
import { RelativeTimePipe } from '../../../shared/pipes';
import { PaymentMethodService } from '../../../services';
import {
  PAYMENT_METHOD_STATUS_LABELS,
  PAYMENT_METHOD_TYPE_LABELS,
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
    NgpButton,
    DatePipe,
    RelativeTimePipe,
  ],
  templateUrl: './payment-method-list.html',
  styleUrl: './payment-method-list.scss',
})
export class PaymentMethodListComponent {
  protected readonly CardIcon = CreditCard;
  protected readonly WalletIcon = Webhook;
  protected readonly InstallmentIcon = Sparkles;
  protected readonly MenuIcon = EllipsisVertical;
  protected readonly PowerIcon = Power;
  protected readonly PowerOffIcon = PowerOff;
  protected readonly EditIcon = SquarePen;
  protected readonly ZapIcon = Zap;
  protected readonly CheckIcon = CircleCheck;
  protected readonly AlertIcon = CircleAlert;
  protected readonly InfoIcon = Info;
  protected readonly RocketIcon = Rocket;
  protected readonly DeleteIcon = Trash2;

  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly typeLabels = PAYMENT_METHOD_TYPE_LABELS;
  protected readonly statusLabels = PAYMENT_METHOD_STATUS_LABELS;

  protected readonly paymentMethods = signal<PaymentMethodSummary[]>([]);

  constructor() {
    this.paymentMethodService
      .getPaymentMethods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((methods) => this.paymentMethods.set(methods));
  }

  protected getPaymentTypeIcon(type: PaymentMethodType) {
    switch (type) {
      case 'CARD':
        return this.CardIcon;
      case 'WALLET':
        return this.WalletIcon;
      case 'INSTALLMENT':
        return this.InstallmentIcon;
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
