import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Check, CreditCard, Eye, EyeOff, LucideAngularModule, X, Zap } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner';
import { PaymentMethodService } from '../../../../services';
import {
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethod,
  type PaymentMethodTestStatus,
} from '../../../../shared/types';

interface TestResultState {
  testStatus: PaymentMethodTestStatus;
  testFailureReason?: string;
}

@Component({
  selector: 'review-step',
  imports: [LucideAngularModule, NgpButton, LoadingSpinnerComponent],
  templateUrl: './review-step.html',
  styleUrl: './review-step.scss',
})
export class ReviewStep {
  protected readonly CreditCardIcon = CreditCard;
  protected readonly CheckIcon = Check;
  protected readonly XIcon = X;
  protected readonly ZapIcon = Zap;
  protected readonly EyeIcon = Eye;
  protected readonly EyeOffIcon = EyeOff;

  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = input.required<PaymentMethod>();
  readonly connectionTestRequested = output<void>();

  protected readonly typeLabels = PAYMENT_METHOD_TYPE_LABELS;

  protected readonly showSecretKey = signal(false);
  protected readonly showHmacSecret = signal(false);

  protected readonly loading = signal(false);
  protected readonly testResult = signal<TestResultState>({ testStatus: 'UNTESTED' });

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
    this.paymentMethodService
      .testConnection({ secretKey, integrationId, currency })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.testResult.set({ testStatus: 'SUCCESS' });
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.testResult.set({
            testStatus: 'FAILURE',
            testFailureReason: err.error?.message ?? 'Connection failed',
          });
          this.loading.set(false);
        },
      });
  }
}
