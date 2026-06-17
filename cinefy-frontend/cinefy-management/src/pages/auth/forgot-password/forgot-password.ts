import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DoneStep,
  type ForgotPasswordStage,
  OtpStep,
  ProgressDots,
  RequestStep,
  ResetStep,
} from '../../../components/auth/forgot-password';
import { AuthService } from '../../../services/auth';
import { ToastService } from 'cinefy-ui/services';

@Component({
  selector: 'forgot-password-page',
  imports: [ProgressDots, RequestStep, OtpStep, ResetStep, DoneStep],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stage = signal<ForgotPasswordStage>('request');
  protected readonly username = signal('');
  protected readonly code = signal('');
  private readonly requestingNewCode = signal(false);

  protected onRequested(username: string) {
    this.username.set(username);
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
    if (this.requestingNewCode()) return;
    this.requestingNewCode.set(true);
    this.authService
      .forgotPassword({ username: this.username() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requestingNewCode.set(false);
          this.code.set('');
          this.stage.set('otp');
          this.toast.success('We sent a new code to your email.');
        },
        error: () => this.requestingNewCode.set(false),
      });
  }
}
