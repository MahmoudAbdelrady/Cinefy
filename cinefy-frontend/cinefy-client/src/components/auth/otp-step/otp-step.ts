import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, interval, takeWhile } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputOtp, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../services';
import type { OtpType } from '../../../shared/types';
import { ArrowLeftIcon, ArrowRightIcon } from '../../../shared/icons';

const RESEND_COOLDOWN_SECONDS = 10 * 60;

@Component({
  selector: 'auth-otp-step',
  imports: [FormsModule, LucideDynamicIcon, InputOtp, LoadingSpinnerComponent],
  templateUrl: './otp-step.html',
  styleUrl: './otp-step.scss',
})
export class OtpStep {
  protected readonly icons = {
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly heading = input.required<string>();
  readonly subheading = input.required<string>();
  readonly showBack = input(true);
  readonly email = input.required<string>();
  readonly otpType = input.required<OtpType>();
  readonly verifyFn = input.required<(code: string) => Observable<void>>();

  readonly verified = output<string>();
  readonly back = output<void>();

  protected readonly code = signal('');
  protected readonly complete = signal(false);
  protected readonly resendCountdown = signal(0);
  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly resendLabel = computed(() => {
    const seconds = this.resendCountdown();
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `You can resend in ${minutes}:${String(remainder).padStart(2, '0')}`;
  });

  protected onCodeChange(next: string) {
    this.code.set(next);
    if (this.error()) this.error.set(null);
  }

  protected onSubmit() {
    if (!this.complete() || this.verifying()) return;
    this.verifying.set(true);

    const code = this.code();
    this.verifyFn()(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.verified.emit(code),
        error: (err: HttpErrorResponse) => {
          this.verifying.set(false);
          this.code.set('');
          this.error.set(err.error?.message ?? 'That code is invalid or has expired.');
        },
      });
  }

  protected onResend() {
    if (this.resendCountdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.onCodeChange('');

    this.authService
      .sendOtp({ email: this.email(), otpType: this.otpType() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.startResendCooldown();
          this.toastService.success('A new code has been sent to your email.');
        },
        error: () => this.resending.set(false),
      });
  }

  protected onBack() {
    this.back.emit();
  }

  private startResendCooldown() {
    this.resendCountdown.set(RESEND_COOLDOWN_SECONDS);
    interval(1000)
      .pipe(
        takeWhile(() => this.resendCountdown() > 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resendCountdown.update((seconds) => seconds - 1));
  }
}
