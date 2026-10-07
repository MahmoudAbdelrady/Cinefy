import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule } from '@angular/forms';
import { finalize, interval, takeWhile } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon } from '../../../../../shared/icons';
import { CinefyLoadingSpinner, CinefyInputOtp } from 'cinefy-ui/components';
import { CinefyToastService } from 'cinefy-ui/services';
import { AuthService } from '../../../../../services/auth';

const RESEND_COOLDOWN_SECONDS = 3 * 60;

@Component({
  selector: 'fp-otp-step',
  imports: [FormsModule, LucideDynamicIcon, CinefyLoadingSpinner, CinefyInputOtp],
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
  private readonly toast = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = input<string>('');

  readonly verified = output<string>();
  readonly back = output<void>();

  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);
  protected readonly resendCountdown = signal(0);

  protected readonly complete = signal(false);

  protected readonly code = new FormControl('', { nonNullable: true });

  protected readonly resendLabel = computed(() => {
    const seconds = this.resendCountdown();
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `You can resend in ${minutes}:${String(remainder).padStart(2, '0')}`;
  });

  constructor() {
    effect(() => {
      if (this.verifying() || this.resending()) {
        this.code.disable({ emitEvent: false });
      } else {
        this.code.enable({ emitEvent: false });
      }
    });
  }

  protected onResend() {
    if (this.resending() || this.resendCountdown() > 0) return;
    this.resending.set(true);
    this.authService
      .forgotPassword({ email: this.email() })
      .pipe(
        finalize(() => this.resending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.code.setValue('');
          this.startResendCooldown();
          this.toast.success('A new code has been sent to your email.');
        },
        error: () => {},
      });
  }

  protected onSubmit() {
    if (!this.complete() || this.verifying()) return;
    this.verifying.set(true);
    const code = this.code.value;
    this.authService
      .verifyResetCode({ code })
      .pipe(
        finalize(() => this.verifying.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.verified.emit(code),
        error: () => this.code.setValue(''),
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
