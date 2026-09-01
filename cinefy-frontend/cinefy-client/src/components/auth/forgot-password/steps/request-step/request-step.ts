import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { InputFieldV2, LoadingSpinnerComponent } from 'cinefy-ui/components';
import { EMAIL_PATTERN } from '../../../../../shared/validation';
import { AuthService } from '../../../../../services';
import { ArrowLeftIcon, ArrowRightIcon, EmailIcon } from '../../../../../shared/icons';

@Component({
  selector: 'fp-request-step',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideDynamicIcon,
    InputFieldV2,
    LoadingSpinnerComponent,
  ],
  templateUrl: './request-step.html',
  styleUrl: './request-step.scss',
})
export class RequestStep {
  protected readonly icons = {
    EmailIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
  };

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly requested = output<string>();

  protected readonly submitting = signal(false);

  protected readonly requestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
  });

  protected onSubmit() {
    if (this.requestForm.invalid || this.submitting()) return;
    this.submitting.set(true);

    const email = this.requestForm.controls.email.value;
    this.authService
      .sendOtp({ email, otpType: 'RESET_PASSWORD' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.requested.emit(email);
        },
        error: () => this.submitting.set(false),
      });
  }
}
