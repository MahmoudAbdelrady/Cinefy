import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
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

type PaymentMethodKind = 'CARD' | 'WALLET' | 'INSTALLMENT';
type PaymentMethodTestStatus = 'UNTESTED' | 'SUCCESS' | 'FAILURE';

interface PaymentMethod {
  id: string;
  name: string;
  paymentType: PaymentMethodKind;
  type: 'production' | 'sandbox';
  status: 'active' | 'disabled' | 'draft';
  testStatus: PaymentMethodTestStatus;
  testFailureReason: string | null;
  testedAt: string | null;
  currency: string;
  successRate30d: string;
  createdAt: string;
  credentialsRotatedAt: string;
}

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

  protected readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'pm_01',
      name: 'Paymob — Cards',
      paymentType: 'CARD',
      type: 'production',
      status: 'active',
      testStatus: 'SUCCESS',
      testFailureReason: null,
      testedAt: '2026-05-06T08:14:00',
      currency: 'EGP',
      successRate30d: '98.4%',
      createdAt: '2026-02-12',
      credentialsRotatedAt: '2026-04-19',
    },
    {
      id: 'pm_02',
      name: 'Paymob — Wallets',
      paymentType: 'WALLET',
      type: 'production',
      status: 'draft',
      testStatus: 'SUCCESS',
      testFailureReason: null,
      testedAt: '2026-05-09T05:42:00',
      currency: 'EGP',
      successRate30d: '0.0%',
      createdAt: '2026-04-28',
      credentialsRotatedAt: '2026-04-28',
    },
    {
      id: 'pm_03',
      name: 'Paymob — Installments',
      paymentType: 'INSTALLMENT',
      type: 'sandbox',
      status: 'disabled',
      testStatus: 'FAILURE',
      testFailureReason:
        'HMAC verification failed for integration 4710228 — the signing secret on Paymob has been rotated since this method was last saved.',
      testedAt: '2026-04-30T18:42:00',
      currency: 'EGP',
      successRate30d: '64.2%',
      createdAt: '2026-03-01',
      credentialsRotatedAt: '2026-03-01',
    },
    {
      id: 'pm_04',
      name: 'Paymob — Cards (Legacy)',
      paymentType: 'CARD',
      type: 'production',
      status: 'active',
      testStatus: 'UNTESTED',
      testFailureReason: null,
      testedAt: null,
      currency: 'EGP',
      successRate30d: '91.7%',
      createdAt: '2025-08-14',
      credentialsRotatedAt: '2026-01-15',
    },
  ];

  protected getPaymentTypeIcon(paymentType: PaymentMethodKind) {
    switch (paymentType) {
      case 'CARD':
        return this.CardIcon;
      case 'WALLET':
        return this.WalletIcon;
      case 'INSTALLMENT':
        return this.InstallmentIcon;
    }
  }

  protected getPaymentTypeLabel(paymentType: PaymentMethodKind): string {
    switch (paymentType) {
      case 'CARD':
        return 'Card';
      case 'WALLET':
        return 'Wallet';
      case 'INSTALLMENT':
        return 'Installment';
    }
  }

  protected getRotationStatus(method: PaymentMethod): 'recent' | 'due' | 'overdue' {
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

  protected getSuccessRateTone(rate: string): 'healthy' | 'watch' | 'degraded' | 'empty' {
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
