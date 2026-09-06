import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CinefyToastService } from 'cinefy-ui/services';
import { OtpStep } from '../../../components';
import {
  DoneStep,
  type ForgotPasswordStage,
  ProgressDots,
  RequestStep,
  ResetStep,
} from '../../../components/auth/forgot-password';
import { AuthService } from '../../../services';

@Component({
  selector: 'forgot-password-page',
  imports: [ProgressDots, RequestStep, OtpStep, ResetStep, DoneStep],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stage = signal<ForgotPasswordStage>('request');

  protected readonly email = signal('');
  protected readonly code = signal('');

  protected readonly verifyOtp = (code: string) =>
    this.authService.verifyOtp({ code, otpType: 'RESET_PASSWORD' });

  protected onRequested(email: string) {
    this.email.set(email);
    this.stage.set('otp');
  }

  protected onVerified(code: string) {
    this.code.set(code);
    this.stage.set('reset');
  }

  protected onBackToRequest() {
    this.stage.set('request');
  }

  protected onReset() {
    this.stage.set('done');
  }

  protected onRequestNewCode() {
    this.authService
      .sendOtp({ email: this.email(), otpType: 'RESET_PASSWORD' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.code.set('');
        this.stage.set('otp');
        this.toastService.success('A new code has been sent to your email.');
      });
  }
}
