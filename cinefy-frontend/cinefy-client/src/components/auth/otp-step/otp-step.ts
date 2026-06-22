import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { interval, takeWhile } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputOtp } from 'cinefy-ui/components';
import { ArrowLeftIcon, ArrowRightIcon } from '../../../shared/icons';

const RESEND_COOLDOWN_SECONDS = 10 * 60;

@Component({
  selector: 'auth-otp-step',
  imports: [FormsModule, LucideDynamicIcon, InputOtp],
  templateUrl: './otp-step.html',
  styleUrl: './otp-step.scss',
})
export class OtpStep {
  protected readonly icons = {
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  readonly heading = input.required<string>();
  readonly subheading = input.required<string>();
  readonly showBack = input(true);

  readonly verified = output<string>();
  readonly back = output<void>();

  protected readonly code = signal('');
  protected readonly complete = signal(false);
  protected readonly resendCountdown = signal(0);

  protected readonly resendLabel = computed(() => {
    const seconds = this.resendCountdown();
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `You can resend in ${minutes}:${String(remainder).padStart(2, '0')}`;
  });

  protected onResend() {
    if (this.resendCountdown() > 0) return;
    this.code.set('');
    this.startResendCooldown();
  }

  protected onSubmit() {
    if (!this.complete()) return;
    this.verified.emit(this.code());
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
