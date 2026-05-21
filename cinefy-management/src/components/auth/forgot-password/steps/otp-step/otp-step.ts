import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArrowLeft, ArrowRight, CircleAlert, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { LoadingSpinnerComponent } from '../../../../loading-spinner/loading-spinner';
import { InputOtp } from '../../../input-otp/input-otp';

const INVALID_TEST_CODE = '000000';

@Component({
  selector: 'fp-otp-step',
  imports: [FormsModule, LucideAngularModule, NgpButton, LoadingSpinnerComponent, InputOtp],
  templateUrl: './otp-step.html',
  styleUrl: './otp-step.scss',
})
export class OtpStep {
  protected readonly icons = {
    ArrowRightIcon: ArrowRight,
    ArrowLeftIcon: ArrowLeft,
    AlertIcon: CircleAlert,
  };

  readonly username = input<string>('');

  readonly verified = output<void>();
  readonly back = output<void>();

  protected readonly code = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly verifying = signal(false);
  protected readonly complete = signal(false);

  protected onCodeChange(next: string) {
    this.code.set(next);
    if (this.error()) this.error.set(null);
  }

  protected onSubmit() {
    if (!this.complete() || this.verifying()) return;
    this.verifying.set(true);
    const code = this.code();
    setTimeout(() => {
      this.verifying.set(false);
      if (code === INVALID_TEST_CODE) {
        this.code.set('');
        this.error.set('That code is invalid or has expired.');
        return;
      }
      this.verified.emit();
    }, 1000);
  }

  protected onBack() {
    this.back.emit();
  }
}
