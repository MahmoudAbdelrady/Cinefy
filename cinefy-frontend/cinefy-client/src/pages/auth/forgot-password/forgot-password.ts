import { Component, signal } from '@angular/core';
import { OtpStep } from '../../../components';
import {
  DoneStep,
  type ForgotPasswordStage,
  ProgressDots,
  RequestStep,
  ResetStep,
} from '../../../components/auth/forgot-password';

@Component({
  selector: 'forgot-password-page',
  imports: [ProgressDots, RequestStep, OtpStep, ResetStep, DoneStep],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  protected readonly stage = signal<ForgotPasswordStage>('request');
  protected readonly email = signal('');

  protected onRequested(email: string) {
    this.email.set(email);
    this.stage.set('otp');
  }

  protected onVerified() {
    this.stage.set('reset');
  }

  protected onBackToRequest() {
    this.stage.set('request');
  }

  protected onReset() {
    this.stage.set('done');
  }
}
