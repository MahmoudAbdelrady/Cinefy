import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  Check,
  CircleAlert,
  CircleCheck,
  CreditCard,
  EllipsisVertical,
  LucideAngularModule,
  Power,
  PowerOff,
  Rocket,
  SquarePen,
  Trash2,
  Zap,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenuTrigger } from 'ng-primitives/menu';
import { RelativeTimePipe } from '../../../shared/pipes';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'production' | 'sandbox';
  status: 'active' | 'disabled' | 'draft';
  lastTestStatus?: 'success' | 'failure';
  currency: string;
  monthVolume: number; // in cents
  successRate: number; // percentage from 0 to 100
  createdAt: string; // ISO date string
  publishedAt: string; // ISO date string
  credentialsRotatedAt: string; // ISO date string
  lastChargeAt: string; // ISO date string
}

@Component({
  selector: 'payment-method-list',
  imports: [
    LucideAngularModule,
    NgpMenuTrigger,
    CurrencyPipe,
    DecimalPipe,
    NgpButton,
    RelativeTimePipe,
  ],
  templateUrl: './payment-method-list.html',
  styleUrl: './payment-method-list.scss',
})
export class PaymentMethodListComponent {
  protected readonly CreditCardIcon = CreditCard;
  protected readonly MenuIcon = EllipsisVertical;
  protected readonly PowerIcon = Power;
  protected readonly PowerOffIcon = PowerOff;
  protected readonly EditIcon = SquarePen;
  protected readonly ZapIcon = Zap;
  protected readonly CheckIcon = CircleCheck;
  protected readonly AlertIcon = CircleAlert;
  protected readonly RocketIcon = Rocket;
  protected readonly DeleteIcon = Trash2;

  protected readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'pm_01',
      name: 'Paymob — Cards (Live)',
      type: 'production',
      status: 'active',
      lastTestStatus: 'success',
      currency: 'EGP',
      monthVolume: 14238000,
      successRate: 98.4,
      createdAt: '2026-02-12',
      publishedAt: '2026-02-14',
      credentialsRotatedAt: '2026-04-19',
      lastChargeAt: '2026-05-01T07:42:00',
    },
    {
      id: 'pm_02',
      name: 'Paymob — Wallets',
      type: 'production',
      status: 'draft',
      lastTestStatus: 'success',
      currency: 'EGP',
      monthVolume: 0,
      successRate: 0,
      createdAt: '2026-04-28',
      publishedAt: '',
      credentialsRotatedAt: '2026-04-28',
      lastChargeAt: '',
    },
    {
      id: 'pm_03',
      name: 'Paymob — Installments',
      type: 'sandbox',
      status: 'disabled',
      lastTestStatus: 'failure',
      currency: 'EGP',
      monthVolume: 0,
      successRate: 64.2,
      createdAt: '2026-03-01',
      publishedAt: '2026-03-05',
      credentialsRotatedAt: '2026-03-01',
      lastChargeAt: '2026-04-08T19:14:00',
    },
    {
      id: 'pm_04',
      name: 'Paymob — Cards (Legacy)',
      type: 'production',
      status: 'active',
      lastTestStatus: 'success',
      currency: 'EGP',
      monthVolume: 3894000,
      successRate: 91.7,
      createdAt: '2025-08-14',
      publishedAt: '2025-08-16',
      credentialsRotatedAt: '2026-01-15',
      lastChargeAt: '2026-04-30T22:08:00',
    },
  ];

  protected getRotationStatus(method: PaymentMethod): 'recent' | 'due' | 'overdue' {
    const now = new Date();
    const rotatedAt = new Date(method.credentialsRotatedAt);
    const daysSinceRotation = (now.getTime() - rotatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceRotation < 30) {
      return 'recent';
    } else if (daysSinceRotation < 60) {
      return 'due';
    } else {
      return 'overdue';
    }
  }
}
