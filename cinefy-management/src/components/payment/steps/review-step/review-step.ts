import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import {
  CheckIcon,
  CreditCardIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  ZapIcon,
} from '../../../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { RelativeTimePipe } from 'cinefy-ui/pipes';
import { PaymentMethodService } from '../../../../services';
import {
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethod,
  type PaymentMethodTestStatus,
} from '../../../../shared/types';

export interface TestResultState {
  testStatus: PaymentMethodTestStatus;
  testFailureReason?: string;
  fromPriorSession?: boolean;
  testedAt?: string;
}

@Component({
  selector: 'review-step',
  imports: [LucideAngularModule, NgpButton, LoadingSpinnerComponent, RelativeTimePipe],
  templateUrl: './review-step.html',
  styleUrl: './review-step.scss',
})
export class ReviewStep {
  protected readonly icons = {
    CheckIcon,
    CreditCardIcon,
    EyeIcon,
    XIcon,
    ZapIcon,
    EyeOffIcon,
  };

  private readonly paymentMethodService = inject(PaymentMethodService);

  readonly data = input.required<PaymentMethod>();
  readonly methodId = input<string | null>(null);
  readonly initialTestResult = input<TestResultState | null>(null);
  readonly connectionTestRequested = output<void>();

  protected readonly typeLabels = PAYMENT_METHOD_TYPE_LABELS;

  protected readonly showSecretKey = signal(false);
  protected readonly showHmacSecret = signal(false);

  protected readonly loading = signal(false);
  protected readonly testResult = signal<TestResultState>({ testStatus: 'UNTESTED' });

  constructor() {
    effect(() => {
      const initial = this.initialTestResult();
      if (initial) {
        this.testResult.set({ ...initial, fromPriorSession: true });
      }
    });
  }

  protected mask(value: string): string {
    return value ? '•'.repeat(value.length) : '—';
  }

  protected toggleSecretKey() {
    this.showSecretKey.update((v) => !v);
  }

  protected toggleHmacSecret() {
    this.showHmacSecret.update((v) => !v);
  }

  protected runTest() {
    if (this.loading()) return;
    this.loading.set(true);
    this.connectionTestRequested.emit();
    const { secretKey, integrationId, currency } = this.data();
    const methodId = this.methodId();
    this.paymentMethodService
      .testConnection({
        paymentMethodId: methodId ?? undefined,
        secretKey: secretKey || undefined,
        integrationId,
        currency,
      })
      .subscribe({
        next: () => {
          this.testResult.set({ testStatus: 'SUCCESS', fromPriorSession: false });
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.testResult.set({
            testStatus: 'FAILURE',
            testFailureReason: err.error?.message ?? 'Connection failed',
            fromPriorSession: false,
          });
          this.loading.set(false);
        },
      });
  }
}
