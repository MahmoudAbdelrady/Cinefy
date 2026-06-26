import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { interval, takeWhile } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon } from '../../../../../shared/icons';
import { LoadingSpinnerComponent, InputOtp } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../../../services/auth';

const RESEND_COOLDOWN_SECONDS = 10 * 60;

@Component({
  selector: 'fp-otp-step',
  imports: [FormsModule, LucideDynamicIcon, LoadingSpinnerComponent, InputOtp],
  templateUrl: './otp-step.html',
  styleUrl: './otp-step.scss',
})
export class OtpStep {
  protected readonly icons = {
    ArrowRightIcon,
    ArrowLeftIcon,
    AlertIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = input<string>('');

  readonly verified = output<string>();
  readonly back = output<void>();

  protected readonly code = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly verifying = signal(false);
  protected readonly complete = signal(false);
  protected readonly resending = signal(false);
  protected readonly resendCountdown = signal(0);

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

  protected onResend() {
    if (this.resending() || this.resendCountdown() > 0) return;
    this.resending.set(true);
    this.onCodeChange('');
    this.authService
      .forgotPassword({ email: this.email() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.startResendCooldown();
          this.code.set('');
          this.error.set(null);
          this.toast.success('A new code has been sent to your email.');
        },
        error: () => this.resending.set(false),
      });
  }

  protected onSubmit() {
    if (!this.complete() || this.verifying()) return;
    this.verifying.set(true);
    const code = this.code();
    this.authService
      .verifyResetCode({ code })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.verifying.set(false);
          this.verified.emit(code);
        },
        error: (err: HttpErrorResponse) => {
          this.verifying.set(false);
          this.code.set('');
          this.error.set(err.error?.message ?? 'That code is invalid or has expired.');
        },
      });
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

  protected onBack() {
    this.back.emit();
  }
}
