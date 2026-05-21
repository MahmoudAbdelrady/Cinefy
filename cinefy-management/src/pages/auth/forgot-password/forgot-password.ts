import { Component, signal } from '@angular/core';
import {
  DoneStep,
  type ForgotPasswordStage,
  OtpStep,
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
  protected readonly username = signal('');

  protected onRequested(username: string) {
    this.username.set(username);
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
